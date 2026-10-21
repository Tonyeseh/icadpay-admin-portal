import { apiFetch } from "@/lib/api-fetch";
import type { AdminApiError, AdminApiErrorBody } from "@/lib/admin-catalog-api";

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await apiFetch(path, { ...init, headers });
  if (!res.ok) {
    const body = (await parseJsonSafe(res)) as AdminApiErrorBody;
    throw { status: res.status, body } satisfies AdminApiError;
  }
  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

/** PATCH with JSON body; success may be empty body or JSON (see docs/ADMIN_MERCHANT_LIFECYCLE_FRONTEND.md). */
async function requestPatchMerchantLifecycle(path: string, jsonBody: unknown): Promise<void> {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  const res = await apiFetch(path, {
    method: "PATCH",
    headers,
    body: JSON.stringify(jsonBody),
  });
  if (!res.ok) {
    const body = (await parseJsonSafe(res)) as AdminApiErrorBody;
    throw { status: res.status, body } satisfies AdminApiError;
  }
}

// ─── Types (mirrors ApplicationCore.Features.Admin.Merchants.DTOs.AdminMerchantDtos) ─

/** `AdminMerchantListItemDto` — note: no kycStatus or volume fields on the backend DTO. */
export interface AdminMerchantListItem {
  id: string;
  displayName: string;
  status: string;
  onboardingStatus: string;
  businessType: string;
  companyType: string | null;
  emailAddress: string | null;
  /** `Test` or `Live` (`MerchantCredentialModes`). */
  accountMode: string;
  createdAt: string;
}

/** UI page shape. The API returns `pageNumber` (`PaginationDTO`); `listAdminMerchants` maps it to `page`. */
export interface AdminMerchantListPage {
  items: AdminMerchantListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/** Wire shape of `PaginationDTO<AdminMerchantListItemDto>`. */
interface AdminMerchantListResponse {
  items: AdminMerchantListItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

/** `OwnerInformationDTO` */
export interface AdminMerchantOwner {
  id: string;
  merchantId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  idType: string;
  idNumber: string;
  address: string;
  bvn: string;
  /** `DocumentInstances.Id`, or `""` when the owner has no ID file. */
  identificationDocumentId: string;
  createdAt: string;
}

/** `SettlementBankDTO` */
export interface AdminMerchantSettlementBank {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
  merchantId: string;
  isPrimary: boolean;
  verificationStatus: string;
  createdAt: string;
}

/** `BusinessDocumentDTO` (`origingalFileName` spelling matches the backend DTO). */
export interface AdminMerchantBusinessDocument {
  id: string;
  documentTypeId: string;
  documentTypeName: string;
  origingalFileName: string;
  uploadedAt: string;
}

/** `AdminMerchantDetailDto` */
export interface AdminMerchantDetail {
  id: string;
  displayName: string;
  /** Storage key used as a presence flag. Blank or whitespace means there is no logo. Not an image address. */
  logoUrl: string | null;
  status: string;
  businessType: string;
  onboardingStatus: string;
  industryTypeId: string | null;
  industryType: string | null;
  companyTypeId: string | null;
  companyType: string | null;
  /** `Test` or `Live` (`MerchantCredentialModes`). */
  accountMode: string;
  createdAt: string;
  updatedAt: string | null;
  phoneNumber: string | null;
  address: string | null;
  emailAddress: string | null;
  tradingName: string;
  staffSize: string;
  registeredAddress: string;
  supportEmailAddress: string;
  website: string;
  owners: AdminMerchantOwner[];
  businessDocuments: AdminMerchantBusinessDocument[];
  settlementBank: AdminMerchantSettlementBank | null;
  recentTransactionsCount: number;
}

/** `AdminMerchantHistoryItemDto`. The history endpoint returns this array, newest first. */
export interface AdminMerchantHistoryItem {
  id: string;
  merchantId: string;
  eventType: string;
  field: string | null;
  previousValue: string | null;
  newValue: string | null;
  message: string | null;
  actorUserId: string | null;
  actorName: string | null;
  /** `"Admin"`, `"Merchant"`, `"System"`, or null. A null `actorUserId` is returned as `System`. */
  actorType: string | null;
  createdAtUtc: string;
}

export type ListAdminMerchantsParams = {
  page?: number;
  pageSize?: number;
  status?: string;
  onboardingStatus?: string;
  businessType?: string;
  search?: string;
  sort?: "created_at" | "total_volume";
  sortDesc?: boolean;
};

const MERCHANTS_BASE = "/api/v1/admin/merchants";
const SETTLEMENT_BANK_ACCOUNTS_BASE = "/api/v1/admin/settlement-bank-accounts";

function buildListQuery(params: ListAdminMerchantsParams): string {
  const q = new URLSearchParams();
  q.set("page", String(params.page ?? 1));
  q.set("page_size", String(params.pageSize ?? 20));
  if (params.status?.trim()) q.set("status", params.status.trim());
  if (params.onboardingStatus?.trim()) q.set("onboarding_status", params.onboardingStatus.trim());
  if (params.businessType?.trim()) q.set("business_type", params.businessType.trim());
  if (params.search?.trim()) q.set("search", params.search.trim());
  q.set("sort", params.sort === "total_volume" ? "total_volume" : "created_at");
  q.set("sort_desc", String(params.sortDesc ?? true));
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

export async function listAdminMerchants(params: ListAdminMerchantsParams = {}): Promise<AdminMerchantListPage> {
  const raw = await requestJson<AdminMerchantListResponse>(`${MERCHANTS_BASE}${buildListQuery(params)}`);
  return {
    items: raw.items,
    totalCount: raw.totalCount,
    page: raw.pageNumber,
    pageSize: raw.pageSize,
  };
}

/** Returns `null` when the merchant does not exist (`admin_merchants.not_found`). */
export async function getAdminMerchantDetail(id: string): Promise<AdminMerchantDetail | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;

  const res = await apiFetch(`${MERCHANTS_BASE}/${encodeURIComponent(trimmed)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = (await parseJsonSafe(res)) as AdminApiErrorBody;
    throw { status: res.status, body } satisfies AdminApiError;
  }
  return res.json() as Promise<AdminMerchantDetail>;
}

/** Soft-delete lifecycle: sets status to `deactivated`. Idempotent (200 if already deactivated). */
export async function patchAdminMerchantDeactivate(merchantId: string): Promise<void> {
  const trimmed = merchantId.trim();
  if (!trimmed) throw { status: 400, body: { description: "Merchant id is required." } } satisfies AdminApiError;
  await requestPatchMerchantLifecycle(`${MERCHANTS_BASE}/${encodeURIComponent(trimmed)}/deactivate`, {});
}

/** Requires non-empty `suspendedReason` (max 500 chars server-side). */
export async function patchAdminMerchantSuspend(merchantId: string, suspendedReason: string): Promise<void> {
  const trimmed = merchantId.trim();
  if (!trimmed) throw { status: 400, body: { description: "Merchant id is required." } } satisfies AdminApiError;
  const reason = suspendedReason.trim();
  if (!reason) throw { status: 400, body: { description: "Suspension reason is required." } } satisfies AdminApiError;
  await requestPatchMerchantLifecycle(`${MERCHANTS_BASE}/${encodeURIComponent(trimmed)}/suspend`, {
    suspendedReason: reason,
  });
}

/** Moves merchant to `active`; not valid for `deactivated` (409 `admin_merchants.cannot_activate_deactivated`). */
export async function patchAdminMerchantActivate(merchantId: string): Promise<void> {
  const trimmed = merchantId.trim();
  if (!trimmed) throw { status: 400, body: { description: "Merchant id is required." } } satisfies AdminApiError;
  await requestPatchMerchantLifecycle(`${MERCHANTS_BASE}/${encodeURIComponent(trimmed)}/activate`, {});
}

const REJECTION_REASON_MAX = 500;

function requireMerchantAndAccountIds(merchantId: string, accountId: string): { merchantId: string; accountId: string } {
  const merchant = merchantId.trim();
  if (!merchant) throw { status: 400, body: { description: "Merchant id is required." } } satisfies AdminApiError;
  const account = accountId.trim();
  if (!account) throw { status: 400, body: { description: "Settlement account id is required." } } satisfies AdminApiError;
  return { merchantId: merchant, accountId: account };
}

/** Marks the settlement account verified and primary. Success is HTTP 200 with a JSON body. */
export async function patchApproveSettlementBankAccount(merchantId: string, accountId: string): Promise<void> {
  const ids = requireMerchantAndAccountIds(merchantId, accountId);
  await requestJson<unknown>(
    `${SETTLEMENT_BANK_ACCOUNTS_BASE}/${encodeURIComponent(ids.merchantId)}/${encodeURIComponent(ids.accountId)}/approve`,
    { method: "PATCH" },
  );
}

/** Rejects a pending settlement account. `reason` is trimmed and capped at 500 characters. */
export async function patchRejectSettlementBankAccount(
  merchantId: string,
  accountId: string,
  reason: string,
): Promise<void> {
  const ids = requireMerchantAndAccountIds(merchantId, accountId);
  const trimmedReason = reason.trim().slice(0, REJECTION_REASON_MAX);
  if (!trimmedReason) {
    throw { status: 400, body: { description: "A reason for rejecting the bank account is required." } } satisfies AdminApiError;
  }
  await requestJson<unknown>(
    `${SETTLEMENT_BANK_ACCOUNTS_BASE}/${encodeURIComponent(ids.merchantId)}/${encodeURIComponent(ids.accountId)}/reject`,
    {
      method: "PATCH",
      body: JSON.stringify({ reason: trimmedReason }),
    },
  );
}

export type SettlementAccountVerificationStatus = "Pending" | "Verified" | "Failed";

export type ListAdminSettlementBankAccountsParams = {
  page?: number;
  pageSize?: number;
  /** `undefined` omits `status` (server default Pending). `""` sends `status=` (every status). Otherwise the exact PascalCase value. */
  status?: "" | SettlementAccountVerificationStatus;
};

export interface AdminSettlementBankAccountListItem {
  id: string;
  merchantId: string;
  merchantDisplayName: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  verificationStatus: string;
  isPrimary: boolean;
  createdAtUtc: string;
}

export interface AdminSettlementBankAccountListPage {
  items: AdminSettlementBankAccountListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/** Wire shape of `PaginationDTO<AdminSettlementBankAccountListItemDto>`. */
interface AdminSettlementBankAccountListResponse {
  items?: AdminSettlementBankAccountListItem[] | null;
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

function buildSettlementBankAccountListQuery(params: ListAdminSettlementBankAccountsParams): string {
  const q = new URLSearchParams();
  q.set("page", String(params.page ?? 1));
  q.set("page_size", String(params.pageSize ?? 20));
  if (params.status !== undefined) q.set("status", params.status);
  return `?${q.toString()}`;
}

export async function listAdminSettlementBankAccounts(
  params: ListAdminSettlementBankAccountsParams = {},
): Promise<AdminSettlementBankAccountListPage> {
  const raw = await requestJson<AdminSettlementBankAccountListResponse>(
    `${SETTLEMENT_BANK_ACCOUNTS_BASE}${buildSettlementBankAccountListQuery(params)}`,
  );
  return {
    items: raw.items ?? [],
    totalCount: raw.totalCount,
    page: raw.pageNumber,
    pageSize: raw.pageSize,
  };
}

/** GET history as a bare JSON array, already ordered by `createdAtUtc` descending. */
export async function getAdminMerchantHistory(merchantId: string): Promise<AdminMerchantHistoryItem[]> {
  const trimmed = merchantId.trim();
  if (!trimmed) throw { status: 400, body: { description: "Merchant id is required." } } satisfies AdminApiError;

  const raw = await requestJson<unknown>(`${MERCHANTS_BASE}/${encodeURIComponent(trimmed)}/history`);
  if (!Array.isArray(raw)) {
    throw { status: 400, body: { description: "Activity could not be loaded." } } satisfies AdminApiError;
  }
  return raw as AdminMerchantHistoryItem[];
}

function logoContentType(header: string | null, blobType: string): string {
  const headerType = header?.split(";")[0]?.trim() ?? "";
  return headerType || blobType || "";
}

/**
 * Downloads the merchant logo file. `404` (missing logo or merchant) returns `null`.
 * `logoUrl` on the detail payload is only a storage key, not this response.
 */
export async function loadAdminMerchantLogo(
  merchantId: string,
): Promise<{ blob: Blob; contentType: string } | null> {
  const trimmed = merchantId.trim();
  if (!trimmed) return null;

  const res = await apiFetch(`${MERCHANTS_BASE}/${encodeURIComponent(trimmed)}/logo`);
  if (res.status === 404) {
    await parseJsonSafe(res);
    return null;
  }
  if (!res.ok) {
    const body = (await parseJsonSafe(res)) as AdminApiErrorBody;
    throw { status: res.status, body } satisfies AdminApiError;
  }

  const raw = await res.blob();
  const contentType = logoContentType(res.headers.get("Content-Type"), raw.type);
  const blob = contentType && raw.type !== contentType ? new Blob([raw], { type: contentType }) : raw;
  return { blob, contentType };
}
