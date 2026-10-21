import type { AdminUser, AuditLogEntry } from "@/types";

function past(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

export const MOCK_ADMIN_USERS: AdminUser[] = [
  {
    id: "adm_001",
    firstName: "Kola",
    lastName: "Adeyemi",
    email: "kola@icadpay.com",
    phone: "08012345678",
    role: "super_admin",
    status: "active",
    lastLoginAt: past(0),
    createdAt: past(365),
    twoFAEnabled: true,
  },
  {
    id: "adm_002",
    firstName: "Amaka",
    lastName: "Osei",
    email: "amaka@icadpay.com",
    phone: "08023456789",
    role: "ops_support",
    status: "active",
    lastLoginAt: past(0),
    createdAt: past(280),
    twoFAEnabled: true,
  },
  {
    id: "adm_003",
    firstName: "Dele",
    lastName: "Williams",
    email: "dele@icadpay.com",
    phone: "08034567890",
    role: "ops_support",
    status: "active",
    lastLoginAt: past(1),
    createdAt: past(200),
    twoFAEnabled: false,
  },
  {
    id: "adm_004",
    firstName: "Ngozi",
    lastName: "Eze",
    email: "ngozi@icadpay.com",
    phone: "08045678901",
    role: "risk_compliance",
    status: "active",
    lastLoginAt: past(0),
    createdAt: past(250),
    twoFAEnabled: true,
  },
  {
    id: "adm_005",
    firstName: "Tunde",
    lastName: "Okonkwo",
    email: "tunde@icadpay.com",
    phone: "08056789012",
    role: "risk_compliance",
    status: "active",
    lastLoginAt: past(2),
    createdAt: past(180),
    twoFAEnabled: true,
  },
  {
    id: "adm_006",
    firstName: "Ife",
    lastName: "Adebayo",
    email: "ife@icadpay.com",
    phone: "08067890123",
    role: "finance_settlements",
    status: "active",
    lastLoginAt: past(0),
    createdAt: past(300),
    twoFAEnabled: true,
  },
  {
    id: "adm_007",
    firstName: "Funke",
    lastName: "Adeyemi",
    email: "funke@icadpay.com",
    phone: "08078901234",
    role: "auditor",
    status: "active",
    lastLoginAt: past(7),
    createdAt: past(120),
    twoFAEnabled: false,
  },
  {
    id: "adm_008",
    firstName: "Chidi",
    lastName: "Nwosu",
    email: "chidi.auditor@bankpartner.ng",
    phone: "08089012345",
    role: "auditor",
    status: "invited",
    createdAt: past(3),
    twoFAEnabled: false,
  },
];

const AUDIT_ACTIONS = [
  { action: "merchant.approved", entity: "merchant", severity: "info" as const },
  { action: "merchant.suspended", entity: "merchant", severity: "critical" as const },
  { action: "transaction.override", entity: "transaction", severity: "warning" as const },
  { action: "fraud_rule.updated", entity: "fraud_rule", severity: "warning" as const },
  { action: "payout.approved", entity: "payout", severity: "info" as const },
  { action: "admin_user.created", entity: "admin_user", severity: "info" as const },
  { action: "routing_rule.updated", entity: "routing_rule", severity: "warning" as const },
  { action: "kyc.rejected", entity: "merchant", severity: "warning" as const },
  { action: "payout.held", entity: "payout", severity: "warning" as const },
  { action: "admin_user.role_changed", entity: "admin_user", severity: "critical" as const },
];

export const MOCK_AUDIT_LOG: AuditLogEntry[] = Array.from({ length: 40 }, (_, i) => {
  const adminUsers = MOCK_ADMIN_USERS.slice(0, 6);
  const admin = adminUsers[i % adminUsers.length];
  const act = AUDIT_ACTIONS[i % AUDIT_ACTIONS.length];

  return {
    id: `aud_${String(i + 1).padStart(4, "0")}`,
    adminId: admin.id,
    adminName: `${admin.firstName} ${admin.lastName}`,
    adminRole: admin.role as AuditLogEntry["adminRole"],
    action: act.action,
    entity: act.entity,
    entityId: `${act.entity.replace("_", "")}_${String(i + 1).padStart(4, "0")}`,
    details: `${act.action.replace(/\./g, " ").replace(/_/g, " ")} performed via admin portal`,
    ipAddress: `196.${Math.floor(i * 3) % 254}.${(i * 7) % 254}.${(i * 13) % 254}`,
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120",
    createdAt: past(Math.floor(i / 5)),
    severity: act.severity,
  };
});
