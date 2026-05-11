import { useState } from "react";
import { ShieldAlertIcon, CheckCircleIcon, EyeOffIcon } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatNaira, formatRelative } from "@/lib/format";
import { MOCK_FRAUD_ALERTS } from "@/mock/fraud";
import { canDo } from "@/lib/rbac";
import { useAdminStore } from "@/store/useAdminStore";
import { toast } from "sonner";
import type { FraudAlert } from "@/types";

export function FraudAlertsPage() {
  const role = useAdminStore((s) => s.role);
  const [alerts, setAlerts] = useState(MOCK_FRAUD_ALERTS);
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = alerts.filter((a) => statusFilter === "all" || a.status === statusFilter);
  const canWrite = canDo(role, "fraud:write");

  function update(id: string, status: FraudAlert["status"]) {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    toast.success(`Alert marked as ${status.replace("_", " ")}`);
  }

  return (
    <div>
      <PageHeader
        title="Fraud Alert Queue"
        description={`${alerts.filter((a) => a.status === "open").length} open alerts requiring review`}
      />

      <div className="mb-4 flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All alerts</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="false_positive">False positive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((alert) => (
          <Card key={alert.id} size="sm" className={alert.riskScore >= 80 ? "border-destructive/40" : ""}>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{alert.merchantName}</span>
                    <StatusBadge status={alert.status} />
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${alert.riskScore >= 80 ? "bg-destructive/10 text-destructive" : alert.riskScore >= 60 ? "bg-warning/15 text-warning-foreground" : "bg-muted text-muted-foreground"}`}>
                      <ShieldAlertIcon className="size-3" />
                      Risk {alert.riskScore}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold tabular-nums">{formatNaira(alert.amount)}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {alert.triggeredRules.map((rule) => (
                      <Badge key={rule} variant="outline" className="text-xs">{rule}</Badge>
                    ))}
                  </div>
                  {alert.notes && (
                    <p className="mt-2 text-xs text-muted-foreground">{alert.notes}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatRelative(alert.createdAt)}
                    {alert.reviewedBy && ` · Reviewed by ${alert.reviewedBy}`}
                  </p>
                </div>

                {canWrite && alert.status === "open" && (
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" onClick={() => update(alert.id, "investigating")}>
                      Investigate
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => update(alert.id, "false_positive")}>
                      <EyeOffIcon className="size-4" />
                      False +ve
                    </Button>
                    <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90" onClick={() => update(alert.id, "resolved")}>
                      <CheckCircleIcon className="size-4" />
                      Resolve
                    </Button>
                  </div>
                )}
                {canWrite && alert.status === "investigating" && (
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" onClick={() => update(alert.id, "false_positive")}>
                      <EyeOffIcon className="size-4" />
                      False +ve
                    </Button>
                    <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90" onClick={() => update(alert.id, "resolved")}>
                      <CheckCircleIcon className="size-4" />
                      Resolve
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <Card size="sm">
            <CardContent className="py-16 text-center">
              <CheckCircleIcon className="mx-auto mb-3 size-10 text-success" />
              <p className="font-medium">No alerts in this queue</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
