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

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: [
    "merchants:write",
    "merchants:suspend",
    "merchants:kyc_review",
    "transactions:override",
    "transactions:refund",
    "disputes:write",
    "fraud:write",
    "fraud:rules",
    "aml:write",
    "financial:write",
    "financial:payouts",
    "platform:write",
    "compliance:users",
    "audit:write",
  ],
  ops_support: [
    "merchants:kyc_review",
    "transactions:refund",
    "disputes:write",
  ],
  risk_compliance: [
    "merchants:kyc_review",
    "fraud:write",
    "fraud:rules",
    "aml:write",
  ],
  finance_settlements: [
    "financial:write",
    "financial:payouts",
  ],
  auditor: [],
};

const ROLE_NAV: Record<AdminRole, string[]> = {
  super_admin: [
    "/dashboard",
    "/merchants",
    "/transactions",
    "/fraud",
    "/financial",
    "/platform",
    "/compliance",
    "/analytics",
  ],
  ops_support: [
    "/dashboard",
    "/merchants",
    "/transactions",
    "/analytics",
  ],
  risk_compliance: [
    "/dashboard",
    "/merchants",
    "/transactions",
    "/fraud",
    "/compliance/audit-log",
    "/analytics",
  ],
  finance_settlements: [
    "/dashboard",
    "/merchants",
    "/financial",
    "/analytics",
  ],
  auditor: [
    "/dashboard",
    "/merchants",
    "/transactions",
    "/fraud",
    "/financial",
    "/platform",
    "/compliance/audit-log",
    "/analytics",
  ],
};

export function canDo(role: AdminRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canVisit(role: AdminRole, pathname: string): boolean {
  return ROLE_NAV[role]?.some((p) => pathname === p || pathname.startsWith(p + "/")) ?? false;
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
