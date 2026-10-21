import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SendIcon, ShieldCheckIcon, XCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatAdminOnboardingError, type AdminApiError } from "@/lib/admin-catalog-api";
import {
  patchApproveMerchantOnboarding,
  patchRejectMerchantOnboarding,
  patchRequestMerchantOnboardingChanges,
} from "@/lib/admin-merchant-onboarding-api";
import { listAdminMerchants } from "@/lib/admin-merchants-api";
import {
  canApproveMerchantOnboarding,
  canRejectMerchantOnboarding,
  canRequestMerchantOnboardingChanges,
} from "@/lib/platform-permission";
import { useAdminStore } from "@/store/useAdminStore";
import { toast } from "sonner";

const REJECTION_REASON_MAX = 500;
const CHANGE_REQUEST_MESSAGE_MAX = 1000;

/** Approve, reject, and request-changes are allowed only from `Submitted` or `UnderReview`. */
function canReviewOnboarding(status: string): boolean {
  const key = status.toLowerCase().replace(/_/g, "");
  return key === "submitted" || key === "underreview";
}

function statusExplanation(status: string): string | null {
  const key = status.toLowerCase().replace(/_/g, "");
  switch (key) {
    case "requiresaction":
      return "The merchant has to resubmit before another review.";
    case "approved":
      return "Onboarding is approved.";
    case "rejected":
      return "Onboarding is rejected.";
    case "draft":
      return "The merchant has not submitted.";
    default:
      return null;
  }
}

export function MerchantOnboardingPanel({
  merchantId,
  onboardingStatus,
  onCaseChanged,
}: {
  merchantId: string;
  onboardingStatus: string;
  onCaseChanged?: () => void;
}) {
  const permissions = useAdminStore((s) => s.permissions);
  const canApprove = canApproveMerchantOnboarding(permissions);
  const canReject = canRejectMerchantOnboarding(permissions);
  const canRequestChanges = canRequestMerchantOnboardingChanges(permissions);

  const [busy, setBusy] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [changesOpen, setChangesOpen] = useState(false);
  const [changesMessage, setChangesMessage] = useState("");
  const [nextMerchantId, setNextMerchantId] = useState<string | null>(null);

  useEffect(() => {
    setNextMerchantId(null);
  }, [merchantId]);

  async function runMutation(fn: () => Promise<void>, success: string): Promise<boolean> {
    setBusy(true);
    setNextMerchantId(null);
    try {
      await fn();
      toast.success(success);
      try {
        const page = await listAdminMerchants({
          page: 1,
          pageSize: 20,
          onboardingStatus: "Submitted",
          sort: "created_at",
          sortDesc: true,
        });
        const next = page.items.find((item) => item.id !== merchantId);
        setNextMerchantId(next?.id ?? null);
      } catch {
        setNextMerchantId(null);
      }
      onCaseChanged?.();
      return true;
    } catch (e) {
      const err = e as AdminApiError;
      toast.error(formatAdminOnboardingError(err.body));
      return false;
    } finally {
      setBusy(false);
    }
  }

  const reviewEnabled = canReviewOnboarding(onboardingStatus);
  const explanation = statusExplanation(onboardingStatus);
  const hasReviewPermission = canApprove || canReject || canRequestChanges;

  return (
    <Card size="sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Decision</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {explanation ? <p className="text-sm text-muted-foreground">{explanation}</p> : null}

        {!hasReviewPermission ? (
          <p className="text-sm text-muted-foreground">
            You do not have permission to approve, reject, or request changes.
          </p>
        ) : null}

        {reviewEnabled && hasReviewPermission ? (
          <div className="flex flex-col gap-2">
            {canApprove ? (
              <Button
                size="sm"
                className="bg-success text-success-foreground hover:bg-success/90"
                disabled={busy}
                onClick={() => setApproveOpen(true)}
              >
                <ShieldCheckIcon className="size-4" />
                Approve
              </Button>
            ) : null}
            {canReject ? (
              <Button
                size="sm"
                variant="outline"
                className="border-destructive/40 text-destructive hover:bg-destructive/10"
                disabled={busy}
                onClick={() => {
                  setRejectReason("");
                  setRejectOpen(true);
                }}
              >
                <XCircleIcon className="size-4" />
                Reject
              </Button>
            ) : null}
            {canRequestChanges ? (
              <Button
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setChangesMessage("");
                  setChangesOpen(true);
                }}
              >
                <SendIcon className="size-4" />
                Request changes
              </Button>
            ) : null}
          </div>
        ) : null}

        {nextMerchantId ? (
          <Link
            to={`/merchants/${nextMerchantId}`}
            className="inline-block text-sm font-medium text-primary hover:underline"
          >
            Review next submitted merchant
          </Link>
        ) : null}
      </CardContent>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve onboarding</DialogTitle>
            <DialogDescription>
              Approving issues live keys. The merchant account status will not change.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              className="bg-success text-success-foreground hover:bg-success/90"
              disabled={busy}
              onClick={() => {
                void runMutation(
                  () => patchApproveMerchantOnboarding(merchantId),
                  "Onboarding approved.",
                ).then((ok) => {
                  if (ok) setApproveOpen(false);
                });
              }}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject onboarding</DialogTitle>
            <DialogDescription>Reason sent with the rejection.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value.slice(0, REJECTION_REASON_MAX))}
              placeholder="Reason for rejection…"
              maxLength={REJECTION_REASON_MAX}
              rows={4}
            />
            <p className="text-right text-xs text-muted-foreground">
              {rejectReason.length}/{REJECTION_REASON_MAX}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy || !rejectReason.trim()}
              onClick={() => {
                const reason = rejectReason.trim().slice(0, REJECTION_REASON_MAX);
                void runMutation(
                  () => patchRejectMerchantOnboarding(merchantId, reason),
                  "Onboarding rejected.",
                ).then((ok) => {
                  if (ok) setRejectOpen(false);
                });
              }}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={changesOpen} onOpenChange={setChangesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request changes</DialogTitle>
            <DialogDescription>Message sent to the merchant describing what needs to change.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="changes-message">Message</Label>
            <Textarea
              id="changes-message"
              value={changesMessage}
              onChange={(e) => setChangesMessage(e.target.value.slice(0, CHANGE_REQUEST_MESSAGE_MAX))}
              maxLength={CHANGE_REQUEST_MESSAGE_MAX}
              rows={4}
            />
            <p className="text-right text-xs text-muted-foreground">
              {changesMessage.length}/{CHANGE_REQUEST_MESSAGE_MAX}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangesOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={busy || !changesMessage.trim()}
              onClick={() => {
                const message = changesMessage.trim().slice(0, CHANGE_REQUEST_MESSAGE_MAX);
                void runMutation(
                  () => patchRequestMerchantOnboardingChanges(merchantId, message),
                  "Change request sent.",
                ).then((ok) => {
                  if (ok) setChangesOpen(false);
                });
              }}
            >
              Send request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
