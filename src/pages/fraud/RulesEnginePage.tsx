import { useState } from "react";
import { PlusIcon, ToggleLeftIcon, ToggleRightIcon, EditIcon, TrashIcon } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatRelative } from "@/lib/format";
import { MOCK_FRAUD_RULES } from "@/mock/fraud";
import { canDo } from "@/lib/rbac";
import { useAdminStore } from "@/store/useAdminStore";
import { toast } from "sonner";
import type { FraudRule } from "@/types";

export function RulesEnginePage() {
  const permissions = useAdminStore((s) => s.permissions);
  const [rules, setRules] = useState(MOCK_FRAUD_RULES);
  const [deleting, setDeleting] = useState<FraudRule | null>(null);
  const [editing, setEditing] = useState<FraudRule | null>(null);
  const [creating, setCreating] = useState(false);

  const canWrite = canDo(permissions, "fraud:rules");

  function toggleRule(id: string) {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, status: r.status === "active" ? "inactive" as const : "active" as const } : r));
    toast.success("Rule updated");
  }

  return (
    <div>
      <PageHeader
        title="Rules Engine"
        description="Fraud detection rules — changes take effect immediately without deployment"
        actions={
          canWrite && (
            <Button size="sm" onClick={() => setCreating(true)}>
              <PlusIcon className="size-4" />
              New rule
            </Button>
          )
        }
      />

      <div className="space-y-3">
        {rules.map((rule) => (
          <Card key={rule.id} size="sm" className={rule.status === "inactive" ? "opacity-60" : ""}>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{rule.name}</span>
                    <StatusBadge status={rule.status} />
                    <Badge variant="outline" className="text-xs capitalize">{rule.category}</Badge>
                    <Badge variant="outline" className={`text-xs capitalize ${rule.action === "block" ? "border-destructive/50 text-destructive" : rule.action === "flag" ? "border-primary/50 text-primary" : "border-warning/50 text-warning-foreground"}`}>
                      {rule.action}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{rule.description}</p>
                  <code className="mt-2 block rounded bg-muted px-2 py-1 text-xs font-mono text-muted-foreground">{rule.condition}</code>
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Triggered {rule.triggeredCount.toLocaleString()}×</span>
                    <span>FP rate {rule.falsePositiveRate}%</span>
                    <span>Updated {formatRelative(rule.updatedAt)} by {rule.updatedBy}</span>
                  </div>
                </div>

                {canWrite && (
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleRule(rule.id)}
                      className={rule.status === "active" ? "text-warning-foreground" : "text-success"}
                    >
                      {rule.status === "active" ? <ToggleRightIcon className="size-4" /> : <ToggleLeftIcon className="size-4" />}
                      {rule.status === "active" ? "Disable" : "Enable"}
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditing(rule)}>
                      <EditIcon className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setDeleting(rule)}>
                      <TrashIcon className="size-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/edit dialog */}
      <Dialog open={creating || !!editing} onOpenChange={(v) => { if (!v) { setCreating(false); setEditing(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit rule" : "New fraud rule"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Rule name</Label>
              <Input placeholder="e.g. High velocity — single card" defaultValue={editing?.name} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input placeholder="Plain-English description" defaultValue={editing?.description} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select defaultValue={editing?.category ?? "velocity"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["velocity", "amount", "geo", "device", "card", "behaviour"].map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Action</Label>
                <Select defaultValue={editing?.action ?? "flag"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flag">Flag</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="block">Block</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Condition</Label>
              <Textarea
                placeholder="e.g. card.count(1h) > 5"
                className="font-mono text-sm"
                defaultValue={editing?.condition}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>Cancel</Button>
            <Button onClick={() => {
              toast.success(editing ? "Rule updated" : "Rule created");
              setCreating(false);
              setEditing(null);
            }}>
              {editing ? "Save changes" : "Create rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title={`Delete "${deleting?.name}"?`}
        description="This rule will be permanently removed. This action cannot be undone."
        confirmLabel="Delete rule"
        variant="destructive"
        onConfirm={() => {
          setRules((prev) => prev.filter((r) => r.id !== deleting!.id));
          toast.success("Rule deleted");
          setDeleting(null);
        }}
      />
    </div>
  );
}
