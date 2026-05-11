import type { Dispute } from "@/types";
import { MOCK_TRANSACTIONS } from "./transactions";

function past(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function future(daysAhead: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
}

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const REASONS = [
  "Unauthorised transaction",
  "Item not received",
  "Item not as described",
  "Credit not processed",
  "Duplicate transaction",
  "Fraudulent transaction",
  "Processing error",
];

const STATUSES: Dispute["status"][] = ["open", "open", "under_review", "under_review", "resolved", "won", "lost"];
const NETWORKS: Dispute["network"][] = ["mastercard", "visa", "verve", "nibss"];

export const MOCK_DISPUTES: Dispute[] = MOCK_TRANSACTIONS.slice(0, 25).map((tx, i) => ({
  id: `dsp_${String(i + 1).padStart(4, "0")}`,
  transactionId: tx.id,
  transactionReference: tx.reference,
  merchantId: tx.merchantId,
  merchantName: tx.merchantName,
  amount: tx.amount,
  status: STATUSES[i % STATUSES.length],
  reason: REASONS[i % REASONS.length],
  raisedBy: (["customer", "merchant", "bank"] as const)[i % 3],
  createdAt: past(rnd(1, 30)),
  dueDate: future(rnd(1, 14)),
  resolvedAt: STATUSES[i % STATUSES.length] === "resolved" || STATUSES[i % STATUSES.length] === "won" || STATUSES[i % STATUSES.length] === "lost" ? past(rnd(0, 5)) : undefined,
  assignedTo: ["Amaka Osei", "Dele Williams", "Funke Adeyemi"][i % 3],
  network: NETWORKS[i % NETWORKS.length],
  notes: i % 3 === 0 ? "Awaiting bank response. Deadline in 5 days." : undefined,
}));
