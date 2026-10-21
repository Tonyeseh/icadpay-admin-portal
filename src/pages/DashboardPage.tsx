import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BuildingIcon,
  ReceiptIcon,
  ShieldAlertIcon,
  WalletIcon,
  TrendingUpIcon,
  ClockIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { PageHeader } from "@/components/common/PageHeader";
import { KpiCard } from "@/components/common/KpiCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNaira, formatRelative } from "@/lib/format";
import { MOCK_ANALYTICS_SUMMARY, MOCK_GMV_TREND, MOCK_CHANNEL_MIX } from "@/mock/analytics";
import { MOCK_TRANSACTIONS } from "@/mock/transactions";
import { MOCK_FRAUD_ALERTS } from "@/mock/fraud";
import { MOCK_DISPUTES } from "@/mock/disputes";
import { useAdminStore } from "@/store/useAdminStore";
import { listAdminMerchants } from "@/lib/admin-merchants-api";

export function DashboardPage() {
  const accessToken = useAdminStore((s) => s.accessToken);
  const [onboardingQueueTotal, setOnboardingQueueTotal] = useState<number | null>(null);

  useEffect(() => {
    if (!accessToken?.trim()) {
      setOnboardingQueueTotal(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const [submitted, underReview] = await Promise.all([
          listAdminMerchants({ page: 1, pageSize: 1, onboardingStatus: "Submitted", sort: "created_at", sortDesc: true }),
          listAdminMerchants({ page: 1, pageSize: 1, onboardingStatus: "UnderReview", sort: "created_at", sortDesc: true }),
        ]);
        if (cancelled) return;
        setOnboardingQueueTotal(submitted.totalCount + underReview.totalCount);
      } catch {
        if (!cancelled) setOnboardingQueueTotal(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const s = MOCK_ANALYTICS_SUMMARY;
  const openAlerts = MOCK_FRAUD_ALERTS.filter((a) => a.status === "open").length;
  const openDisputes = MOCK_DISPUTES.filter((d) => d.status === "open" || d.status === "under_review").length;
  const recentTxns = MOCK_TRANSACTIONS.slice(0, 6);

  const chartData = MOCK_GMV_TREND.slice(-14).map((p) => ({
    date: p.date.slice(5),
    gmv: p.value / 100,
  }));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Platform overview — all merchants, all channels"
        actions={
          <div className="flex items-center gap-2">
            {onboardingQueueTotal !== null && onboardingQueueTotal > 0 && (
              <Link to="/merchants?onboarding=Submitted">
                <Button variant="outline" size="sm" className="gap-2">
                  <AlertTriangleIcon className="size-4 text-warning" />
                  {onboardingQueueTotal} onboarding review
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="GMV (this month)"
          value={formatNaira(s.gmv, { compact: true })}
          delta={s.gmvDelta}
          hint="vs last month"
          icon={<TrendingUpIcon className="size-4" />}
        />
        <KpiCard
          label="Transactions"
          value={s.transactionCount.toLocaleString("en-NG")}
          delta={s.transactionCountDelta}
          hint="vs last month"
          icon={<ReceiptIcon className="size-4" />}
        />
        <KpiCard
          label="Approval rate"
          value={`${s.approvalRate}%`}
          delta={s.approvalRateDelta}
          hint="platform-wide"
          icon={<ShieldAlertIcon className="size-4" />}
        />
        <KpiCard
          label="Chargeback rate"
          value={`${s.chargebackRate}%`}
          delta={s.chargebackRateDelta}
          invertDelta
          hint="target <0.5%"
          icon={<AlertTriangleIcon className="size-4" />}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Fee revenue"
          value={formatNaira(s.feeRevenue, { compact: true })}
          delta={s.feeRevenueDelta}
          hint="vs last month"
          icon={<WalletIcon className="size-4" />}
        />
        <KpiCard
          label="Active merchants"
          value={s.activeMerchants.toLocaleString()}
          hint="on platform"
          icon={<BuildingIcon className="size-4" />}
        />
        <KpiCard
          label="Open fraud alerts"
          value={String(openAlerts)}
          hint="require review"
          icon={<ShieldAlertIcon className="size-4" />}
        />
        <KpiCard
          label="Open disputes"
          value={String(openDisputes)}
          hint="require action"
          icon={<AlertTriangleIcon className="size-4" />}
        />
      </div>

      {/* Charts row */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card size="sm" className="xl:col-span-2">
          <CardHeader>
            <CardTitle>GMV trend (14 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="date"
                  stroke="var(--color-muted-foreground)"
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₦${(v / 1_000_000).toFixed(0)}M`}
                />
                <Tooltip
                  cursor={{ stroke: "var(--color-primary)" }}
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-popover-foreground)",
                    fontSize: 12,
                  }}
                  formatter={(v) => [`₦${((v as number) / 1_000_000).toFixed(2)}M`, "GMV"]}
                />
                <Area type="monotone" dataKey="gmv" stroke="var(--color-primary)" strokeWidth={2} fill="url(#gmvGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Channel mix</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={MOCK_CHANNEL_MIX} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                  {MOCK_CHANNEL_MIX.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-popover-foreground)",
                    fontSize: 12,
                  }}
                  formatter={(v) => [`${v}%`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1.5">
              {MOCK_CHANNEL_MIX.map((c) => (
                <div key={c.channel} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ background: c.color }} />
                    <span className="text-muted-foreground">{c.channel}</span>
                  </div>
                  <span className="font-medium tabular-nums">{c.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent transactions + action items */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card size="sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent transactions</CardTitle>
            <Link to="/transactions">
              <Button variant="ghost" size="sm" className="text-xs">View all</Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentTxns.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{tx.customerName}</p>
                    <p className="truncate text-xs text-muted-foreground">{tx.merchantName}</p>
                  </div>
                  <div className="ml-3 flex flex-col items-end gap-1">
                    <span className="tabular-nums text-sm font-semibold">{formatNaira(tx.amount)}</span>
                    <StatusBadge status={tx.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Action items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {onboardingQueueTotal !== null && onboardingQueueTotal > 0 && (
              <Link to="/merchants?onboarding=Submitted" className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 p-3 hover:bg-warning/10">
                <AlertTriangleIcon className="size-4 shrink-0 text-warning" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {onboardingQueueTotal} merchant{onboardingQueueTotal === 1 ? "" : "s"} in onboarding review
                  </p>
                  <p className="text-xs text-muted-foreground">Submitted or under review</p>
                </div>
              </Link>
            )}
            {openAlerts > 0 && (
              <Link to="/fraud/alerts" className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 hover:bg-destructive/10">
                <ShieldAlertIcon className="size-4 shrink-0 text-destructive" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{openAlerts} open fraud alerts</p>
                  <p className="text-xs text-muted-foreground">High-risk transactions flagged for review</p>
                </div>
              </Link>
            )}
            {openDisputes > 0 && (
              <Link to="/transactions/disputes" className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 hover:bg-primary/10">
                <ReceiptIcon className="size-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{openDisputes} open disputes</p>
                  <p className="text-xs text-muted-foreground">Disputes requiring your attention</p>
                </div>
              </Link>
            )}
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <ClockIcon className="size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Platform healthy</p>
                {/* eslint-disable-next-line react-hooks/purity */}
                <p className="text-xs text-muted-foreground">All processors operational · Last checked {formatRelative(new Date(Date.now() - 120000).toISOString())}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
