import type { RoutingRule, FxRate, PlatformWebhook, ChangeLogEntry } from "@/types";

function past(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

export const MOCK_ROUTING_RULES: RoutingRule[] = [
  {
    id: "rr_001",
    name: "Card payments — primary",
    description: "Route all card transactions via Paystack for optimal approval rates",
    channel: "card",
    processor: "paystack",
    priority: 1,
    condition: "channel = 'card'",
    active: true,
    createdAt: past(180),
    updatedAt: past(14),
    updatedBy: "Kola Adeyemi",
  },
  {
    id: "rr_002",
    name: "Card payments — failover",
    description: "Failover to Flutterwave if Paystack declines or is unavailable",
    channel: "card",
    processor: "flutterwave",
    priority: 2,
    condition: "channel = 'card' AND processor.paystack.status = 'degraded'",
    active: true,
    createdAt: past(180),
    updatedAt: past(14),
    updatedBy: "Kola Adeyemi",
  },
  {
    id: "rr_003",
    name: "Bank transfers — NIBSS",
    description: "All bank transfers routed via NIBSS NIP gateway",
    channel: "transfer",
    processor: "nibss",
    priority: 1,
    condition: "channel = 'transfer'",
    active: true,
    createdAt: past(120),
    updatedAt: past(30),
    updatedBy: "Kola Adeyemi",
  },
  {
    id: "rr_004",
    name: "Enterprise merchants — dedicated",
    description: "Enterprise merchants routed to Interswitch for dedicated line",
    channel: "all",
    processor: "interswitch",
    priority: 1,
    condition: "merchant.type = 'enterprise'",
    active: true,
    createdAt: past(90),
    updatedAt: past(7),
    updatedBy: "Tunde Okonkwo",
  },
  {
    id: "rr_005",
    name: "USSD payments",
    description: "Route USSD via Squad (formerly Access Pay)",
    channel: "ussd",
    processor: "squad",
    priority: 1,
    condition: "channel = 'ussd'",
    active: false,
    createdAt: past(200),
    updatedAt: past(45),
    updatedBy: "Tunde Okonkwo",
  },
];

export const MOCK_FX_RATES: FxRate[] = [
  { id: "fx_001", baseCurrency: "NGN", quoteCurrency: "USD", rate: 1620.50, spread: 1.5, effectiveFrom: past(0), source: "market", updatedAt: past(0), updatedBy: "Ife Adebayo" },
  { id: "fx_002", baseCurrency: "NGN", quoteCurrency: "GBP", rate: 2050.25, spread: 2.0, effectiveFrom: past(0), source: "market", updatedAt: past(0), updatedBy: "Ife Adebayo" },
  { id: "fx_003", baseCurrency: "NGN", quoteCurrency: "EUR", rate: 1750.80, spread: 1.75, effectiveFrom: past(0), source: "cbrate", updatedAt: past(1), updatedBy: "Ife Adebayo" },
  { id: "fx_004", baseCurrency: "NGN", quoteCurrency: "CAD", rate: 1190.40, spread: 2.5, effectiveFrom: past(1), source: "manual", updatedAt: past(1), updatedBy: "Kola Adeyemi" },
  { id: "fx_005", baseCurrency: "NGN", quoteCurrency: "ZAR", rate: 88.20, spread: 3.0, effectiveFrom: past(2), source: "market", updatedAt: past(2), updatedBy: "Ife Adebayo" },
];

export const MOCK_PLATFORM_WEBHOOKS: PlatformWebhook[] = [
  {
    id: "pwh_001",
    url: "https://monitoring.icadpay-internal.com/webhooks/transactions",
    events: ["transaction.success", "transaction.failed", "transaction.abandoned"],
    active: true,
    description: "Internal monitoring — transaction events",
    createdAt: past(300),
    lastTriggeredAt: past(0),
    failureCount: 0,
    signingSecret: "whsec_mon_abc123xyz789",
  },
  {
    id: "pwh_002",
    url: "https://finance-ops.icadpay-internal.com/hooks/settlements",
    events: ["payout.paid", "payout.failed", "settlement.created"],
    active: true,
    description: "Finance ops — settlement and payout events",
    createdAt: past(200),
    lastTriggeredAt: past(1),
    failureCount: 2,
    signingSecret: "whsec_fin_def456uvw012",
  },
  {
    id: "pwh_003",
    url: "https://risk-engine.icadpay-internal.com/ingest",
    events: ["fraud.alert.created", "transaction.flagged"],
    active: true,
    description: "Risk engine — fraud alert ingestion",
    createdAt: past(150),
    lastTriggeredAt: past(0),
    failureCount: 0,
    signingSecret: "whsec_rsk_ghi789rst345",
  },
];

export const MOCK_CHANGE_LOG: ChangeLogEntry[] = [
  { id: "chg_001", entity: "routing_rule", entityId: "rr_001", entityName: "Card payments — primary", action: "updated", before: { processor: "flutterwave" }, after: { processor: "paystack" }, changedBy: "Kola Adeyemi", changedAt: past(14), reason: "Paystack showing better approval rates this quarter" },
  { id: "chg_002", entity: "fx_rate", entityId: "fx_001", entityName: "NGN/USD rate", action: "updated", before: { rate: 1580 }, after: { rate: 1620.5 }, changedBy: "Ife Adebayo", changedAt: past(1), reason: "Market adjustment" },
  { id: "chg_003", entity: "fraud_rule", entityId: "rule_005", entityName: "VPN / proxy detected", action: "disabled", changedBy: "Tunde Okonkwo", changedAt: past(30), reason: "Too many false positives from legitimate mobile users on VPNs" },
  { id: "chg_004", entity: "routing_rule", entityId: "rr_005", entityName: "USSD payments", action: "disabled", changedBy: "Tunde Okonkwo", changedAt: past(45), reason: "USSD volume too low to justify dedicated processor contract" },
  { id: "chg_005", entity: "webhook", entityId: "pwh_002", entityName: "Finance ops webhook", action: "updated", before: { url: "https://old.finance.icadpay.com/hooks" }, after: { url: "https://finance-ops.icadpay-internal.com/hooks/settlements" }, changedBy: "Ife Adebayo", changedAt: past(60), reason: "URL migration to internal domain" },
  { id: "chg_006", entity: "fraud_rule", entityId: "rule_004", entityName: "New device high value", action: "created", changedBy: "Tunde Okonkwo", changedAt: past(45), reason: "New rule to catch device fingerprint fraud" },
];
