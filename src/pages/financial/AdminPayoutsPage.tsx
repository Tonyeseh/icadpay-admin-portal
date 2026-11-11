import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMinorUnits, formatDateTime } from "@/lib/format";
import {
  listAdminPayouts,
  type AdminPayoutListItem,
  type AdminPayoutListPage,
  type PayoutStatus,
} from "@/lib/admin-settlement-api";
import { formatAdminApiError, type AdminApiError } from "@/lib/admin-catalog-api";
import { toast } from "sonner";

export function AdminPayoutsPage() {
  const [merchantIdInput, setMerchantIdInput] = useState("");
  const [debouncedMerchantId, setDebouncedMerchantId] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PayoutStatus>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [data, setData] = useState<AdminPayoutListPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedMerchantId(merchantIdInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [merchantIdInput]);

  const prevDebouncedMerchantId = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (prevDebouncedMerchantId.current !== null && prevDebouncedMerchantId.current !== debouncedMerchantId) {
      setPage(1);
    }
    prevDebouncedMerchantId.current = debouncedMerchantId;
  }, [debouncedMerchantId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pageData = await listAdminPayouts({
        page,
        pageSize,
        merchantId: debouncedMerchantId || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
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
  }, [page, pageSize, debouncedMerchantId, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;
  const items: AdminPayoutListItem[] = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Merchant Payouts"
        description={
          data
            ? `${data.totalCount.toLocaleString()} payout${data.totalCount === 1 ? "" : "s"} match your filters`
            : "Track all merchant payouts"
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter by merchant id…"
            className="pl-9"
            value={merchantIdInput}
            onChange={(e) => setMerchantIdInput(e.target.value)}
            aria-label="Filter by merchant id"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as "all" | PayoutStatus);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Successful">Successful</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem>
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
                  <th className="px-4 py-3 text-left font-medium">Reference</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3" colSpan={5}>
                        <Skeleton className="h-8 w-full" />
                      </td>
                    </tr>
                  ))}
                {!loading &&
                  items.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs">{p.merchantId}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{p.reference ?? "—"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold">
                        {formatMinorUnits(p.amountMinor, p.currency)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(p.createdAtUtc)}</td>
                    </tr>
                  ))}
                {!loading && !error && items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                      No payouts match your filters.
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
            Page {data.page} of {totalPages} · Showing {items.length} of {data.totalCount.toLocaleString()} payouts
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
    </div>
  );
}
