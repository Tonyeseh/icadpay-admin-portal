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
  const res = await apiFetch(path, init);
  if (!res.ok) {
    const body = (await parseJsonSafe(res)) as AdminApiErrorBody;
    throw { status: res.status, body } satisfies AdminApiError;
  }
  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

// ─── Types (mirrors ApplicationCore.Features.Admin.Settlements.DTOs) ─

export type PayoutStatus = "Pending" | "Failed" | "Successful";

/** `AdminPayoutItemDto` */
export interface AdminPayoutListItem {
  id: string;
  merchantId: string;
  amountMinor: number;
  currency: string;
  status: string;
  reference: string | null;
  createdAtUtc: string;
}

/** UI page shape. The API returns `pageNumber` (`PaginationDTO`); `listAdminPayouts` maps it to `page`. */
export interface AdminPayoutListPage {
  items: AdminPayoutListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/** Wire shape of `PaginationDTO<AdminPayoutItemDto>`. */
interface AdminPayoutListResponse {
  items: AdminPayoutListItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export type ListAdminPayoutsParams = {
  page?: number;
  pageSize?: number;
  merchantId?: string;
  status?: PayoutStatus;
  fromUtc?: string;
  toUtc?: string;
};

export type LedgerEntryType = "PaymentCaptured" | "PayoutDebit" | "PayoutReversal" | "Refund";
export type LedgerBeneficiaryType = "Merchant" | "Subaccount";

/** `AdminLedgerEntryItemDto` */
export interface AdminLedgerEntryListItem {
  id: string;
  merchantId: string;
  beneficiaryType: string;
  beneficiaryId: string;
  entryType: string;
  amountMinor: number;
  currency: string;
  sourceType: string;
  sourceId: string;
  payoutId: string | null;
  createdAtUtc: string;
}

/** UI page shape. The API returns `pageNumber` (`PaginationDTO`); `listAdminLedgerEntries` maps it to `page`. */
export interface AdminLedgerEntryListPage {
  items: AdminLedgerEntryListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/** Wire shape of `PaginationDTO<AdminLedgerEntryItemDto>`. */
interface AdminLedgerEntryListResponse {
  items: AdminLedgerEntryListItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export type ListAdminLedgerEntriesParams = {
  page?: number;
  pageSize?: number;
  merchantId?: string;
  entryType?: LedgerEntryType;
  beneficiaryType?: LedgerBeneficiaryType;
  fromUtc?: string;
  toUtc?: string;
};

const PAYOUTS_BASE = "/api/v1/admin/payouts";
const LEDGER_ENTRIES_BASE = "/api/v1/admin/ledger-entries";

function buildPayoutsListQuery(params: ListAdminPayoutsParams): string {
  const q = new URLSearchParams();
  q.set("page", String(params.page ?? 1));
  q.set("page_size", String(params.pageSize ?? 20));
  if (params.merchantId?.trim()) q.set("merchant_id", params.merchantId.trim());
  if (params.status) q.set("status", params.status);
  if (params.fromUtc) q.set("from_utc", params.fromUtc);
  if (params.toUtc) q.set("to_utc", params.toUtc);
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

function buildLedgerEntriesListQuery(params: ListAdminLedgerEntriesParams): string {
  const q = new URLSearchParams();
  q.set("page", String(params.page ?? 1));
  q.set("page_size", String(params.pageSize ?? 20));
  if (params.merchantId?.trim()) q.set("merchant_id", params.merchantId.trim());
  if (params.entryType) q.set("entry_type", params.entryType);
  if (params.beneficiaryType) q.set("beneficiary_type", params.beneficiaryType);
  if (params.fromUtc) q.set("from_utc", params.fromUtc);
  if (params.toUtc) q.set("to_utc", params.toUtc);
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

export async function listAdminPayouts(params: ListAdminPayoutsParams = {}): Promise<AdminPayoutListPage> {
  const raw = await requestJson<AdminPayoutListResponse>(`${PAYOUTS_BASE}${buildPayoutsListQuery(params)}`);
  return {
    items: raw.items,
    totalCount: raw.totalCount,
    page: raw.pageNumber,
    pageSize: raw.pageSize,
  };
}

export async function listAdminLedgerEntries(
  params: ListAdminLedgerEntriesParams = {},
): Promise<AdminLedgerEntryListPage> {
  const raw = await requestJson<AdminLedgerEntryListResponse>(
    `${LEDGER_ENTRIES_BASE}${buildLedgerEntriesListQuery(params)}`,
  );
  return {
    items: raw.items,
    totalCount: raw.totalCount,
    page: raw.pageNumber,
    pageSize: raw.pageSize,
  };
}
