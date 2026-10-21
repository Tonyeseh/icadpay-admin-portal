import { apiFetch } from "@/lib/api-fetch";

export type AdminApiErrorBody =
  | { code?: string; description?: string }
  | { title?: string; detail?: string }
  | { errors?: Record<string, string[] | undefined> }
  | null;

export type AdminApiError = {
  status: number;
  body: AdminApiErrorBody;
};

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

function firstValidationMessage(errors: unknown): string | null {
  if (!errors || typeof errors !== "object") return null;
  for (const value of Object.values(errors as Record<string, unknown>)) {
    if (typeof value === "string" && value.length > 0) return value;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.length > 0) return item;
      }
    }
  }
  return null;
}

export function formatAdminApiError(body: unknown): string {
  if (body && typeof body === "object") {
    const maybe = body as Record<string, unknown>;
    const desc = maybe.description;
    if (typeof desc === "string" && desc.length > 0) return desc;

    if (maybe.errors && typeof maybe.errors === "object") {
      return firstValidationMessage(maybe.errors) ?? "Validation failed";
    }

    const detail = maybe.detail;
    if (typeof detail === "string" && detail.length > 0) return detail;
    const title = maybe.title;
    if (typeof title === "string" && title.length > 0) return title;
    const code = maybe.code;
    if (typeof code === "string" && code.length > 0) return code;
  }
  return "Request failed";
}

/** Human-readable copy for known admin merchant and document error codes. */
const ADMIN_ONBOARDING_ERROR_MESSAGES: Record<string, string> = {
  "admin_merchants.invalid_onboarding_transition":
    "This action is not allowed for the merchant's current onboarding status.",
  "admin_merchants.rejection_reason_required": "A reason for rejecting onboarding is required.",
  "admin_merchants.change_request_message_required": "A message explaining the requested changes is required.",
  "admin_merchants.not_found": "Merchant was not found.",
  "document.file_not_found": "The document file was not found.",
};

/** Prefer friendly onboarding messages when `body.code` matches; otherwise delegates to {@link formatAdminApiError}. */
export function formatAdminOnboardingError(body: unknown): string {
  if (body && typeof body === "object") {
    const code = (body as Record<string, unknown>).code;
    if (typeof code === "string") {
      const mapped = ADMIN_ONBOARDING_ERROR_MESSAGES[code];
      if (mapped) return mapped;
    }
  }
  return formatAdminApiError(body);
}

const ADMIN_SETTLEMENT_BANK_ERROR_MESSAGES: Record<string, string> = {
  "merchant_bank_accounts.not_found": "Bank account not found.",
  "merchant_bank_accounts.invalid_verification_transition":
    "This action is only allowed while the bank account is pending verification.",
  "admin_merchants.not_found": "Merchant was not found.",
};

/** Settlement approve/reject copy. `403` has no `code`, so the status check runs first. */
export function formatAdminSettlementBankError(status: number, body: unknown): string {
  if (status === 403) return "You do not have permission to perform this action.";
  if (body && typeof body === "object") {
    const code = (body as Record<string, unknown>).code;
    if (typeof code === "string") {
      const mapped = ADMIN_SETTLEMENT_BANK_ERROR_MESSAGES[code];
      if (mapped) return mapped;
    }
  }
  return formatAdminApiError(body);
}

// ─── Company types ────────────────────────────────────────────────────────────

export type BusinessType =
  | "Non-Registered Business"
  | "Registered Business"
  | "Government Agency";

export interface CompanyTypeDto {
  id: string;
  code: string;
  name: string;
  businessType: BusinessType;
  isActive: boolean;
}

export interface CreateCompanyTypeBody {
  id: string;
  code: string;
  name: string;
  businessType: BusinessType;
}

export type PatchCompanyTypeBody = Partial<Pick<CompanyTypeDto, "code" | "name" | "businessType" | "isActive">>;

export async function listCompanyTypes(params?: { includeInactive?: boolean }): Promise<CompanyTypeDto[]> {
  const q = params?.includeInactive === undefined ? "" : `?includeInactive=${String(params.includeInactive)}`;
  return requestJson(`/api/admin/company-types${q}`);
}

export async function getCompanyType(id: string): Promise<CompanyTypeDto> {
  return requestJson(`/api/admin/company-types/${encodeURIComponent(id)}`);
}

export async function createCompanyType(body: CreateCompanyTypeBody): Promise<CompanyTypeDto> {
  return requestJson(`/api/admin/company-types`, { method: "POST", body: JSON.stringify(body) });
}

export async function patchCompanyType(id: string, body: PatchCompanyTypeBody): Promise<CompanyTypeDto> {
  return requestJson(`/api/admin/company-types/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deleteCompanyType(id: string): Promise<CompanyTypeDto> {
  return requestJson(`/api/admin/company-types/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ─── Industry types ───────────────────────────────────────────────────────────

export interface IndustryTypeDto {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface CreateIndustryTypeBody {
  id: string;
  code: string;
  name: string;
}

export type PatchIndustryTypeBody = Partial<Pick<IndustryTypeDto, "code" | "name" | "isActive">>;

export async function listIndustryTypes(params?: { includeInactive?: boolean }): Promise<IndustryTypeDto[]> {
  const q = params?.includeInactive === undefined ? "" : `?includeInactive=${String(params.includeInactive)}`;
  return requestJson(`/api/admin/industry-types${q}`);
}

export async function getIndustryType(id: string): Promise<IndustryTypeDto> {
  return requestJson(`/api/admin/industry-types/${encodeURIComponent(id)}`);
}

export async function createIndustryType(body: CreateIndustryTypeBody): Promise<IndustryTypeDto> {
  return requestJson(`/api/admin/industry-types`, { method: "POST", body: JSON.stringify(body) });
}

export async function patchIndustryType(id: string, body: PatchIndustryTypeBody): Promise<IndustryTypeDto> {
  return requestJson(`/api/admin/industry-types/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deleteIndustryType(id: string): Promise<IndustryTypeDto> {
  return requestJson(`/api/admin/industry-types/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ─── Document types ───────────────────────────────────────────────────────────

export interface DocumentTypeDto {
  id: string;
  code: string;
  name: string;
  category: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentTypeBody {
  code: string;
  name: string;
  category?: string | null;
}

export type PatchDocumentTypeBody = Partial<Pick<DocumentTypeDto, "code" | "name" | "category" | "isActive">>;

export async function listDocumentTypes(params?: { includeInactive?: boolean }): Promise<DocumentTypeDto[]> {
  const q = params?.includeInactive === undefined ? "" : `?includeInactive=${String(params.includeInactive)}`;
  return requestJson(`/api/admin/document-types${q}`);
}

export async function getDocumentType(id: string): Promise<DocumentTypeDto> {
  return requestJson(`/api/admin/document-types/${encodeURIComponent(id)}`);
}

export async function createDocumentType(body: CreateDocumentTypeBody): Promise<DocumentTypeDto> {
  return requestJson(`/api/admin/document-types`, { method: "POST", body: JSON.stringify(body) });
}

export async function patchDocumentType(id: string, body: PatchDocumentTypeBody): Promise<DocumentTypeDto> {
  return requestJson(`/api/admin/document-types/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deleteDocumentType(id: string): Promise<DocumentTypeDto> {
  return requestJson(`/api/admin/document-types/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ─── Roles (merchant + admin) ─────────────────────────────────────────────────

/** Built-in merchant owner role. Delete is rejected by the API. */
export const MERCHANT_ROLE_OWNER_ID = "merchant_role_owner";

/** Built-in platform admin role. Delete is rejected by the API. */
export const ADMIN_ROLE_PLATFORM_ID = "admin_role_platform";

export interface PermissionCatalogItem {
  id: string;
  code: string;
  description: string;
}

export interface RoleListPage<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface MerchantRoleListItem {
  id: string;
  name: string;
  createdBy: string;
  createdByMerchant: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MerchantRoleDetail extends MerchantRoleListItem {
  permissions: PermissionCatalogItem[];
}

/** `permission` is the JSON property on `CreateMerchantRoleRequest` and holds permission ids. */
export interface CreateMerchantRoleBody {
  name: string;
  permission: string[];
}

export interface AdminRoleListItem {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRoleDetail extends AdminRoleListItem {
  permissions: PermissionCatalogItem[];
}

export interface CreateAdminRoleBody {
  name: string;
  permissionIds: string[];
}

const MERCHANT_ROLES_BASE = "/api/admin/merchant-roles";
const ADMIN_ROLES_BASE = "/api/admin/roles";

const ROLE_API_ERROR_MESSAGES: Record<string, string> = {
  "merchant_roles.not_found": "Merchant role was not found.",
  "merchant_roles.duplicate_name": "A merchant role with this name already exists.",
  "merchant_roles.reserved": "This built-in role cannot be renamed or deleted.",
  "merchant_roles.in_use": "This role is assigned to one or more memberships and cannot be deleted.",
  "merchant_roles.invalid_permission": "One or more permissions are invalid.",
  "merchant_roles.invalid_permission_id": "One or more permissions are invalid.",
  "merchant_roles.invalid_permission_mask": "One or more permissions are invalid.",
  "merchant_roles.cannot_edit_merchant_created_role": "Merchant-created roles cannot be edited.",
  "merchant_roles.cannot_edit_admin_created_role": "This role cannot be edited.",
  "merchant_roles.name_required": "Name is required.",
  "admin_roles.not_found": "Admin role was not found.",
  "admin_roles.duplicate_name": "An admin role with this name already exists.",
  "admin_roles.name_required": "Name is required.",
  "admin_roles.reserved": "This built-in role cannot be renamed or deleted.",
  "admin_roles.in_use": "This role is assigned to one or more admin users and cannot be deleted.",
  "admin_roles.invalid_permission": "One or more permissions are invalid.",
  "admin_roles.invalid_permission_id": "One or more permissions are invalid.",
  "admin_roles.permission_already_assigned": "This permission is already assigned to the role.",
  "admin_roles.permission_not_assigned": "This permission is not assigned to the role.",
};

function roleErrorCode(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  if (typeof record.code === "string" && record.code in ROLE_API_ERROR_MESSAGES) return record.code;
  if (record.errors && typeof record.errors === "object") {
    for (const key of Object.keys(record.errors as Record<string, unknown>)) {
      if (key in ROLE_API_ERROR_MESSAGES) return key;
    }
  }
  return null;
}

/** Maps known role error codes, then falls back to {@link formatAdminApiError}. Pass the thrown `{ status, body }` value. */
export function formatRoleApiError(error: unknown): string {
  const status =
    error && typeof error === "object" && "status" in error
      ? (error as { status: unknown }).status
      : undefined;
  if (status === 403) return "You do not have permission for this action.";

  const body =
    error && typeof error === "object" && "body" in error ? (error as { body: unknown }).body : error;
  const code = roleErrorCode(body);
  if (code) return ROLE_API_ERROR_MESSAGES[code];
  return formatAdminApiError(body);
}

function rolePageQuery(pageNumber: number, pageSize: number): string {
  const page = Number.isFinite(pageNumber) ? Math.max(1, Math.trunc(pageNumber)) : 1;
  const size = Number.isFinite(pageSize) ? Math.min(100, Math.max(1, Math.trunc(pageSize))) : 20;
  const q = new URLSearchParams();
  q.set("pageNumber", String(page));
  q.set("pageSize", String(size));
  return `?${q.toString()}`;
}

function mapRoleListPage<T>(raw: RoleListPage<T> | null | undefined): RoleListPage<T> {
  return {
    items: Array.isArray(raw?.items) ? raw.items : [],
    totalCount: typeof raw?.totalCount === "number" ? raw.totalCount : 0,
    pageNumber: typeof raw?.pageNumber === "number" ? raw.pageNumber : 1,
    pageSize: typeof raw?.pageSize === "number" ? raw.pageSize : 20,
  };
}

function mapPermissions(value: PermissionCatalogItem[] | null | undefined): PermissionCatalogItem[] {
  return Array.isArray(value) ? value : [];
}

export async function listMerchantRoles(
  pageNumber: number,
  pageSize = 20,
): Promise<RoleListPage<MerchantRoleListItem>> {
  const raw = await requestJson<RoleListPage<MerchantRoleListItem>>(
    `${MERCHANT_ROLES_BASE}${rolePageQuery(pageNumber, pageSize)}`,
  );
  return mapRoleListPage(raw);
}

export async function getMerchantRole(id: string): Promise<MerchantRoleDetail> {
  const raw = await requestJson<MerchantRoleDetail>(
    `${MERCHANT_ROLES_BASE}/${encodeURIComponent(id)}`,
  );
  return { ...raw, permissions: mapPermissions(raw.permissions) };
}

export async function listMerchantRolePermissionCatalog(): Promise<PermissionCatalogItem[]> {
  const raw = await requestJson<PermissionCatalogItem[]>(`${MERCHANT_ROLES_BASE}/permission-catalog`);
  return Array.isArray(raw) ? raw : [];
}

export async function createMerchantRole(body: CreateMerchantRoleBody): Promise<MerchantRoleDetail> {
  const raw = await requestJson<MerchantRoleDetail>(MERCHANT_ROLES_BASE, {
    method: "POST",
    body: JSON.stringify({ name: body.name, permission: body.permission }),
  });
  return { ...raw, permissions: mapPermissions(raw.permissions) };
}

export async function patchMerchantRole(id: string, body: { name: string }): Promise<void> {
  await requestJson<unknown>(`${MERCHANT_ROLES_BASE}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ name: body.name }),
  });
}

export async function deleteMerchantRole(id: string): Promise<void> {
  await requestJson<unknown>(`${MERCHANT_ROLES_BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function listAdminRoles(
  pageNumber: number,
  pageSize = 20,
): Promise<RoleListPage<AdminRoleListItem>> {
  const raw = await requestJson<RoleListPage<AdminRoleListItem>>(
    `${ADMIN_ROLES_BASE}${rolePageQuery(pageNumber, pageSize)}`,
  );
  return mapRoleListPage(raw);
}

export async function getAdminRole(id: string): Promise<AdminRoleDetail> {
  const raw = await requestJson<AdminRoleDetail>(`${ADMIN_ROLES_BASE}/${encodeURIComponent(id)}`);
  return { ...raw, permissions: mapPermissions(raw.permissions) };
}

export async function listAdminRolePermissionCatalog(): Promise<PermissionCatalogItem[]> {
  const raw = await requestJson<PermissionCatalogItem[]>(`${ADMIN_ROLES_BASE}/permission-catalog`);
  return Array.isArray(raw) ? raw : [];
}

export async function createAdminRole(body: CreateAdminRoleBody): Promise<AdminRoleDetail> {
  const raw = await requestJson<AdminRoleDetail>(ADMIN_ROLES_BASE, {
    method: "POST",
    body: JSON.stringify({ name: body.name, permissionIds: body.permissionIds }),
  });
  return { ...raw, permissions: mapPermissions(raw.permissions) };
}

export async function patchAdminRole(id: string, body: { name: string }): Promise<void> {
  await requestJson<unknown>(`${ADMIN_ROLES_BASE}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ name: body.name }),
  });
}

export async function deleteAdminRole(id: string): Promise<void> {
  await requestJson<unknown>(`${ADMIN_ROLES_BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function addAdminRolePermission(roleId: string, permissionId: string): Promise<void> {
  await requestJson<unknown>(
    `${ADMIN_ROLES_BASE}/${encodeURIComponent(roleId)}/permissions/${encodeURIComponent(permissionId)}`,
    { method: "POST" },
  );
}

export async function removeAdminRolePermission(roleId: string, permissionId: string): Promise<void> {
  await requestJson<unknown>(
    `${ADMIN_ROLES_BASE}/${encodeURIComponent(roleId)}/permissions/${encodeURIComponent(permissionId)}`,
    { method: "DELETE" },
  );
}

// Requirement templates: no backend controller exists for this feature yet
// (see RequirementTemplatesPage), so there is no API client for it here.

