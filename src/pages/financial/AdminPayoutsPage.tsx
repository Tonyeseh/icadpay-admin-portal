import { useState } from "react";
import { SearchIcon, CheckCircleIcon, PauseIcon, MoreHorizontalIcon } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { KpiCard } from "@/components/common/KpiCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatNaira, formatDate } from "@/lib/format";
import { MOCK_ADMIN_PAYOUTS } from "@/mock/financial";
import { canDo } from "@/lib/rbac";
import { useAdminStore } from "@/store/useAdminStore";
import { toast } from "sonner";
import type { AdminPayout } from "@/types";

export function AdminPayoutsPage() {
  const role = useAdminStore((s) => s.role);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [payouts, setPayouts] = useState(MOCK_ADMIN_PAYOUTS);
  const [approving, setApproving] = useState<AdminPayout | null>(null);
  const [holding, setHolding] = useState<AdminPayout | null>(null);

  const canWrite = canDo(role, "financial:payouts");

  const filtered = payouts.filter((p) => {
    const matchQ = !query || p.merchantName.toLowerCase().includes(query.toLowerCase()) || p.reference.toLowerCase().includes(query.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchQ && matchStatus;
  });

  const pendingAmount = payouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const paidAmount = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <PageHeader
        title="Merchant Payouts"
        description="Approve, hold, and track all merchant payout requests"
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Pending approval" value={String(payouts.filter((p) => p.status === "pending").length)} hint={formatNaira(pendingAmount, { compact: true })} />
        <KpiCard label="On hold" value={String(payouts.filter((p) => p.status === "on_hold").length)} />
        <KpiCard label="Processing" value={String(payouts.filter((p) => p.status === "processing").length)} />
        <KpiCard label="Paid this period" value={formatNaira(paidAmount, { compact: true })} />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search merchant or reference…" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="on_hold">On hold</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card size="sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">Merchant</th>
                  <th className="px-4 py-3 text-left font-medium">Bank account</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-left font-medium">Requested</th>
                  <th className="px-4 py-3 text-left font-medium">Approved by</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium">{p.merchantName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{p.reference.slice(0, 16)}…</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <p>{p.bankName}</p>
                      <p className="text-xs">{p.accountNumber} · {p.accountName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <StatusBadge status={p.status} />
                        {p.holdReason && <p className="mt-1 text-xs text-warning-foreground">{p.holdReason}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">{formatNaira(p.amount)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(p.requestedAt)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{p.approvedBy ?? "—"}</td>
                    <td className="px-4 py-3">
                      {canWrite && p.status === "pending" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontalIcon className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setApproving(p)}>
                              <CheckCircleIcon /> Approve payout
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => setHolding(p)}>
                              <PauseIcon /> Place on hold
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!approving}
        onOpenChange={(v) => !v && setApproving(null)}
        title={`Approve payout for ${approving?.merchantName}?`}
        description={`₦${approving ? (approving.amount / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 }) : 0} will be disbursed to ${approving?.bankName} · ${approving?.accountNumber}`}
        confirmLabel="Approve payout"
        onConfirm={() => {
          setPayouts((prev) => prev.map((p) => p.id === approving!.id ? { ...p, status: "approved" as const, approvedBy: "Ife Adebayo" } : p));
          toast.success(`Payout approved for ${approving!.merchantName}`);
          setApproving(null);
        }}
      />

      <ConfirmDialog
        open={!!holding}
        onOpenChange={(v) => !v && setHolding(null)}
        title={`Hold payout for ${holding?.merchantName}?`}
        description="The payout will be placed on hold. The merchant will be notified."
        confirmLabel="Place on hold"
        variant="destructive"
        onConfirm={() => {
          setPayouts((prev) => prev.map((p) => p.id === holding!.id ? { ...p, status: "on_hold" as const, holdReason: "Manual hold by finance team" } : p));
          toast.error(`Payout held for ${holding!.merchantName}`);
          setHolding(null);
        }}
      />
    </div>
  );
}
