import type { LedgerEntry, AdminPayout, ReconciliationReport } from "@/types";
import { MOCK_MERCHANTS } from "./merchants";

function past(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const BANKS = ["GTBank", "Access Bank", "Zenith Bank", "UBA", "First Bank"];

let runningBalance = 85_000_000_00; // ₦85M in kobo

export const MOCK_LEDGER: LedgerEntry[] = Array.from({ length: 30 }, (_, i) => {
  const merchant = MOCK_MERCHANTS[i % MOCK_MERCHANTS.length];
  const type = (["settlement", "fee", "refund", "chargeback", "payout"] as LedgerEntry["type"][])[i % 5];
  const amount = rnd(50_000, 5_000_000) * 100;
  const isCredit = type === "fee" || type === "settlement";
  runningBalance = isCredit ? runningBalance + amount : runningBalance - amount;

  return {
    id: `led_${String(i + 1).padStart(4, "0")}`,
    type,
    merchantId: merchant.id,
    merchantName: merchant.businessName,
    amount,
    balance: runningBalance,
    description: {
      settlement: `Settlement for ${merchant.businessName}`,
      fee: `Platform fee — ${merchant.businessName}`,
      refund: `Refund processed — ${merchant.businessName}`,
      chargeback: `Chargeback reversal — ${merchant.businessName}`,
      payout: `Merchant payout — ${merchant.businessName}`,
      reversal: `Reversal — ${merchant.businessName}`,
    }[type],
    reference: `LDG-${Date.now() - i * 86400000}-${String(i).padStart(5, "0")}`,
    createdAt: past(rnd(0, 29)),
  };
});

export const MOCK_ADMIN_PAYOUTS: AdminPayout[] = MOCK_MERCHANTS.slice(0, 15).map((m, i) => {
  const statuses: AdminPayout["status"][] = ["pending", "approved", "processing", "paid", "paid", "paid", "on_hold", "failed", "pending", "approved", "paid", "paid", "on_hold", "processing", "paid"];
  const status = statuses[i];
  const amount = rnd(100_000, 5_000_000) * 100;

  return {
    id: `pyt_${String(i + 1).padStart(4, "0")}`,
    merchantId: m.id,
    merchantName: m.businessName,
    amount,
    status,
    bankName: BANKS[i % BANKS.length],
    accountNumber: `0${rnd(100000000, 999999999)}`,
    accountName: m.ownerName,
    requestedAt: past(rnd(1, 14)),
    approvedAt: ["approved", "processing", "paid"].includes(status) ? past(rnd(0, 3)) : undefined,
    approvedBy: ["approved", "processing", "paid"].includes(status) ? "Ife Adebayo" : undefined,
    settledAt: status === "paid" ? past(rnd(0, 2)) : undefined,
    holdReason: status === "on_hold" ? "Merchant has open dispute — payout held pending resolution" : undefined,
    reference: `PYT-${Date.now() - i * 3600000}-${String(i).padStart(4, "0")}`,
  };
});

export const MOCK_RECONCILIATION: ReconciliationReport[] = [
  { id: "rec_001", period: "2025-04", totalVolume: 12_500_000_000_00, totalFees: 187_500_000_00, totalPayouts: 11_800_000_000_00, totalRefunds: 45_000_000_00, totalChargebacks: 12_000_000_00, netRevenue: 187_500_000_00, status: "finalised", generatedAt: past(7), generatedBy: "Ife Adebayo" },
  { id: "rec_002", period: "2025-03", totalVolume: 11_200_000_000_00, totalFees: 168_000_000_00, totalPayouts: 10_500_000_000_00, totalRefunds: 38_000_000_00, totalChargebacks: 9_500_000_00, netRevenue: 168_000_000_00, status: "finalised", generatedAt: past(37), generatedBy: "Ife Adebayo" },
  { id: "rec_003", period: "2025-02", totalVolume: 9_800_000_000_00, totalFees: 147_000_000_00, totalPayouts: 9_200_000_000_00, totalRefunds: 29_000_000_00, totalChargebacks: 7_200_000_00, netRevenue: 147_000_000_00, status: "finalised", generatedAt: past(67), generatedBy: "Ife Adebayo" },
  { id: "rec_004", period: "2025-05", totalVolume: 6_300_000_000_00, totalFees: 94_500_000_00, totalPayouts: 5_900_000_000_00, totalRefunds: 18_000_000_00, totalChargebacks: 4_500_000_00, netRevenue: 94_500_000_00, status: "draft", generatedAt: past(1), generatedBy: "Ife Adebayo" },
];
