import type { AnalyticsSummary, TimeSeriesPoint } from "@/types";

function pastDate(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

export const MOCK_ANALYTICS_SUMMARY: AnalyticsSummary = {
  gmv: 12_500_000_000_00, // ₦125B in kobo
  gmvDelta: 11.4,
  transactionCount: 284_392,
  transactionCountDelta: 8.7,
  approvalRate: 94.2,
  approvalRateDelta: 1.3,
  chargebackRate: 0.42,
  chargebackRateDelta: -0.08,
  feeRevenue: 187_500_000_00, // ₦1.875B
  feeRevenueDelta: 11.4,
  activeMerchants: 1_247,
};

// 30-day GMV trend
export const MOCK_GMV_TREND: TimeSeriesPoint[] = Array.from({ length: 30 }, (_, i) => ({
  date: pastDate(29 - i),
  value: (380_000_000 + Math.sin(i * 0.4) * 80_000_000 + i * 5_000_000 + Math.random() * 40_000_000) * 100,
}));

// 30-day approval rate
export const MOCK_APPROVAL_TREND: TimeSeriesPoint[] = Array.from({ length: 30 }, (_, i) => ({
  date: pastDate(29 - i),
  value: parseFloat((92 + Math.sin(i * 0.3) * 2 + Math.random() * 1.5).toFixed(2)),
}));

// Channel mix (last 30 days)
export const MOCK_CHANNEL_MIX = [
  { channel: "Card", value: 58, color: "var(--color-chart-1)" },
  { channel: "Transfer", value: 32, color: "var(--color-chart-2)" },
  { channel: "USSD", value: 7, color: "var(--color-chart-3)" },
  { channel: "QR", value: 3, color: "var(--color-chart-4)" },
];

// Top 5 merchants by volume
export const MOCK_TOP_MERCHANTS = [
  { name: "Kola Ventures Ltd", volume: 2_400_000_000_00, txCount: 12_400, approvalRate: 96.2 },
  { name: "Emeka Digital Services", volume: 1_900_000_000_00, txCount: 9_800, approvalRate: 95.8 },
  { name: "Obinna Oil & Gas", volume: 1_600_000_000_00, txCount: 5_200, approvalRate: 97.1 },
  { name: "Yinka Electronics", volume: 1_200_000_000_00, txCount: 8_600, approvalRate: 94.5 },
  { name: "Tunde Logistics NG", volume: 980_000_000_00, txCount: 7_100, approvalRate: 93.8 },
];

// Fee revenue trend
export const MOCK_FEE_TREND: TimeSeriesPoint[] = MOCK_GMV_TREND.map((p) => ({
  date: p.date,
  value: Math.round(p.value * 0.015),
}));
