import { useState } from "react";
import { PlusIcon, ToggleRightIcon, ToggleLeftIcon, EditIcon } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/format";
import { MOCK_ROUTING_RULES } from "@/mock/platform";
import { canDo } from "@/lib/rbac";
import { useAdminStore } from "@/store/useAdminStore";
import { toast } from "sonner";

const PROCESSOR_COLORS: Record<string, string> = {
  paystack: "border-primary/40 text-primary",
  flutterwave: "border-chart-3/40 text-chart-3",
  squad: "border-chart-2/40 text-chart-2",
  interswitch: "border-chart-5/40 text-chart-5",
  nibss: "border-muted-foreground/40 text-muted-foreground",
};

export function RoutingRulesPage() {
  const permissions = useAdminStore((s) => s.permissions);
  const [rules, setRules] = useState(MOCK_ROUTING_RULES);
  const canWrite = canDo(permissions, "platform:write");

  return (
    <div>
      <PageHeader
        title="Routing Rules"
        description="Control which processor handles each transaction type. Changes are live immediately."
        actions={
          canWrite && (
            <Button size="sm" onClick={() => toast.info("Rule builder coming soon")}>
              <PlusIcon className="size-4" />
              New rule
            </Button>
          )
        }
      />

      <div className="space-y-3">
        {[...rules].sort((a, b) => a.priority - b.priority).map((rule) => (
          <Card key={rule.id} size="sm" className={!rule.active ? "opacity-60" : ""}>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      P{rule.priority}
                    </span>
                    <span className="font-semibold">{rule.name}</span>
                    <Badge variant="outline" className={`text-xs capitalize ${PROCESSOR_COLORS[rule.processor] ?? ""}`}>
                      {rule.processor}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">{rule.channel}</Badge>
                    {!rule.active && <StatusBadge status="inactive" />}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{rule.description}</p>
                  <code className="mt-2 block rounded bg-muted px-2 py-1 text-xs font-mono text-muted-foreground">{rule.condition}</code>
                  <p className="mt-1.5 text-xs text-muted-foreground">Updated {formatRelative(rule.updatedAt)} by {rule.updatedBy}</p>
                </div>

                {canWrite && (
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, active: !r.active } : r));
                        toast.success(`Rule ${rule.active ? "disabled" : "enabled"}`);
                      }}
                    >
                      {rule.active ? <ToggleRightIcon className="size-4 text-warning" /> : <ToggleLeftIcon className="size-4 text-success" />}
                      {rule.active ? "Disable" : "Enable"}
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => toast.info("Editor coming soon")}>
                      <EditIcon className="size-4" />
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
