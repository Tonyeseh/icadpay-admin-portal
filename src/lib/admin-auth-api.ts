import { apiUrl } from "@/lib/api-base";

const ADMIN_AUTH_BASE = "/api/v1/auth/admin";

export interface AdminAuthUserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roleId: string;
  roleName: string;
  permissions: string[];
}

export interface AdminAuthResponse {
  user: AdminAuthUserDto;
  accessToken: string;
}

export interface AdminAuthErrorBody {
  code?: string;
  description?: string;
  detail?: string;
  title?: string;
  errors?: Record<string, string[]>;
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function adminLogin(email: string, password: string): Promise<AdminAuthResponse> {
  const res = await fetch(apiUrl(`${ADMIN_AUTH_BASE}/login`), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await parseJsonSafe(res);
    throw { status: res.status, body };
  }

  return res.json() as Promise<AdminAuthResponse>;
}

let refreshInFlight: Promise<AdminAuthResponse> | null = null;

export function adminRefresh(): Promise<AdminAuthResponse> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const res = await fetch(apiUrl(`${ADMIN_AUTH_BASE}/refresh`), {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) {
      const body = await parseJsonSafe(res);
      throw { status: res.status, body };
    }

    return res.json() as Promise<AdminAuthResponse>;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

export async function adminLogout(): Promise<void> {
  const res = await fetch(apiUrl(`${ADMIN_AUTH_BASE}/logout`), {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok && res.status !== 204) {
    const body = await parseJsonSafe(res);
    throw { status: res.status, body };
  }
}

function firstErrorString(errors: unknown): string | null {
  if (!errors || typeof errors !== "object") return null;
  for (const value of Object.values(errors as Record<string, unknown>)) {
    if (!Array.isArray(value)) continue;
    const message = value.find((item) => typeof item === "string" && item.length > 0);
    if (typeof message === "string") return message;
  }
  return null;
}

export function formatAuthError(body: unknown): string {
  if (body && typeof body === "object") {
    const record = body as AdminAuthErrorBody;
    if (typeof record.description === "string" && record.description.length > 0) return record.description;
    const fromErrors = firstErrorString(record.errors);
    if (fromErrors) return fromErrors;
    if (typeof record.detail === "string" && record.detail.length > 0) return record.detail;
    if (typeof record.title === "string" && record.title.length > 0) return record.title;
  }
  return "Request failed";
}
