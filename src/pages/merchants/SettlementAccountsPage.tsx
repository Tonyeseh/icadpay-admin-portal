import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeftIcon, ChevronRightIcon, FilterIcon, ShieldCheckIcon, XCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatAdminSettlementBankError, type AdminApiError } from "@/lib/admin-catalog-api";
import {
  listAdminSettlementBankAccounts,
  patchApproveSettlementBankAccount,
  patchRejectSettlementBankAccount,
  type AdminSettlementBankAccountListItem,
  type AdminSettlementBankAccountListPage,
  type SettlementAccountVerificationStatus,
} from "@/lib/admin-merchants-api";
import { formatDate } from "@/lib/format";
import {
  canApproveSettlementBankAccount,
  canRejectSettlementBankAccount,
} from "@/lib/platform-permission";
import { useAdminStore } from "@/store/useAdminStore";

const REJECTION_REASON_MAX = 500;

type StatusFilter = SettlementAccountVerificationStatus | "all";

function isPendingVerification(status: string): boolean {
  return status.trim().toLowerCase() === "pending";
}

function merchantPossessive(displayName: string): string {
  const trimmed = displayName.trim();
  return trimmed ? trimmed : "this merchant";
}

export function SettlementAccountsPage() {
  const permissions = useAdminStore((s) => s.permissions);
  const canApprove = canApproveSettlementBankAccount(permissions);
  const canReject = canRejectSettlementBankAccount(permissions);
  const showActions = canApprove || canReject;
  const columnCount = showActions ? 8 : 7;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Pending");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [data, setData] = useState<AdminSettlementBankAccountListPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [approveTarget, setApproveTarget] = useState<AdminSettlementBankAccountListItem | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminSettlementBankAccountListItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rowActionId, setRowActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pageData = await listAdminSettlementBankAccounts({
        page,
        pageSize,
        status: statusFilter === "all" ? "" : statusFilter,
      });
      setData(pageData);
    } catch (e) {
      const err = e as AdminApiError;
      const msg = formatAdminSettlementBankError(err.status, err.body);
      setError(msg);
      toast.error(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;
  const items = data?.items ?? [];
  const busy = rowActionId !== null;

  function rowLeavesCurrentFilter(action: "approve" | "reject"): boolean {
    if (statusFilter === "Pending") return true;
    if (statusFilter === "Verified") return action === "reject";
    if (statusFilter === "Failed") return action === "approve";
    return false;
  }

  function refreshAfterAction(action: "approve" | "reject") {
    if (rowLeavesCurrentFilter(action) && items.length === 1 && page > 1) {
      setPage(page - 1);
      return;
    }
    void load();
  }

  async function approve() {
    if (!approveTarget || busy) return;
    setRowActionId(approveTarget.id);
    try {
      await patchApproveSettlementBankAccount(approveTarget.merchantId, approveTarget.id);
      toast.success("Settlement account approved.");
      setApproveTarget(null);
      refreshAfterAction("approve");
    } catch (e) {
      const err = e as AdminApiError;
      toast.error(formatAdminSettlementBankError(err.status, err.body));
    } finally {
      setRowActionId(null);
    }
  }

  async function reject() {
    if (!rejectTarget || busy || !rejectReason.trim()) return;
    setRowActionId(rejectTarget.id);
    try {
      await patchRejectSettlementBankAccount(rejectTarget.merchantId, rejectTarget.id, rejectReason);
      toast.success("Settlement account rejected.");
      setRejectTarget(null);
      setRejectReason("");
      refreshAfterAction("reject");
    } catch (e) {
      const err = e as AdminApiError;
      toast.error(formatAdminSettlementBankError(err.status, err.body));
    } finally {
      setRowActionId(null);
    }
  }

  const approveName = merchantPossessive(approveTarget?.merchantDisplayName ?? "");
  const rejectName = merchantPossessive(rejectTarget?.merchantDisplayName ?? "");

  return (
    <div>
      <PageHeader
        title="Settlement accounts"
        description={
          data
            ? `${data.totalCount.toLocaleString()} settlement account${data.totalCount === 1 ? "" : "s"} match your filters`
            : "Review settlement bank accounts submitted after onboarding."
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as StatusFilter);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-44 h-9" aria-label="Verification status">
            <FilterIcon className="size-3.5 mr-1 shrink-0" />
            <SelectValue placeholder="Verification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Verified">Verified</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem>
            <SelectItem value="all">All statuses</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => {
            setPageSize(Number(v));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-32 h-9">
            <SelectValue placeholder="Page size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="20">20 / page</SelectItem>
            <SelectItem value="50">50 / page</SelectItem>
            <SelectItem value="100">100 / page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && !loading && (
        <Card size="sm" className="mb-4 border-destructive/40 bg-destructive/5">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <Card size="sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">Merchant</th>
                  <th className="px-4 py-3 text-left font-medium">Bank</th>
                  <th className="px-4 py-3 text-left font-medium">Account name</th>
                  <th className="px-4 py-3 text-left font-medium">Account number</th>
                  <th className="px-4 py-3 text-left font-medium">Verification</th>
                  <th className="px-4 py-3 text-left font-medium">Primary</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                  {showActions ? (
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3" colSpan={columnCount}>
                        <Skeleton className="h-8 w-full" />
                      </td>
                    </tr>
                  ))}
                {!loading &&
                  items.map((item) => {
                    const pending = isPendingVerification(item.verificationStatus);
                    return (
                      <tr key={item.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <Link
                            to={`/merchants/${item.merchantId}`}
                            className="font-medium hover:underline"
                          >
                            {item.merchantDisplayName.trim() ? item.merchantDisplayName : "—"}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <p>{item.bankName}</p>
                          <p className="text-xs text-muted-foreground">{item.bankCode}</p>
                        </td>
                        <td className="px-4 py-3">{item.accountName}</td>
                        <td className="px-4 py-3">{item.accountNumber}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={item.verificationStatus} />
                        </td>
                        <td className="px-4 py-3">{item.isPrimary ? "Yes" : "No"}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {formatDate(item.createdAtUtc)}
                        </td>
                        {showActions ? (
                          <td className="px-4 py-3 text-right">
                            {pending ? (
                              <div className="flex flex-wrap justify-end gap-2">
                                {canApprove ? (
                                  <Button
                                    size="sm"
                                    className="bg-success text-success-foreground hover:bg-success/90"
                                    disabled={busy}
                                    onClick={() => setApproveTarget(item)}
                                  >
                                    <ShieldCheckIcon className="size-4" />
                                    Approve
                                  </Button>
                                ) : null}
                                {canReject ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-destructive/40 text-destructive hover:bg-destructive/10"
                                    disabled={busy}
                                    onClick={() => {
                                      setRejectReason("");
                                      setRejectTarget(item);
                                    }}
                                  >
                                    <XCircleIcon className="size-4" />
                                    Reject
                                  </Button>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                {!loading && !error && items.length === 0 && (
                  <tr>
                    <td colSpan={columnCount} className="py-12 text-center text-sm text-muted-foreground">
                      No settlement accounts match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {data && !loading && data.totalCount > 0 && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Page {data.page} of {totalPages} · Showing {items.length} of {data.totalCount.toLocaleString()} settlement accounts
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="gap-1"
            >
              <ChevronLeftIcon className="size-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="gap-1"
            >
              Next
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={!!approveTarget}
        onOpenChange={(open) => {
          if (!open && !busy) setApproveTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve settlement account</DialogTitle>
            <DialogDescription>
              This marks {approveName}&apos;s {approveTarget?.bankName} account {approveTarget?.accountNumber} verified and
              sets it as the primary settlement account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveTarget(null)} disabled={busy}>
              Cancel
            </Button>
            <Button
              className="bg-success text-success-foreground hover:bg-success/90"
              disabled={busy}
              onClick={() => {
                void approve();
              }}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setRejectTarget(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject settlement account</DialogTitle>
            <DialogDescription>
              Reason sent with the rejection of {rejectName}&apos;s {rejectTarget?.bankName} account{" "}
              {rejectTarget?.accountNumber}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="settlement-queue-reject-reason">Reason</Label>
            <Textarea
              id="settlement-queue-reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value.slice(0, REJECTION_REASON_MAX))}
              placeholder="Reason for rejection…"
              maxLength={REJECTION_REASON_MAX}
              rows={4}
            />
            <p className="text-right text-xs text-muted-foreground">
              {rejectReason.length}/{REJECTION_REASON_MAX}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectTarget(null);
                setRejectReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy || !rejectReason.trim()}
              onClick={() => {
                void reject();
              }}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
