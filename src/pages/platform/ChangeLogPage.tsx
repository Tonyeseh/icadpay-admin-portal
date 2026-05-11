import { SearchIcon } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { MOCK_CHANGE_LOG } from "@/mock/platform";

const ACTION_COLORS: Record<string, string> = {
  created: "border-success/40 text-success",
  updated: "border-primary/40 text-primary",
  deleted: "border-destructive/40 text-destructive",
  enabled: "border-success/40 text-success",
  disabled: "border-warning/40 text-warning-foreground",
};

const ENTITY_LABELS: Record<string, string> = {
  routing_rule: "Routing rule",
  fx_rate: "FX rate",
  webhook: "Webhook",
  fraud_rule: "Fraud rule",
  platform_config: "Platform config",
};

export function ChangeLogPage() {
  const [query, setQuery] = useState("");
  const filtered = MOCK_CHANGE_LOG.filter((e) =>
    !query ||
    e.entityName.toLowerCase().includes(query.toLowerCase()) ||
    e.changedBy.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());

  return (
    <div>
      <PageHeader
        title="Change Log"
        description="Immutable record of all platform configuration changes"
      />

      <div className="mb-4">
        <div className="relative max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search changes…" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <Card size="sm">
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.map((entry) => (
              <div key={entry.id} className="px-4 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={`text-xs capitalize ${ACTION_COLORS[entry.action] ?? ""}`}>
                        {entry.action}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {ENTITY_LABELS[entry.entity] ?? entry.entity}
                      </Badge>
                      <span className="font-semibold">{entry.entityName}</span>
                    </div>
                    {entry.reason && (
                      <p className="mt-1 text-sm text-muted-foreground">"{entry.reason}"</p>
                    )}
                    {entry.before && entry.after && (
                      <div className="mt-2 flex flex-wrap gap-3 text-xs">
                        <span className="text-destructive">
                          Before: {JSON.stringify(entry.before)}
                        </span>
                        <span className="text-success">
                          After: {JSON.stringify(entry.after)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground shrink-0">
                    <p className="font-medium text-foreground">{entry.changedBy}</p>
                    <p>{formatDateTime(entry.changedAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
