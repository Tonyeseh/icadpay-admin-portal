// ─── Core enums ───────────────────────────────────────────────────────────────

export type AdminRole =
  | "super_admin"
  | "ops_support"
  | "risk_compliance"
  | "finance_settlements"
  | "auditor";

export type TxStatus = "success" | "failed" | "pending" | "abandoned";
export type Channel = "card" | "transfer" | "ussd" | "qr" | "bank";
export type KycStatus = "pending" | "in_review" | "approved" | "rejected";
export type MerchantStatus = "active" | "suspended" | "pending_kyc";
export type DisputeStatus = "open" | "under_review" | "resolved" | "lost" | "won";
export type FraudAlertStatus = "open" | "investigating" | "resolved" | "false_positive";
export type RuleStatus = "active" | "inactive" | "draft";
export type PayoutStatus = "pending" | "approved" | "processing" | "paid" | "failed" | "on_hold";

// ─── Admin user ────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: AdminRole;
  status: "active" | "invited" | "suspended";
  lastLoginAt?: string;
  createdAt: string;
  avatarUrl?: string;
  twoFAEnabled: boolean;
}

// ─── Merchant ──────────────────────────────────────────────────────────────────

export interface Merchant {
  id: string;
  businessName: string;
  businessType: "starter" | "registered" | "enterprise";
  rcNumber?: string;
  industry: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  status: MerchantStatus;
  kycStatus: KycStatus;
  createdAt: string;
  approvedAt?: string;
  country: "NG";
  totalVolume: number; // kobo
  totalTransactions: number;
  balance: number; // kobo
  feeRate: number; // percent e.g. 1.5
  settlementSchedule: "T+1" | "T+2" | "T+3" | "weekly";
  assignedOpsAgent?: string;
  notes?: string;
  suspendedReason?: string;
  suspendedAt?: string;
}

export interface KycDocument {
  id: string;
  merchantId: string;
  type: "cac" | "tin" | "id" | "address_proof" | "bank_statement";
  status: KycStatus;
  uploadedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  fileUrl: string;
}

// ─── Transaction ───────────────────────────────────────────────────────────────

export interface AdminTransaction {
  id: string;
  reference: string;
  merchantId: string;
  merchantName: string;
  amount: number; // kobo
  fee: number; // kobo
  currency: "NGN";
  status: TxStatus;
  channel: Channel;
  customerEmail: string;
  customerName: string;
  createdAt: string;
  paidAt?: string;
  description?: string;
  cardLast4?: string;
  cardBrand?: "visa" | "mastercard" | "verve";
  bankName?: string;
  ipAddress?: string;
  deviceFingerprint?: string;
  riskScore?: number; // 0–100
  overrideBy?: string;
  overrideReason?: string;
}

// ─── Dispute ───────────────────────────────────────────────────────────────────

export interface Dispute {
  id: string;
  transactionId: string;
  transactionReference: string;
  merchantId: string;
  merchantName: string;
  amount: number;
  status: DisputeStatus;
  reason: string;
  raisedBy: "customer" | "merchant" | "bank";
  createdAt: string;
  dueDate: string;
  resolvedAt?: string;
  assignedTo?: string;
  notes?: string;
  network: "mastercard" | "visa" | "verve" | "nibss";
}

// ─── Fraud & risk ──────────────────────────────────────────────────────────────

export interface FraudAlert {
  id: string;
  transactionId: string;
  merchantId: string;
  merchantName: string;
  amount: number;
  riskScore: number;
  triggeredRules: string[];
  status: FraudAlertStatus;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

export interface FraudRule {
  id: string;
  name: string;
  description: string;
  category: "velocity" | "amount" | "geo" | "device" | "card" | "behaviour";
  condition: string;
  action: "flag" | "block" | "review";
  status: RuleStatus;
  triggeredCount: number;
  falsePositiveRate: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AmlEntry {
  id: string;
  merchantId: string;
  merchantName: string;
  flag: "structuring" | "high_risk_country" | "pep" | "sanctions" | "unusual_pattern";
  description: string;
  amount: number;
  status: "pending" | "reviewed" | "escalated" | "cleared";
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

// ─── Financial operations ──────────────────────────────────────────────────────

export interface LedgerEntry {
  id: string;
  type: "settlement" | "fee" | "refund" | "chargeback" | "payout" | "reversal";
  merchantId?: string;
  merchantName?: string;
  amount: number;
  balance: number; // running platform balance
  description: string;
  reference: string;
  createdAt: string;
}

export interface AdminPayout {
  id: string;
  merchantId: string;
  merchantName: string;
  amount: number;
  status: PayoutStatus;
  bankName: string;
  accountNumber: string;
  accountName: string;
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  settledAt?: string;
  holdReason?: string;
  reference: string;
}

export interface ReconciliationReport {
  id: string;
  period: string; // e.g. "2025-04"
  totalVolume: number;
  totalFees: number;
  totalPayouts: number;
  totalRefunds: number;
  totalChargebacks: number;
  netRevenue: number;
  status: "draft" | "finalised";
  generatedAt: string;
  generatedBy: string;
}

// ─── Platform config ───────────────────────────────────────────────────────────

export interface RoutingRule {
  id: string;
  name: string;
  description: string;
  channel: Channel | "all";
  processor: "paystack" | "flutterwave" | "squad" | "interswitch" | "nibss";
  priority: number;
  condition: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface FxRate {
  id: string;
  baseCurrency: "NGN";
  quoteCurrency: "USD" | "GBP" | "EUR" | "CAD" | "ZAR";
  rate: number;
  spread: number; // percent
  effectiveFrom: string;
  source: "manual" | "cbrate" | "market";
  updatedAt: string;
  updatedBy: string;
}

export interface PlatformWebhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  description: string;
  createdAt: string;
  lastTriggeredAt?: string;
  failureCount: number;
  signingSecret: string;
}

export interface ChangeLogEntry {
  id: string;
  entity: "routing_rule" | "fx_rate" | "webhook" | "fraud_rule" | "platform_config";
  entityId: string;
  entityName: string;
  action: "created" | "updated" | "deleted" | "enabled" | "disabled";
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

// ─── Compliance ────────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminName: string;
  adminRole: AdminRole;
  action: string;
  entity: string;
  entityId?: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  severity: "info" | "warning" | "critical";
}

// ─── Analytics ─────────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  gmv: number;
  gmvDelta: number;
  transactionCount: number;
  transactionCountDelta: number;
  approvalRate: number;
  approvalRateDelta: number;
  chargebackRate: number;
  chargebackRateDelta: number;
  feeRevenue: number;
  feeRevenueDelta: number;
  activeMerchants: number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
  value2?: number;
}
