import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircleIcon, XCircleIcon, EyeIcon, FileTextIcon } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime } from "@/lib/format";
import { MOCK_MERCHANTS, MOCK_KYC_DOCS } from "@/mock/merchants";
import { canDo } from "@/lib/rbac";
import { useAdminStore } from "@/store/useAdminStore";
import { toast } from "sonner";
import type { Merchant } from "@/types";

export function KycQueuePage() {
  const role = useAdminStore((s) => s.role);
  const [merchants, setMerchants] = useState(
    MOCK_MERCHANTS.filter((m) => m.kycStatus === "in_review" || m.kycStatus === "pending")
  );
  const [approving, setApproving] = useState<Merchant | null>(null);
  const [rejecting, setRejecting] = useState<Merchant | null>(null);

  const canReview = canDo(role, "merchants:kyc_review");

  function approve(m: Merchant) {
    setMerchants((prev) => prev.filter((x) => x.id !== m.id));
    toast.success(`${m.businessName} KYC approved`);
    setApproving(null);
  }

  function reject(m: Merchant) {
    setMerchants((prev) => prev.filter((x) => x.id !== m.id));
    toast.error(`${m.businessName} KYC rejected`);
    setRejecting(null);
  }

  return (
    <div>
      <PageHeader
        title="KYC Queue"
        description={`${merchants.length} merchants pending review`}
      />

      {merchants.length === 0 ? (
        <Card size="sm">
          <CardContent className="py-16 text-center">
            <CheckCircleIcon className="mx-auto mb-3 size-10 text-success" />
            <p className="font-medium">Queue is clear!</p>
            <p className="mt-1 text-sm text-muted-foreground">All merchant KYC submissions have been reviewed.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {merchants.map((m) => {
            const docs = MOCK_KYC_DOCS.filter((d) => d.merchantId === m.id);
            return (
              <Card key={m.id} size="sm">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link to={`/merchants/${m.id}`} className="font-semibold hover:underline">
                          {m.businessName}
                        </Link>
                        <StatusBadge status={m.kycStatus} />
                        <Badge variant="outline" className="text-xs capitalize">{m.businessType}</Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>{m.ownerName}</span>
                        <span>{m.ownerEmail}</span>
                        <span>{m.industry}</span>
                        <span>Submitted {formatDate(m.createdAt)}</span>
                      </div>

                      {/* Documents */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {docs.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs"
                          >
                            <FileTextIcon className="size-3.5 text-muted-foreground" />
                            <span className="capitalize">{doc.type.replace("_", " ")}</span>
                            <StatusBadge status={doc.status} className="text-[10px]" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/merchants/${m.id}`}>
                          <EyeIcon className="size-4" />
                          View
                        </Link>
                      </Button>
                      {canReview && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-destructive/40 text-destructive hover:bg-destructive/10"
                            onClick={() => setRejecting(m)}
                          >
                            <XCircleIcon className="size-4" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            className="bg-success text-success-foreground hover:bg-success/90"
                            onClick={() => setApproving(m)}
                          >
                            <CheckCircleIcon className="size-4" />
                            Approve
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!approving}
        onOpenChange={(v) => !v && setApproving(null)}
        title={`Approve KYC for ${approving?.businessName}?`}
        description="The merchant will be notified and their account will become fully active."
        confirmLabel="Approve KYC"
        onConfirm={() => approve(approving!)}
      />

      <ConfirmDialog
        open={!!rejecting}
        onOpenChange={(v) => !v && setRejecting(null)}
        title={`Reject KYC for ${rejecting?.businessName}?`}
        description="The merchant will be notified to resubmit their documents with corrections."
        confirmLabel="Reject KYC"
        variant="destructive"
        onConfirm={() => reject(rejecting!)}
      />
    </div>
  );
}
