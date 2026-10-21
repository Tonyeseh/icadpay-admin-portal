import { useEffect, useState, type ReactNode } from "react";
import { LandmarkIcon, ShieldCheckIcon, XCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatAdminSettlementBankError, type AdminApiError } from "@/lib/admin-catalog-api";
import {
  patchApproveSettlementBankAccount,
  patchRejectSettlementBankAccount,
  type AdminMerchantSettlementBank,
} from "@/lib/admin-merchants-api";
import {
  canApproveSettlementBankAccount,
  canRejectSettlementBankAccount,
} from "@/lib/platform-permission";
import { useAdminStore } from "@/store/useAdminStore";

const REJECTION_REASON_MAX = 500;

function isPendingVerification(status: string): boolean {
  return status.trim().toLowerCase() === "pending";
}

export function MerchantSettlementBankCard({
  merchantId,
  settlementBank,
  onChanged,
}: {
  merchantId: string;
  settlementBank: AdminMerchantSettlementBank | null;
  onChanged: () => void;
}) {
  const permissions = useAdminStore((s) => s.permissions);
  const canApprove = canApproveSettlementBankAccount(permissions);
  const canReject = canRejectSettlementBankAccount(permissions);

  const [busy, setBusy] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    setBusy(false);
    setApproveOpen(false);
    setRejectOpen(false);
    setRejectReason("");
  }, [merchantId]);

  const accountId = settlementBank?.id.trim() ?? "";
  const pending = settlementBank ? isPendingVerification(settlementBank.verificationStatus) : false;
  const showActions = Boolean(settlementBank) && accountId.length > 0 && pending;

  async function approve() {
    if (!accountId || busy) return;
    setBusy(true);
    try {
      await patchApproveSettlementBankAccount(merchantId, accountId);
      toast.success("Settlement account approved.");
      setApproveOpen(false);
      onChanged();
    } catch (e) {
      const err = e as AdminApiError;
      toast.error(formatAdminSettlementBankError(err.status, err.body));
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    const reason = rejectReason.trim().slice(0, REJECTION_REASON_MAX);
    if (!accountId || busy || !reason) return;
    setBusy(true);
    try {
      await patchRejectSettlementBankAccount(merchantId, accountId, reason);
      toast.success("Settlement account rejected.");
      setRejectOpen(false);
      onChanged();
    } catch (e) {
      const err = e as AdminApiError;
      toast.error(formatAdminSettlementBankError(err.status, err.body));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Settlement bank</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {settlementBank ? (
          <>
            <InfoRow icon={<LandmarkIcon className="size-4" />} label="Bank" value={settlementBank.bankName} />
            <InfoRow icon={<LandmarkIcon className="size-4" />} label="Account name" value={settlementBank.accountName} />
            <InfoRow icon={<LandmarkIcon className="size-4" />} label="Account number" value={settlementBank.accountNumber} />
            <InfoRow icon={<LandmarkIcon className="size-4" />} label="Primary" value={settlementBank.isPrimary ? "Yes" : "No"} />
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0 text-muted-foreground">
                <LandmarkIcon className="size-4" />
              </span>
              <div className="min-w-0">
                <span className="text-muted-foreground">Verification: </span>
                <StatusBadge status={settlementBank.verificationStatus} />
              </div>
            </div>
            {!accountId ? (
              <p className="text-sm text-muted-foreground">
                Settlement account id is missing, so it cannot be reviewed.
              </p>
            ) : null}
            {showActions && (canApprove || canReject) ? (
              <div className="flex flex-wrap gap-2">
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
              </div>
            ) : null}
            {showActions && !canApprove && !canReject ? (
              <p className="text-sm text-muted-foreground">
                You do not have permission to approve or reject this settlement account.
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-muted-foreground">No settlement account on file.</p>
        )}
      </CardContent>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve settlement account</DialogTitle>
            <DialogDescription>
              This marks the account verified and sets it as the primary settlement account.
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
                void approve();
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
            <DialogTitle>Reject settlement account</DialogTitle>
            <DialogDescription>Reason sent with the rejection.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="settlement-reject-reason">Reason</Label>
            <Textarea
              id="settlement-reject-reason"
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
                void reject();
              }}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <span className="text-muted-foreground">{label}: </span>
        <span className="font-medium break-words">{value}</span>
      </div>
    </div>
  );
}
