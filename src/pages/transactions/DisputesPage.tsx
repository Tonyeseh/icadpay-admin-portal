import { useState } from "react";
import { SearchIcon, MoreHorizontalIcon, CheckCircleIcon, XCircleIcon } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatNaira, formatDate } from "@/lib/format";
import { MOCK_DISPUTES } from "@/mock/disputes";
import { canDo } from "@/lib/rbac";
import { useAdminStore } from "@/store/useAdminStore";
import { toast } from "sonner";
import type { Dispute } from "@/types";

export function DisputesPage() {
  const role = useAdminStore((s) => s.role);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [disputes, setDisputes] = useState(MOCK_DISPUTES);
  const [resolving, setResolving] = useState<{ dispute: Dispute; outcome: "won" | "lost" } | null>(null);

  const filtered = disputes.filter((d) => {
    const matchQ = !query ||
      d.merchantName.toLowerCase().includes(query.toLowerCase()) ||
      d.transactionReference.toLowerCase().includes(query.toLowerCase()) ||
      d.reason.toLowerCase().includes(query.toLowerCase());
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchQ && matchStatus;
  });

  const openCount = disputes.filter((d) => d.status === "open" || d.status === "under_review").length;

  return (
    <div>
      <PageHeader
        title="Disputes"
        description={`${openCount} open · ${disputes.filter((d) => d.status === "resolved" || d.status === "won" || d.status === "lost").length} resolved`}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search disputes…" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="under_review">Under review</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="won">Won</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card size="sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">Dispute ID</th>
                  <th className="px-4 py-3 text-left font-medium">Merchant</th>
                  <th className="px-4 py-3 text-left font-medium">Reason</th>
                  <th className="px-4 py-3 text-left font-medium">Network</th>
                  <th className="px-4 py-3 text-left font-medium">Raised by</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-left font-medium">Due</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((d) => {
                  const overdue = new Date(d.dueDate) < new Date() && (d.status === "open" || d.status === "under_review");
                  return (
                    <tr key={d.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{d.id}</td>
                      <td className="px-4 py-3 font-medium">{d.merchantName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{d.reason}</td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{d.network}</td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{d.raisedBy}</td>
                      <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold">{formatNaira(d.amount)}</td>
                      <td className={`px-4 py-3 text-xs ${overdue ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                        {formatDate(d.dueDate)}
                        {overdue && " (overdue)"}
                      </td>
                      <td className="px-4 py-3">
                        {canDo(role, "disputes:write") && (d.status === "open" || d.status === "under_review") && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontalIcon className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setDisputes((prev) => prev.map((x) => x.id === d.id ? { ...x, status: "under_review" as const } : x));
                                toast.success("Dispute marked as under review");
                              }}>
                                Mark under review
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setResolving({ dispute: d, outcome: "won" })}>
                                <CheckCircleIcon /> Resolve — won
                              </DropdownMenuItem>
                              <DropdownMenuItem variant="destructive" onClick={() => setResolving({ dispute: d, outcome: "lost" })}>
                                <XCircleIcon /> Resolve — lost
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!resolving}
        onOpenChange={(v) => !v && setResolving(null)}
        title={`Resolve dispute as ${resolving?.outcome}?`}
        description={resolving?.outcome === "won"
          ? "The disputed amount will be returned to the merchant. This action is irreversible."
          : "The disputed amount will be charged back from the merchant. This action is irreversible."}
        confirmLabel={`Resolve — ${resolving?.outcome}`}
        variant={resolving?.outcome === "lost" ? "destructive" : "default"}
        onConfirm={() => {
          if (!resolving) return;
          setDisputes((prev) => prev.map((d) => d.id === resolving.dispute.id ? { ...d, status: resolving.outcome } : d));
          toast.success(`Dispute resolved — ${resolving.outcome}`);
          setResolving(null);
        }}
      />
    </div>
  );
}
