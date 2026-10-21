import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAdminApiError, type AdminApiError } from "@/lib/admin-catalog-api";
import { getAdminMerchantHistory, type AdminMerchantHistoryItem } from "@/lib/admin-merchants-api";
import { formatDateTime } from "@/lib/format";

const EVENT_LABELS: Record<string, string> = {
  "onboarding.approved": "Onboarding approved",
  "onboarding.rejected": "Onboarding rejected",
  "onboarding.changes_requested": "Onboarding changes requested",
  "keys.live_generated": "Live keys generated",
  "merchant.suspended": "Merchant suspended",
  "merchant.activated": "Merchant activated",
  "merchant.deactivated": "Merchant deactivated",
  "settlement_bank_account.verified": "Settlement account approved",
  "settlement_bank_account.rejected": "Settlement account rejected",
};

const FIELD_LABELS: Record<string, string> = {
  VerificationStatus: "Verification status",
  OnboardingStatus: "Onboarding status",
  Status: "Status",
  LivePublicKey: "Live public key",
};

const PERMISSION_DENIED = "You do not have permission to perform this action.";

function eventLabel(eventType: string): string {
  return EVENT_LABELS[eventType] ?? eventType.replace(/[._]/g, " ");
}

function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

function textOrNull(value: string | null): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return value;
}

function actorLabel(item: AdminMerchantHistoryItem): string {
  const name = textOrNull(item.actorName);
  const type = textOrNull(item.actorType);
  if (name && type) return `${name} (${type})`;
  if (name) return name;
  if (type) return type;
  return "Unknown actor";
}

function changeLine(item: AdminMerchantHistoryItem): string | null {
  const field = textOrNull(item.field);
  const previous = textOrNull(item.previousValue);
  const next = textOrNull(item.newValue);
  if (!field && !previous && !next) return null;
  const prefix = field ? `${fieldLabel(field)}: ` : "";
  return `${prefix}${previous ?? "—"} → ${next ?? "—"}`;
}

type HistoryState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; items: AdminMerchantHistoryItem[] };

export function MerchantHistoryCard({ merchantId, revision }: { merchantId: string; revision: number }) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<HistoryState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    void getAdminMerchantHistory(merchantId)
      .then((items) => {
        if (cancelled) return;
        setState({ kind: "ready", items });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const err = e as AdminApiError;
        const message = err.status === 403 ? PERMISSION_DENIED : formatAdminApiError(err.body);
        setState({ kind: "error", message });
      });
    return () => {
      cancelled = true;
    };
  }, [merchantId, revision, attempt]);

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {state.kind === "loading" ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        ) : null}
        {state.kind === "error" ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-destructive">{state.message}</p>
            <Button size="sm" variant="outline" onClick={() => setAttempt((n) => n + 1)}>
              Retry
            </Button>
          </div>
        ) : null}
        {state.kind === "ready" && state.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : null}
        {state.kind === "ready" && state.items.length > 0 ? (
          <ul className="divide-y">
            {state.items.map((item, index) => {
              const change = changeLine(item);
              const message = textOrNull(item.message);
              return (
                <li key={`${item.id}-${index}`} className="space-y-1 py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-medium">{eventLabel(item.eventType)}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(item.createdAtUtc)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{actorLabel(item)}</p>
                  {change ? <p className="text-sm break-words">{change}</p> : null}
                  {message ? <p className="text-sm break-words text-muted-foreground">{message}</p> : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
