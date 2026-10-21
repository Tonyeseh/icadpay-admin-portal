import { useState } from "react";
import { PlusIcon, TrashIcon, ToggleRightIcon, ToggleLeftIcon, CopyIcon } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/format";
import { MOCK_PLATFORM_WEBHOOKS } from "@/mock/platform";
import { canDo } from "@/lib/rbac";
import { useAdminStore } from "@/store/useAdminStore";
import { toast } from "sonner";
import type { PlatformWebhook } from "@/types";

export function WebhooksPage() {
  const permissions = useAdminStore((s) => s.permissions);
  const [webhooks, setWebhooks] = useState(MOCK_PLATFORM_WEBHOOKS);
  const [deleting, setDeleting] = useState<PlatformWebhook | null>(null);
  const canWrite = canDo(permissions, "platform:write");

  return (
    <div>
      <PageHeader
        title="Platform Webhooks"
        description="Internal endpoints receiving platform-level events"
        actions={
          canWrite && (
            <Button size="sm" onClick={() => toast.info("Webhook builder coming soon")}>
              <PlusIcon className="size-4" />
              Add webhook
            </Button>
          )
        }
      />

      <div className="space-y-3">
        {webhooks.map((wh) => (
          <Card key={wh.id} size="sm">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{wh.description}</span>
                    <StatusBadge status={wh.active ? "active" : "inactive"} />
                    {wh.failureCount > 0 && (
                      <Badge variant="outline" className="text-xs border-destructive/40 text-destructive">
                        {wh.failureCount} failures
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{wh.url}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {wh.events.map((e) => (
                      <Badge key={e} variant="outline" className="text-xs font-mono">{e}</Badge>
                    ))}
                  </div>
                  {wh.lastTriggeredAt && (
                    <p className="mt-1.5 text-xs text-muted-foreground">Last triggered {formatRelative(wh.lastTriggeredAt)}</p>
                  )}
                </div>

                {canWrite && (
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        navigator.clipboard.writeText(wh.signingSecret);
                        toast.success("Signing secret copied");
                      }}
                    >
                      <CopyIcon className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setWebhooks((prev) => prev.map((w) => w.id === wh.id ? { ...w, active: !w.active } : w));
                        toast.success(`Webhook ${wh.active ? "disabled" : "enabled"}`);
                      }}
                    >
                      {wh.active ? <ToggleRightIcon className="size-4 text-warning" /> : <ToggleLeftIcon className="size-4 text-success" />}
                      {wh.active ? "Disable" : "Enable"}
                    </Button>
                    <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setDeleting(wh)}>
                      <TrashIcon className="size-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete webhook?"
        description={`"${deleting?.description}" will be permanently removed. All future events will stop being delivered to this endpoint.`}
        confirmLabel="Delete webhook"
        variant="destructive"
        onConfirm={() => {
          setWebhooks((prev) => prev.filter((w) => w.id !== deleting!.id));
          toast.success("Webhook deleted");
          setDeleting(null);
        }}
      />
    </div>
  );
}
