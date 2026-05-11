import type { Merchant, KycDocument } from "@/types";

const NG_BUSINESSES = [
  "Kola Ventures Ltd",
  "Adaeze Foods & Co",
  "Emeka Digital Services",
  "Tunde Logistics NG",
  "Bimpe Fashion House",
  "Chukwudi Tech Hub",
  "Ngozi Health Clinic",
  "Femi Agro Supplies",
  "Yinka Electronics",
  "Sola Events & Weddings",
  "Biodun Auto Spare Parts",
  "Taiwo Printing Press",
  "Kunle Real Estate",
  "Amaka Beauty Studio",
  "Ife Smart Solutions",
  "Dele Engineering Works",
  "Uju Pharmacy & Store",
  "Obinna Oil & Gas",
  "Seun Media Agency",
  "Lola Catering Services",
];

const INDUSTRIES = [
  "E-commerce",
  "Food & Beverage",
  "Healthcare",
  "Logistics",
  "Education",
  "Fashion",
  "Technology",
  "Agriculture",
  "Entertainment",
  "Real Estate",
];

const BANKS = ["GTBank", "Access Bank", "Zenith Bank", "UBA", "First Bank", "Kuda Bank", "OPay"];

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function past(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

export const MOCK_MERCHANTS: Merchant[] = NG_BUSINESSES.map((name, i) => {
  const statuses: Merchant["status"][] = ["active", "active", "active", "active", "suspended", "pending_kyc"];
  const kycStatuses: Merchant["kycStatus"][] = ["approved", "approved", "approved", "in_review", "pending", "rejected"];
  const status = statuses[i % statuses.length];
  const kycStatus = status === "pending_kyc" ? "pending" : kycStatuses[i % kycStatuses.length];

  return {
    id: `mch_${String(i + 1).padStart(4, "0")}`,
    businessName: name,
    businessType: i % 5 === 0 ? "enterprise" : i % 3 === 0 ? "registered" : "starter",
    rcNumber: i % 3 !== 0 ? `RC${rnd(100000, 999999)}` : undefined,
    industry: INDUSTRIES[i % INDUSTRIES.length],
    ownerName: ["Kola Adeyemi", "Ada Okafor", "Emeka Eze", "Tunde Bello", "Bimpe Adeleke", "Chukwudi Nwachukwu", "Ngozi Obi", "Femi Agboola", "Yinka Ojo", "Sola Johnson", "Biodun Alabi", "Taiwo Ibrahim", "Kunle Adesanya", "Amaka Okonkwo", "Ife Adebayo", "Dele Williams", "Uju Nwosu", "Obinna Okeke", "Seun Afolabi", "Lola Babatunde"][i],
    ownerEmail: `owner${i + 1}@${name.toLowerCase().replace(/\s+/g, "").slice(0, 10)}.ng`,
    ownerPhone: `080${rnd(10000000, 99999999)}`,
    status,
    kycStatus,
    createdAt: past(rnd(10, 365)),
    approvedAt: kycStatus === "approved" ? past(rnd(1, 30)) : undefined,
    country: "NG",
    totalVolume: rnd(500_000, 50_000_000) * 100,
    totalTransactions: rnd(50, 5000),
    balance: rnd(10_000, 2_000_000) * 100,
    feeRate: [1.5, 1.5, 2.0, 2.0, 2.5][i % 5],
    settlementSchedule: ["T+1", "T+1", "T+2", "T+3", "weekly"][i % 5] as Merchant["settlementSchedule"],
    notes: i % 4 === 0 ? "Flagged for elevated chargeback rate. Monitor closely." : undefined,
    suspendedReason: status === "suspended" ? "Suspicious transaction pattern detected" : undefined,
    suspendedAt: status === "suspended" ? past(rnd(1, 14)) : undefined,
  };
});

export const MOCK_KYC_DOCS: KycDocument[] = MOCK_MERCHANTS.flatMap((m) =>
  (["cac", "tin", "id"] as KycDocument["type"][]).map((type, j) => ({
    id: `doc_${m.id}_${j}`,
    merchantId: m.id,
    type,
    status: m.kycStatus === "approved" ? "approved" : m.kycStatus === "in_review" ? (j === 0 ? "approved" : "in_review") : "pending",
    uploadedAt: past(rnd(2, 30)),
    reviewedAt: m.kycStatus === "approved" ? past(rnd(1, 10)) : undefined,
    reviewedBy: m.kycStatus === "approved" ? "Amaka Osei" : undefined,
    rejectionReason: m.kycStatus === "rejected" ? "Document expired or illegible" : undefined,
    fileUrl: `https://storage.icadpay.com/kyc/${m.id}/${type}.pdf`,
  }))
);

export function getMerchant(id: string) {
  return MOCK_MERCHANTS.find((m) => m.id === id);
}

export const BANKS_LIST = BANKS;
