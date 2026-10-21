import { DownloadIcon, FileTextIcon, CheckCircleIcon, ClockIcon } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNaira, formatDate } from "@/lib/format";
import { MOCK_RECONCILIATION } from "@/mock/financial";
import { toast } from "sonner";

export function ReconciliationPage() {
  return (
    <div>
      <PageHeader
        title="Reconciliation"
        description="Monthly reconciliation reports, fee statements, and tax exports"
        actions={
          <Button size="sm" onClick={() => toast.success("Report generated")}>
            <FileTextIcon className="size-4" />
            Generate report
          </Button>
        }
      />

      <div className="space-y-3">
        {MOCK_RECONCILIATION.map((r) => (
          <Card key={r.id} size="sm">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 grid size-8 place-items-center rounded-lg ${r.status === "finalised" ? "bg-success/10 text-success" : "bg-warning/10 text-warning-foreground"}`}>
                    {r.status === "finalised" ? <CheckCircleIcon className="size-4" /> : <ClockIcon className="size-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{r.period}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Generated {formatDate(r.generatedAt)} by {r.generatedBy}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm sm:grid-cols-4">
                  <ReconItem label="GMV" value={formatNaira(r.totalVolume, { compact: true })} />
                  <ReconItem label="Fees" value={formatNaira(r.totalFees, { compact: true })} highlight />
                  <ReconItem label="Payouts" value={formatNaira(r.totalPayouts, { compact: true })} />
                  <ReconItem label="Refunds" value={formatNaira(r.totalRefunds, { compact: true })} />
                  <ReconItem label="Chargebacks" value={formatNaira(r.totalChargebacks, { compact: true })} />
                  <ReconItem label="Net revenue" value={formatNaira(r.netRevenue, { compact: true })} highlight />
                </div>

                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => toast.success("PDF downloaded")}>
                    <DownloadIcon className="size-4" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toast.success("CSV downloaded")}>
                    <DownloadIcon className="size-4" />
                    CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ReconItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold tabular-nums ${highlight ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}
