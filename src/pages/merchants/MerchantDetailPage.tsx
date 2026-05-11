import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  BanIcon,
  CheckCircleIcon,
  ReceiptIcon,
  BuildingIcon,
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  PercentIcon,
  ClockIcon,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { KpiCard } from "@/components/common/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatNaira, formatDate, formatDateTime } from "@/lib/format";
import { getMerchant } from "@/mock/merchants";
import { MOCK_TRANSACTIONS } from "@/mock/transactions";
import { MOCK_DISPUTES } from "@/mock/disputes";
import { canDo } from "@/lib/rbac";
import { useAdminStore } from "@/store/useAdminStore";
import { toast } from "sonner";

export function MerchantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const role = useAdminStore((s) => s.role);
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState(getMerchant(id ?? ""));
  const [suspending, setSuspending] = useState(false);
  const [activating, setActivating] = useState(false);

  if (!merchant) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Merchant not found.</p>
        <Link to="/merchants" className="mt-4 inline-block text-sm text-primary hover:underline">
          Back to merchants
        </Link>
      </div>
    );
  }

  const txns = MOCK_TRANSACTIONS.filter((t) => t.merchantId === merchant.id).slice(0, 10);
  const disputes = MOCK_DISPUTES.filter((d) => d.merchantId === merchant.id);

  return (
    <div>
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 text-muted-foreground">
          <ArrowLeftIcon className="size-4" />
          Merchants
        </Button>
      </div>

      <PageHeader
        title={merchant.businessName}
        description={`${merchant.industry} · ${merchant.businessType}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={merchant.status} />
            <StatusBadge status={merchant.kycStatus} />
            {canDo(role, "merchants:suspend") && merchant.status === "active" && (
              <Button variant="destructive" size="sm" onClick={() => setSuspending(true)}>
                <BanIcon className="size-4" />
                Suspend
              </Button>
            )}
            {canDo(role, "merchants:suspend") && merchant.status === "suspended" && (
              <Button variant="outline" size="sm" onClick={() => setActivating(true)}>
                <CheckCircleIcon className="size-4" />
                Reactivate
              </Button>
            )}
          </div>
        }
      />

      {/* KPI row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Total volume" value={formatNaira(merchant.totalVolume, { compact: true })} icon={<ReceiptIcon className="size-4" />} />
        <KpiCard label="Transactions" value={merchant.totalTransactions.toLocaleString()} icon={<BuildingIcon className="size-4" />} />
        <KpiCard label="Available balance" value={formatNaira(merchant.balance, { compact: true })} icon={<BuildingIcon className="size-4" />} />
        <KpiCard label="Fee rate" value={`${merchant.feeRate}%`} icon={<PercentIcon className="size-4" />} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="disputes">Disputes ({disputes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card size="sm">
              <CardHeader><CardTitle>Business details</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow icon={<BuildingIcon className="size-4" />} label="Business name" value={merchant.businessName} />
                <InfoRow icon={<BuildingIcon className="size-4" />} label="Type" value={merchant.businessType} />
                {merchant.rcNumber && <InfoRow icon={<BuildingIcon className="size-4" />} label="RC number" value={merchant.rcNumber} />}
                <InfoRow icon={<BuildingIcon className="size-4" />} label="Industry" value={merchant.industry} />
                <InfoRow icon={<CalendarIcon className="size-4" />} label="Joined" value={formatDate(merchant.createdAt)} />
                {merchant.approvedAt && <InfoRow icon={<CalendarIcon className="size-4" />} label="KYC approved" value={formatDate(merchant.approvedAt)} />}
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader><CardTitle>Account owner</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow icon={<BuildingIcon className="size-4" />} label="Name" value={merchant.ownerName} />
                <InfoRow icon={<MailIcon className="size-4" />} label="Email" value={merchant.ownerEmail} />
                <InfoRow icon={<PhoneIcon className="size-4" />} label="Phone" value={merchant.ownerPhone} />
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader><CardTitle>Merchant terms</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow icon={<PercentIcon className="size-4" />} label="Fee rate" value={`${merchant.feeRate}% per transaction`} />
                <InfoRow icon={<ClockIcon className="size-4" />} label="Settlement" value={merchant.settlementSchedule} />
              </CardContent>
            </Card>

            {merchant.notes && (
              <Card size="sm" className="border-warning/30 bg-warning/5">
                <CardHeader><CardTitle>Internal notes</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm">{merchant.notes}</p>
                </CardContent>
              </Card>
            )}

            {merchant.status === "suspended" && (
              <Card size="sm" className="border-destructive/30 bg-destructive/5">
                <CardHeader><CardTitle>Suspension details</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <InfoRow icon={<BanIcon className="size-4" />} label="Reason" value={merchant.suspendedReason ?? "—"} />
                  {merchant.suspendedAt && <InfoRow icon={<CalendarIcon className="size-4" />} label="Suspended at" value={formatDateTime(merchant.suspendedAt)} />}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <Card size="sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                      <th className="px-4 py-3 text-left font-medium">Reference</th>
                      <th className="px-4 py-3 text-left font-medium">Customer</th>
                      <th className="px-4 py-3 text-left font-medium">Channel</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">Amount</th>
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {txns.map((t) => (
                      <tr key={t.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.reference.slice(0, 20)}…</td>
                        <td className="px-4 py-3">{t.customerName}</td>
                        <td className="px-4 py-3 capitalize text-muted-foreground">{t.channel}</td>
                        <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">{formatNaira(t.amount)}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(t.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disputes">
          {disputes.length === 0 ? (
            <Card size="sm">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">No disputes for this merchant.</CardContent>
            </Card>
          ) : (
            <Card size="sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                        <th className="px-4 py-3 text-left font-medium">Dispute ID</th>
                        <th className="px-4 py-3 text-left font-medium">Reason</th>
                        <th className="px-4 py-3 text-left font-medium">Network</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-right font-medium">Amount</th>
                        <th className="px-4 py-3 text-left font-medium">Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {disputes.map((d) => (
                        <tr key={d.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{d.id}</td>
                          <td className="px-4 py-3">{d.reason}</td>
                          <td className="px-4 py-3 capitalize text-muted-foreground">{d.network}</td>
                          <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                          <td className="px-4 py-3 text-right tabular-nums font-medium">{formatNaira(d.amount)}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(d.dueDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={suspending}
        onOpenChange={setSuspending}
        title={`Suspend ${merchant.businessName}?`}
        description="All transactions will be declined until the merchant is reactivated."
        confirmLabel="Suspend"
        variant="destructive"
        onConfirm={() => {
          setMerchant((m) => m ? { ...m, status: "suspended" } : m);
          toast.error(`${merchant.businessName} suspended`);
        }}
      />

      <ConfirmDialog
        open={activating}
        onOpenChange={setActivating}
        title={`Reactivate ${merchant.businessName}?`}
        description="The merchant will be able to accept payments again immediately."
        confirmLabel="Reactivate"
        onConfirm={() => {
          setMerchant((m) => m ? { ...m, status: "active" } : m);
          toast.success(`${merchant.businessName} reactivated`);
        }}
      />
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <span className="text-muted-foreground">{label}: </span>
        <span className="font-medium">{value}</span>
      </div>
    </div>
  );
}
