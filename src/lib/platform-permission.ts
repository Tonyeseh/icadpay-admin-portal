import { hasPermission } from "@/lib/rbac";

export function canApproveMerchantOnboarding(permissions: readonly string[]): boolean {
  return hasPermission(permissions, "onboarding.approve");
}

export function canRejectMerchantOnboarding(permissions: readonly string[]): boolean {
  return hasPermission(permissions, "onboarding.reject");
}

export function canRequestMerchantOnboardingChanges(permissions: readonly string[]): boolean {
  return hasPermission(permissions, "onboarding.request_changes");
}

export function canApproveSettlementBankAccount(permissions: readonly string[]): boolean {
  return hasPermission(permissions, "settlement_bank_account.approve");
}

export function canRejectSettlementBankAccount(permissions: readonly string[]): boolean {
  return hasPermission(permissions, "settlement_bank_account.reject");
}
