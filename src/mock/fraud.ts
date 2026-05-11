import type { FraudAlert, FraudRule, AmlEntry } from "@/types";
import { MOCK_TRANSACTIONS } from "./transactions";
import { MOCK_MERCHANTS } from "./merchants";

function past(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const MOCK_FRAUD_ALERTS: FraudAlert[] = MOCK_TRANSACTIONS.filter((t) => (t.riskScore ?? 0) > 55).slice(0, 15).map((tx, i) => ({
  id: `frd_${String(i + 1).padStart(4, "0")}`,
  transactionId: tx.id,
  merchantId: tx.merchantId,
  merchantName: tx.merchantName,
  amount: tx.amount,
  riskScore: tx.riskScore ?? 70,
  triggeredRules: [
    ["High velocity", "Unusual hour"][i % 2],
    ["New device", "VPN detected", "High amount"][i % 3],
  ].filter(Boolean),
  status: (["open", "open", "investigating", "resolved", "false_positive"] as const)[i % 5],
  createdAt: past(rnd(0, 7)),
  reviewedBy: i % 3 === 0 ? "Ngozi Eze" : undefined,
  reviewedAt: i % 3 === 0 ? past(rnd(0, 2)) : undefined,
  notes: i % 4 === 0 ? "Escalated to risk team for manual review." : undefined,
}));

export const MOCK_FRAUD_RULES: FraudRule[] = [
  {
    id: "rule_001",
    name: "High velocity — single card",
    description: "Block if same card used >5 times in 1 hour",
    category: "velocity",
    condition: "card.count(1h) > 5",
    action: "block",
    status: "active",
    triggeredCount: 142,
    falsePositiveRate: 3.5,
    createdAt: past(90),
    updatedAt: past(5),
    updatedBy: "Ngozi Eze",
  },
  {
    id: "rule_002",
    name: "Large single transaction",
    description: "Flag transactions above ₦500,000 for review",
    category: "amount",
    condition: "amount > 50000000",
    action: "review",
    status: "active",
    triggeredCount: 67,
    falsePositiveRate: 12.0,
    createdAt: past(60),
    updatedAt: past(10),
    updatedBy: "Ngozi Eze",
  },
  {
    id: "rule_003",
    name: "Unusual hour payment",
    description: "Flag card payments between 1am–4am",
    category: "behaviour",
    condition: "hour(createdAt) BETWEEN 1 AND 4 AND channel = 'card'",
    action: "flag",
    status: "active",
    triggeredCount: 234,
    falsePositiveRate: 22.0,
    createdAt: past(120),
    updatedAt: past(15),
    updatedBy: "Tunde Okonkwo",
  },
  {
    id: "rule_004",
    name: "New device high value",
    description: "Review if new device fingerprint + amount > ₦100k",
    category: "device",
    condition: "device.isNew = true AND amount > 10000000",
    action: "review",
    status: "active",
    triggeredCount: 31,
    falsePositiveRate: 8.0,
    createdAt: past(45),
    updatedAt: past(3),
    updatedBy: "Ngozi Eze",
  },
  {
    id: "rule_005",
    name: "VPN / proxy detected",
    description: "Flag payments routed through known VPN/proxy IPs",
    category: "geo",
    condition: "ip.isVPN = true OR ip.isProxy = true",
    action: "flag",
    status: "inactive",
    triggeredCount: 89,
    falsePositiveRate: 35.0,
    createdAt: past(200),
    updatedAt: past(30),
    updatedBy: "Ngozi Eze",
  },
  {
    id: "rule_006",
    name: "Card BIN mismatch — country",
    description: "Block if card-issuing country differs from merchant country",
    category: "card",
    condition: "card.issuerCountry != merchant.country",
    action: "block",
    status: "draft",
    triggeredCount: 0,
    falsePositiveRate: 0,
    createdAt: past(2),
    updatedAt: past(2),
    updatedBy: "Tunde Okonkwo",
  },
];

export const MOCK_AML_QUEUE: AmlEntry[] = MOCK_MERCHANTS.slice(0, 8).map((m, i) => ({
  id: `aml_${String(i + 1).padStart(4, "0")}`,
  merchantId: m.id,
  merchantName: m.businessName,
  flag: (["structuring", "high_risk_country", "pep", "unusual_pattern", "structuring", "sanctions", "unusual_pattern", "high_risk_country"] as AmlEntry["flag"][])[i],
  description: [
    "Multiple transactions just below ₦5M threshold over 3 days",
    "Transactions linked to high-risk jurisdiction",
    "Merchant owner identified as politically exposed person",
    "Unusual spike in transaction volume — 400% above baseline",
    "Series of split deposits to avoid reporting threshold",
    "Name match on OFAC sanctions list",
    "Late-night transaction burst inconsistent with business type",
    "Cross-border transfer pattern to flagged correspondent bank",
  ][i],
  amount: rnd(1_000_000, 50_000_000) * 100,
  status: (["pending", "pending", "reviewed", "escalated", "pending", "escalated", "reviewed", "pending"] as AmlEntry["status"][])[i],
  createdAt: past(rnd(1, 14)),
  reviewedBy: i % 3 === 0 ? "Ngozi Eze" : undefined,
  reviewedAt: i % 3 === 0 ? past(rnd(0, 3)) : undefined,
}));
