import { useState } from "react";
import { AlertTriangleIcon, CheckCircleIcon, ArrowUpRightIcon } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatNaira, formatRelative } from "@/lib/format";
import { MOCK_AML_QUEUE } from "@/mock/fraud";
import { canDo } from "@/lib/rbac";
import { useAdminStore } from "@/store/useAdminStore";
import { toast } from "sonner";
import type { AmlEntry } from "@/types";

const FLAG_LABELS: Record<AmlEntry["flag"], string> = {
  structuring: "Structuring",
  high_risk_country: "High-risk country",
  pep: "PEP",
  sanctions: "Sanctions match",
  unusual_pattern: "Unusual pattern",
};

const FLAG_COLORS: Record<AmlEntry["flag"], string> = {
  structuring: "border-destructive/50 text-destructive",
  high_risk_country: "border-destructive/50 text-destructive",
  pep: "border-warning/50 text-warning-foreground",
  sanctions: "border-destructive/50 text-destructive bg-destructive/5",
  unusual_pattern: "border-primary/50 text-primary",
};

export function AmlQueuePage() {
  const permissions = useAdminStore((s) => s.permissions);
  const [entries, setEntries] = useState(MOCK_AML_QUEUE);
  const [statusFilter, setStatusFilter] = useState("all");
  const canWrite = canDo(permissions, "aml:write");

  const filtered = entries.filter((e) => statusFilter === "all" || e.status === statusFilter);

  function update(id: string, status: AmlEntry["status"]) {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, status } : e));
    toast.success(`AML entry marked as ${status}`);
  }

  return (
    <div>
      <PageHeader
        title="AML Queue"
        description={`${entries.filter((e) => e.status === "pending").length} entries pending review`}
      />

      <div className="mb-4 flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entries</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="cleared">Cleared</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((entry) => (
          <Card key={entry.id} size="sm" className={entry.flag === "sanctions" ? "border-destructive/50 bg-destructive/5" : ""}>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{entry.merchantName}</span>
                    <StatusBadge status={entry.status} />
                    <Badge variant="outline" className={`text-xs ${FLAG_COLORS[entry.flag]}`}>
                      {entry.flag === "sanctions" && <AlertTriangleIcon className="size-3 mr-1" />}
                      {FLAG_LABELS[entry.flag]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{entry.description}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-semibold tabular-nums">{formatNaira(entry.amount)}</span>
                    <span>{formatRelative(entry.createdAt)}</span>
                    {entry.reviewedBy && <span>Reviewed by {entry.reviewedBy}</span>}
                  </div>
                </div>

                {canWrite && entry.status === "pending" && (
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" onClick={() => update(entry.id, "cleared")}>
                      <CheckCircleIcon className="size-4" />
                      Clear
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => update(entry.id, "reviewed")}>
                      Mark reviewed
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => update(entry.id, "escalated")}>
                      <ArrowUpRightIcon className="size-4" />
                      Escalate
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
