import { useState } from "react";
import { SearchIcon, DownloadIcon, MoreHorizontalIcon, RotateCcwIcon, ZapIcon } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatNaira, formatDateTime, formatRelative } from "@/lib/format";
import { MOCK_TRANSACTIONS } from "@/mock/transactions";
import { canDo } from "@/lib/rbac";
import { useAdminStore } from "@/store/useAdminStore";
import { toast } from "sonner";
import type { AdminTransaction } from "@/types";

export function TransactionsPage() {
  const role = useAdminStore((s) => s.role);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [selected, setSelected] = useState<AdminTransaction | null>(null);
  const [overriding, setOverriding] = useState<AdminTransaction | null>(null);
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);

  const filtered = transactions.filter((t) => {
    const matchQ = !query ||
      t.reference.toLowerCase().includes(query.toLowerCase()) ||
      t.customerName.toLowerCase().includes(query.toLowerCase()) ||
      t.merchantName.toLowerCase().includes(query.toLowerCase()) ||
      t.customerEmail.toLowerCase().includes(query.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchChannel = channelFilter === "all" || t.channel === channelFilter;
    return matchQ && matchStatus && matchChannel;
  });

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="Cross-merchant transaction search and management"
        actions={
          <Button variant="outline" size="sm" onClick={() => toast.success("CSV exported")}>
            <DownloadIcon className="size-4" />
            Export CSV
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Reference, customer, merchant…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="abandoned">Abandoned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
            <SelectItem value="ussd">USSD</SelectItem>
            <SelectItem value="qr">QR</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card size="sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">Reference</th>
                  <th className="px-4 py-3 text-left font-medium">Merchant</th>
                  <th className="px-4 py-3 text-left font-medium">Customer</th>
                  <th className="px-4 py-3 text-left font-medium">Channel</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-right font-medium">Risk</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.slice(0, 30).map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setSelected(t)}>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.reference.slice(0, 18)}…</td>
                    <td className="px-4 py-3">
                      <span className="max-w-[120px] truncate block">{t.merchantName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{t.customerName}</p>
                        <p className="text-xs text-muted-foreground">{t.customerEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{t.channel}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">{formatNaira(t.amount)}</td>
                    <td className="px-4 py-3 text-right">
                      {t.riskScore != null && (
                        <span className={`text-xs font-semibold tabular-nums ${t.riskScore > 60 ? "text-destructive" : t.riskScore > 40 ? "text-warning" : "text-muted-foreground"}`}>
                          {t.riskScore}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatRelative(t.createdAt)}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontalIcon className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelected(t)}>View details</DropdownMenuItem>
                          {canDo(role, "transactions:refund") && t.status === "success" && (
                            <DropdownMenuItem onClick={() => toast.success("Refund initiated")}>
                              <RotateCcwIcon /> Issue refund
                            </DropdownMenuItem>
                          )}
                          {canDo(role, "transactions:override") && t.status === "failed" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onClick={() => setOverriding(t)}>
                                <ZapIcon /> Manual override
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="mt-2 text-xs text-muted-foreground">
        Showing {Math.min(filtered.length, 30)} of {filtered.length} transactions
      </p>

      {/* Detail drawer */}
      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>Transaction details</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-semibold tabular-nums">{formatNaira(selected.amount)}</span>
                  <StatusBadge status={selected.status} />
                </div>
                <dl className="divide-y text-sm">
                  {[
                    ["Reference", <span className="font-mono text-xs">{selected.reference}</span>],
                    ["Merchant", selected.merchantName],
                    ["Customer", selected.customerName],
                    ["Email", selected.customerEmail],
                    ["Channel", <span className="capitalize">{selected.channel}</span>],
                    ["Fee", formatNaira(selected.fee)],
                    ["IP address", selected.ipAddress ?? "—"],
                    ["Risk score", selected.riskScore != null ? String(selected.riskScore) : "—"],
                    ["Date", formatDateTime(selected.createdAt)],
                    ...(selected.overrideBy ? [
                      ["Override by", selected.overrideBy],
                      ["Override reason", selected.overrideReason ?? "—"],
                    ] : []),
                  ].map(([label, value], i) => (
                    <div key={i} className="flex items-start justify-between gap-4 py-2.5">
                      <dt className="text-muted-foreground shrink-0">{label}</dt>
                      <dd className="text-right font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="flex gap-2 pt-2">
                  {canDo(role, "transactions:refund") && selected.status === "success" && (
                    <Button variant="outline" size="sm" onClick={() => { toast.success("Refund initiated"); setSelected(null); }}>
                      <RotateCcwIcon className="size-4" />
                      Issue refund
                    </Button>
                  )}
                  {canDo(role, "transactions:override") && selected.status === "failed" && (
                    <Button variant="destructive" size="sm" onClick={() => { setOverriding(selected); setSelected(null); }}>
                      <ZapIcon className="size-4" />
                      Manual override
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!overriding}
        onOpenChange={(v) => !v && setOverriding(null)}
        title="Manual override transaction?"
        description="This will mark the transaction as successful and trigger settlement. This action is logged and irreversible."
        confirmLabel="Override transaction"
        variant="destructive"
        onConfirm={() => {
          setTransactions((prev) => prev.map((t) => t.id === overriding!.id ? { ...t, status: "success" as const, overrideBy: "Kola Adeyemi" } : t));
          toast.success("Transaction overridden");
          setOverriding(null);
        }}
      />
    </div>
  );
}
