import { useState } from "react";
import { SearchIcon, DownloadIcon } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateTime } from "@/lib/format";
import { MOCK_AUDIT_LOG } from "@/mock/compliance";
import { ROLE_LABELS } from "@/lib/rbac";
import { toast } from "sonner";

const SEVERITY_STYLES: Record<string, string> = {
  info: "border-primary/30 text-primary",
  warning: "border-warning/40 text-warning-foreground",
  critical: "border-destructive/40 text-destructive",
};

export function AuditLogPage() {
  const [query, setQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  const filtered = MOCK_AUDIT_LOG.filter((e) => {
    const matchQ = !query ||
      e.adminName.toLowerCase().includes(query.toLowerCase()) ||
      e.action.toLowerCase().includes(query.toLowerCase()) ||
      e.details.toLowerCase().includes(query.toLowerCase());
    const matchSeverity = severityFilter === "all" || e.severity === severityFilter;
    return matchQ && matchSeverity;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div>
      <PageHeader
        title="Audit Log"
        description="Immutable record of all admin actions on this portal"
        actions={
          <Button variant="outline" size="sm" onClick={() => toast.success("Audit log exported")}>
            <DownloadIcon className="size-4" />
            Export
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by admin, action…" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severity</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card size="sm">
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.map((entry) => (
              <div key={entry.id} className="px-4 py-3">
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${SEVERITY_STYLES[entry.severity]}`}>
                        {entry.severity}
                      </Badge>
                      <span className="text-sm font-medium font-mono">{entry.action}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{entry.details}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{entry.adminName}</span>
                      <span>{ROLE_LABELS[entry.adminRole]}</span>
                      <span className="font-mono">{entry.ipAddress}</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="mt-2 text-xs text-muted-foreground">
        Showing {filtered.length} of {MOCK_AUDIT_LOG.length} entries
      </p>
    </div>
  );
}
