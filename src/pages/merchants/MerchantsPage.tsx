import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  SearchIcon,
  FilterIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import {
  listAdminMerchants,
  patchAdminMerchantActivate,
  patchAdminMerchantDeactivate,
  patchAdminMerchantSuspend,
  type AdminMerchantListItem,
  type AdminMerchantListPage,
} from "@/lib/admin-merchants-api";
import { formatAdminApiError, type AdminApiError } from "@/lib/admin-catalog-api";
import { hasPermission } from "@/lib/rbac";
import { useAdminStore } from "@/store/useAdminStore";
import { toast } from "sonner";

type SortPreset = "created_desc" | "created_asc" | "volume_desc" | "volume_asc";

const ONBOARDING_STATUSES = ["Draft", "Submitted", "UnderReview", "Approved", "Rejected", "RequiresAction"] as const;
type OnboardingStatusFilter = (typeof ONBOARDING_STATUSES)[number];

function readOnboardingFilter(value: string | null): "all" | OnboardingStatusFilter {
  if (value && (ONBOARDING_STATUSES as readonly string[]).includes(value)) {
    return value as OnboardingStatusFilter;
  }
  return "all";
}

function normStatus(status: string): string {
  return status.trim().toLowerCase();
}

function sortPresetToParams(preset: SortPreset): { sort: "created_at" | "total_volume"; sortDesc: boolean } {
  switch (preset) {
    case "created_asc":
      return { sort: "created_at", sortDesc: false };
    case "volume_desc":
      return { sort: "total_volume", sortDesc: true };
    case "volume_asc":
      return { sort: "total_volume", sortDesc: false };
    default:
      return { sort: "created_at", sortDesc: true };
  }
}

export function MerchantsPage() {
  const permissions = useAdminStore((s) => s.permissions);
  const canSuspend = hasPermission(permissions, "merchants.suspend");
  const canActivate = hasPermission(permissions, "merchants.activate");
  const canDeactivate = hasPermission(permissions, "merchants.deactivate");
  const canLifecycle = canSuspend || canActivate || canDeactivate;
  const [searchParams, setSearchParams] = useSearchParams();
  const onboardingParam = searchParams.get("onboarding");
  const onboardingFilter = readOnboardingFilter(onboardingParam);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [businessFilter, setBusinessFilter] = useState<string>("all");
  const [sortPreset, setSortPreset] = useState<SortPreset>("created_desc");

  const [data, setData] = useState<AdminMerchantListPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deactivateTarget, setDeactivateTarget] = useState<AdminMerchantListItem | null>(null);
  const [activateTarget, setActivateTarget] = useState<AdminMerchantListItem | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<AdminMerchantListItem | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [rowActionId, setRowActionId] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const prevDebouncedSearch = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (prevDebouncedSearch.current !== null && prevDebouncedSearch.current !== debouncedSearch) {
      setPage(1);
    }
    prevDebouncedSearch.current = debouncedSearch;
  }, [debouncedSearch]);

  const prevOnboardingParam = useRef(onboardingParam);
  useLayoutEffect(() => {
    if (prevOnboardingParam.current !== onboardingParam) {
      prevOnboardingParam.current = onboardingParam;
      setPage(1);
    }
  }, [onboardingParam]);

  function syncOnboardingSearch(status: "all" | OnboardingStatusFilter) {
    const raw = searchParams.get("onboarding");
    if (status === "all") {
      if (raw === null) return;
    } else if (raw === status) {
      return;
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (status === "all") next.delete("onboarding");
      else next.set("onboarding", status);
      return next;
    });
  }

  const { sort, sortDesc } = useMemo(() => sortPresetToParams(sortPreset), [sortPreset]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pageData = await listAdminMerchants({
        page,
        pageSize,
        status: statusFilter === "all" ? undefined : statusFilter,
        onboardingStatus: onboardingFilter === "all" ? undefined : onboardingFilter,
        businessType: businessFilter === "all" ? undefined : businessFilter,
        search: debouncedSearch || undefined,
        sort,
        sortDesc,
      });
      setData(pageData);
    } catch (e) {
      const err = e as AdminApiError;
      const msg = formatAdminApiError(err.body);
      setError(msg);
      toast.error(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, onboardingFilter, businessFilter, debouncedSearch, sort, sortDesc]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;
  const items: AdminMerchantListItem[] = data?.items ?? [];
  const reviewView = onboardingFilter === "Submitted";

  return (
    <div>
      <PageHeader
        title={reviewView ? "Onboarding review" : "Merchants"}
        description={
          reviewView
            ? "These are merchants waiting for a decision."
            : data
              ? `${data.totalCount.toLocaleString()} merchant${data.totalCount === 1 ? "" : "s"} match your filters`
              : "Browse and filter platform merchant accounts"
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search display name or email…"
            className="pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search merchants"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-40 h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="deactivated">Deactivated</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={onboardingFilter}
          onValueChange={(v) => {
            setPage(1);
            syncOnboardingSearch(v === "all" ? "all" : (v as OnboardingStatusFilter));
          }}
        >
          <SelectTrigger className="w-full sm:w-44 h-9" aria-label="Onboarding">
            <FilterIcon className="size-3.5 mr-1 shrink-0" />
            <SelectValue placeholder="Onboarding" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All onboarding</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Submitted">Submitted</SelectItem>
            <SelectItem value="UnderReview">Under review</SelectItem>
            <SelectItem value="RequiresAction">Requires action</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={businessFilter}
          onValueChange={(v) => {
            setBusinessFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-52 h-9">
            <SelectValue placeholder="Business type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All business types</SelectItem>
            <SelectItem value="Registered Business">Registered Business</SelectItem>
            <SelectItem value="Non-Registered Business">Non-Registered Business</SelectItem>
            <SelectItem value="Government Agency">Government Agency</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sortPreset}
          onValueChange={(v) => {
            setSortPreset(v as SortPreset);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-48 h-9">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_desc">Newest first</SelectItem>
            <SelectItem value="created_asc">Oldest first</SelectItem>
            <SelectItem value="volume_desc">Volume (high → low)</SelectItem>
            <SelectItem value="volume_asc">Volume (low → high)</SelectItem>
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
                  <th className="px-4 py-3 text-left font-medium">Business type</th>
                  <th className="px-4 py-3 text-left font-medium">Onboarding</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Account mode</th>
                  <th className="px-4 py-3 text-left font-medium">Company type</th>
                  <th className="px-4 py-3 text-left font-medium">Joined</th>
                  {canLifecycle ? (
                    <th className="px-4 py-3 text-right font-medium w-[72px]">Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3" colSpan={canLifecycle ? 8 : 7}>
                        <Skeleton className="h-8 w-full" />
                      </td>
                    </tr>
                  ))}
                {!loading &&
                  items.map((m) => {
                    const st = normStatus(m.status);
                    const isDeactivated = st === "deactivated";
                    const isSuspended = st === "suspended";
                    const showSuspend = !isDeactivated && !isSuspended;
                    const showActivate = !isDeactivated && isSuspended;
                    const showDeactivate = !isDeactivated;
                    const menuCount = !isDeactivated
                      ? Number(showSuspend && canSuspend) + Number(showActivate && canActivate) + Number(showDeactivate && canDeactivate)
                      : 0;

                    return (
                      <tr key={m.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <Link to={`/merchants/${m.id}`} className="hover:underline">
                            <p className="font-medium">{m.displayName}</p>
                            <p className="text-xs text-muted-foreground">{m.emailAddress ?? "—"}</p>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{m.businessType}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={m.onboardingStatus} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={m.status} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={m.accountMode || "—"} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{m.companyType ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(m.createdAt)}</td>
                        {canLifecycle ? (
                          <td className="px-4 py-3 text-right">
                            {menuCount > 0 ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    disabled={rowActionId === m.id}
                                    aria-label={`Actions for ${m.displayName}`}
                                  >
                                    <MoreHorizontalIcon className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  {showActivate && canActivate ? (
                                    <DropdownMenuItem
                                      onClick={() => setActivateTarget(m)}
                                      disabled={!!rowActionId}
                                    >
                                      Activate
                                    </DropdownMenuItem>
                                  ) : null}
                                  {showSuspend && canSuspend ? (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSuspendReason("");
                                        setSuspendTarget(m);
                                      }}
                                      disabled={!!rowActionId}
                                    >
                                      Suspend
                                    </DropdownMenuItem>
                                  ) : null}
                                  {showDeactivate && canDeactivate ? (
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onClick={() => setDeactivateTarget(m)}
                                      disabled={!!rowActionId}
                                    >
                                      Deactivate
                                    </DropdownMenuItem>
                                  ) : null}
                                </DropdownMenuContent>
                              </DropdownMenu>
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
                    <td colSpan={canLifecycle ? 8 : 7} className="py-12 text-center text-sm text-muted-foreground">
                      No merchants match your filters.
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
            Page {data.page} of {totalPages} · Showing {items.length} of {data.totalCount.toLocaleString()} merchants
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                syncOnboardingSearch(onboardingFilter);
              }}
              className="gap-1"
            >
              <ChevronLeftIcon className="size-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= totalPages}
              onClick={() => {
                setPage((p) => p + 1);
                syncOnboardingSearch(onboardingFilter);
              }}
              className="gap-1"
            >
              Next
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null);
        }}
        title={`Deactivate ${deactivateTarget?.displayName ?? "merchant"}?`}
        description="This merchant will be permanently closed for reactivation from the dashboard."
        confirmLabel="Deactivate"
        variant="destructive"
        onConfirm={async () => {
          if (!deactivateTarget) return;
          setRowActionId(deactivateTarget.id);
          try {
            await patchAdminMerchantDeactivate(deactivateTarget.id);
            toast.success("Merchant deactivated");
            await load();
          } catch (e) {
            const err = e as AdminApiError;
            toast.error(formatAdminApiError(err.body));
            throw e;
          } finally {
            setRowActionId(null);
          }
        }}
      />

      <ConfirmDialog
        open={!!activateTarget}
        onOpenChange={(open) => {
          if (!open) setActivateTarget(null);
        }}
        title={`Activate ${activateTarget?.displayName ?? "merchant"}?`}
        description="The merchant will return to active status and suspension fields will be cleared. Deactivated merchants cannot be reactivated here."
        confirmLabel="Activate"
        onConfirm={async () => {
          if (!activateTarget) return;
          setRowActionId(activateTarget.id);
          try {
            await patchAdminMerchantActivate(activateTarget.id);
            toast.success("Merchant activated");
            await load();
          } catch (e) {
            const err = e as AdminApiError;
            toast.error(formatAdminApiError(err.body));
            throw e;
          } finally {
            setRowActionId(null);
          }
        }}
      />

      <Dialog
        open={!!suspendTarget}
        onOpenChange={(open) => {
          if (!open) {
            setSuspendTarget(null);
            setSuspendReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspend merchant</DialogTitle>
            <DialogDescription>
              {suspendTarget ? (
                <>
                  Suspend <span className="font-medium text-foreground">{suspendTarget.displayName}</span>. A reason is
                  required (max 500 characters).
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="suspend-reason">Reason</Label>
            <Textarea
              id="suspend-reason"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Explain why this merchant is being suspended…"
              maxLength={500}
              rows={4}
              disabled={!!rowActionId}
            />
            <p className="text-xs text-muted-foreground text-right">{suspendReason.length}/500</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSuspendTarget(null);
                setSuspendReason("");
              }}
              disabled={!!rowActionId}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!suspendReason.trim() || !!rowActionId}
              onClick={async () => {
                if (!suspendTarget) return;
                const trimmed = suspendReason.trim();
                if (!trimmed) {
                  toast.error("Please enter a suspension reason.");
                  return;
                }
                setRowActionId(suspendTarget.id);
                try {
                  await patchAdminMerchantSuspend(suspendTarget.id, trimmed);
                  toast.success("Merchant suspended");
                  setSuspendTarget(null);
                  setSuspendReason("");
                  await load();
                } catch (e) {
                  const err = e as AdminApiError;
                  toast.error(formatAdminApiError(err.body));
                } finally {
                  setRowActionId(null);
                }
              }}
            >
              Suspend merchant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
