import type { AdminRole } from "@/types";

type Permission =
  | "merchants:write"
  | "merchants:suspend"
  | "merchants:kyc_review"
  | "transactions:override"
  | "transactions:refund"
  | "disputes:write"
  | "fraud:write"
  | "fraud:rules"
  | "aml:write"
  | "financial:write"
  | "financial:payouts"
  | "platform:write"
  | "compliance:users"
  | "audit:write";

/** Mock pages still call `canDo` with these keys. Only keys with real API codes are enforced. */
const MAPPED_PERMISSIONS: Partial<Record<Permission, readonly string[]>> = {
  "merchants:suspend": ["merchants.suspend", "merchants.activate", "merchants.deactivate"],
  "merchants:kyc_review": ["onboarding.approve", "onboarding.reject", "onboarding.request_changes"],
  "financial:payouts": ["merchants.view_payouts"],
  "compliance:users": ["admin_users.create", "admin_users.update", "admin_users.suspend"],
};

const PATH_PERMISSIONS: { prefix: string; code: string }[] = [
  { prefix: "/platform/company-types", code: "company_types.view" },
  { prefix: "/platform/industry-types", code: "industry_types.view" },
  { prefix: "/platform/document-types", code: "document_types.view" },
  { prefix: "/platform/merchant-roles", code: "merchant_roles.view" },
  { prefix: "/compliance/users", code: "admin_users.view" },
  { prefix: "/compliance/admin-roles", code: "admin_roles.view" },
  { prefix: "/financial/payouts", code: "merchants.view_payouts" },
  { prefix: "/merchants/settlement-accounts", code: "settlement_bank_account.approve" },
  { prefix: "/merchants", code: "merchants.view" },
];

export function hasPermission(permissions: readonly string[], code: string): boolean {
  return permissions.includes(code);
}

export function hasAnyPermission(permissions: readonly string[], codes: readonly string[]): boolean {
  return codes.some((code) => permissions.includes(code));
}

export function canDo(permissions: readonly string[], permission: Permission): boolean {
  const codes = MAPPED_PERMISSIONS[permission];
  if (!codes) return true;
  return hasAnyPermission(permissions, codes);
}

export function canVisit(permissions: readonly string[], pathname: string): boolean {
  const match = PATH_PERMISSIONS.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!match) return true;
  return hasPermission(permissions, match.code);
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  ops_support: "Ops & Support",
  risk_compliance: "Risk & Compliance",
  finance_settlements: "Finance & Settlements",
  auditor: "Auditor",
};

export const ALL_ROLES: AdminRole[] = [
  "super_admin",
  "ops_support",
  "risk_compliance",
  "finance_settlements",
  "auditor",
];

export function roleLabel(role: string): string {
  if ((ALL_ROLES as readonly string[]).includes(role)) {
    return ROLE_LABELS[role as AdminRole];
  }
  return role;
}
