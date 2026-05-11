import type { AdminTransaction } from "@/types";
import { MOCK_MERCHANTS } from "./merchants";

const CUSTOMER_NAMES = [
  "Chidi Okafor", "Funke Adeyemi", "Emeka Nwachukwu", "Bola Adekunle", "Ngozi Eze",
  "Tunde Okonkwo", "Amara Obi", "Segun Alabi", "Yetunde Bello", "Damilola Adewale",
  "Ikenna Nnaji", "Kemi Afolabi", "Tobi Akinyele", "Chisom Onuoha", "Remi Taiwo",
];

const BANKS = ["GTBank", "Access Bank", "Zenith Bank", "UBA", "First Bank", "Kuda Bank", "OPay", "Polaris Bank"];

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function past(daysAgo: number, hoursAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo);
  return d.toISOString();
}

const channels: AdminTransaction["channel"][] = ["card", "card", "card", "transfer", "transfer", "ussd", "qr"];
const statuses: AdminTransaction["status"][] = ["success", "success", "success", "success", "failed", "pending", "abandoned"];

export const MOCK_TRANSACTIONS: AdminTransaction[] = Array.from({ length: 80 }, (_, i) => {
  const merchant = MOCK_MERCHANTS[i % MOCK_MERCHANTS.length];
  const customer = CUSTOMER_NAMES[i % CUSTOMER_NAMES.length];
  const channel = channels[i % channels.length];
  const status = statuses[i % statuses.length];
  const amount = rnd(5_000, 500_000) * 100;
  const fee = Math.round(amount * 0.015);
  const riskScore = status === "failed" ? rnd(60, 95) : rnd(5, 40);

  return {
    id: `txn_${String(i + 1).padStart(6, "0")}`,
    reference: `ICAD-${Date.now() - i * 100000}-${String(i).padStart(4, "0")}`,
    merchantId: merchant.id,
    merchantName: merchant.businessName,
    amount,
    fee,
    currency: "NGN",
    status,
    channel,
    customerEmail: `${customer.split(" ")[0].toLowerCase()}@gmail.com`,
    customerName: customer,
    createdAt: past(Math.floor(i / 4), rnd(0, 23)),
    paidAt: status === "success" ? past(Math.floor(i / 4), rnd(0, 23)) : undefined,
    description: channel === "card" ? "Card payment" : channel === "transfer" ? "Bank transfer" : "USSD payment",
    cardLast4: channel === "card" ? String(rnd(1000, 9999)) : undefined,
    cardBrand: channel === "card" ? (["visa", "mastercard", "verve"] as const)[i % 3] : undefined,
    bankName: channel === "transfer" ? BANKS[i % BANKS.length] : undefined,
    ipAddress: `102.${rnd(1, 254)}.${rnd(1, 254)}.${rnd(1, 254)}`,
    riskScore,
    overrideBy: i % 20 === 0 ? "Amaka Osei" : undefined,
    overrideReason: i % 20 === 0 ? "Confirmed legitimate transaction, manual approval" : undefined,
  };
});
