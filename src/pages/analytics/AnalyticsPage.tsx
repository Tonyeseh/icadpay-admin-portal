import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line,
} from "recharts";
import { PageHeader } from "@/components/common/PageHeader";
import { KpiCard } from "@/components/common/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUpIcon, ReceiptIcon, ShieldAlertIcon, WalletIcon, BuildingIcon } from "lucide-react";
import { formatNaira, formatPercent } from "@/lib/format";
import {
  MOCK_ANALYTICS_SUMMARY,
  MOCK_GMV_TREND,
  MOCK_APPROVAL_TREND,
  MOCK_FEE_TREND,
  MOCK_TOP_MERCHANTS,
} from "@/mock/analytics";

export function AnalyticsPage() {
  const s = MOCK_ANALYTICS_SUMMARY;

  const gmvData = MOCK_GMV_TREND.slice(-14).map((p) => ({ date: p.date.slice(5), value: p.value / 100 }));
  const approvalData = MOCK_APPROVAL_TREND.slice(-14).map((p) => ({ date: p.date.slice(5), value: p.value }));
  const feeData = MOCK_FEE_TREND.slice(-14).map((p) => ({ date: p.date.slice(5), value: p.value / 100 }));

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Platform-wide performance metrics"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <KpiCard label="GMV (30d)" value={formatNaira(s.gmv, { compact: true })} delta={s.gmvDelta} hint="vs prev 30d" icon={<TrendingUpIcon className="size-4" />} />
        <KpiCard label="Transactions" value={s.transactionCount.toLocaleString()} delta={s.transactionCountDelta} icon={<ReceiptIcon className="size-4" />} />
        <KpiCard label="Approval rate" value={`${s.approvalRate}%`} delta={s.approvalRateDelta} icon={<ShieldAlertIcon className="size-4" />} />
        <KpiCard label="Chargeback rate" value={`${s.chargebackRate}%`} delta={s.chargebackRateDelta} invertDelta icon={<ShieldAlertIcon className="size-4" />} />
        <KpiCard label="Fee revenue" value={formatNaira(s.feeRevenue, { compact: true })} delta={s.feeRevenueDelta} icon={<WalletIcon className="size-4" />} />
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card size="sm">
          <CardHeader><CardTitle>GMV (14 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={gmvData}>
                <defs>
                  <linearGradient id="gmvGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₦${(v / 1_000_000).toFixed(0)}M`} />
                <Tooltip formatter={(v) => [`₦${((v as number) / 1_000_000).toFixed(2)}M`, "GMV"]} />
                <Area type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={2} fill="url(#gmvGrad2)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader><CardTitle>Approval rate (14 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={approvalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis domain={[88, 99]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => [`${v}%`, "Approval rate"]} />
                <Line type="monotone" dataKey="value" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader><CardTitle>Fee revenue (14 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={feeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₦${(v / 1_000_000).toFixed(1)}M`} />
                <Tooltip formatter={(v) => [`₦${((v as number) / 1_000_000).toFixed(2)}M`, "Fees"]} />
                <Bar dataKey="value" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader><CardTitle>Top merchants by volume</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {MOCK_TOP_MERCHANTS.map((m, i) => (
                <div key={m.name} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground w-4">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.txCount.toLocaleString()} txns · {m.approvalRate}% approval</p>
                    </div>
                  </div>
                  <span className="tabular-nums text-sm font-semibold">{formatNaira(m.volume, { compact: true })}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
