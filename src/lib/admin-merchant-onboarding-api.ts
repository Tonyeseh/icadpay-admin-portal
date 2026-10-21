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

const ONBOARDING_BASE = "/api/v1/admin/onboarding";

// ─── Writes (PlatformOpsOrSuper) ─────────────────────────────────────────────

export async function patchApproveMerchantOnboarding(merchantId: string): Promise<void> {
  await requestJson<null>(`${ONBOARDING_BASE}/${encodeURIComponent(merchantId.trim())}/approve`, {
    method: "PATCH",
  });
}

export async function patchRejectMerchantOnboarding(merchantId: string, reason: string): Promise<void> {
  await requestJson<null>(`${ONBOARDING_BASE}/${encodeURIComponent(merchantId.trim())}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export async function patchRequestMerchantOnboardingChanges(merchantId: string, message: string): Promise<void> {
  await requestJson<null>(`${ONBOARDING_BASE}/${encodeURIComponent(merchantId.trim())}/request-changes`, {
    method: "PATCH",
    body: JSON.stringify({ message }),
  });
}

function parseFilenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const mStar = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (mStar?.[1]) {
    try {
      return decodeURIComponent(mStar[1].trim().replace(/^"+|"+$/g, ""));
    } catch {
      return mStar[1].trim();
    }
  }
  const m = /filename="([^"]+)"/i.exec(header) ?? /filename=([^;\s]+)/i.exec(header);
  return m?.[1]?.trim() ?? null;
}

export type AdminDocumentFile = {
  blob: Blob;
  fileName: string;
  contentType: string;
};

/** GET /api/v1/admin/documents/{id}; `id` must be DocumentInstance.Id. */
export async function loadAdminDocumentFile(
  documentId: string,
  fallbackFileName?: string,
): Promise<AdminDocumentFile> {
  const id = documentId.trim();
  const res = await apiFetch(`/api/v1/admin/documents/${encodeURIComponent(id)}`);
  if (!res.ok) {
    const body = (await parseJsonSafe(res)) as AdminApiErrorBody;
    throw { status: res.status, body } satisfies AdminApiError;
  }
  const rawBlob = await res.blob();
  const headerType = res.headers.get("Content-Type")?.split(";")[0]?.trim() ?? "";
  const contentType = headerType || rawBlob.type || "";
  const blob = contentType && rawBlob.type !== contentType ? new Blob([rawBlob], { type: contentType }) : rawBlob;
  const headerFileName = parseFilenameFromContentDisposition(res.headers.get("Content-Disposition"));
  return {
    blob,
    fileName: resolveDownloadName(id, headerFileName, fallbackFileName),
    contentType,
  };
}

export function saveAdminDocumentBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function resolveDownloadName(documentId: string, headerFileName: string | null, fallbackFileName?: string): string {
  const fromHeader = headerFileName?.trim();
  if (fromHeader) return fromHeader;
  const fallback = fallbackFileName?.trim();
  if (fallback) return fallback;
  return `document-${documentId.trim().slice(0, 8)}`;
}

/** GET /api/v1/admin/documents/{id}; `id` must be DocumentInstance.Id. `fallbackFileName` is used when Content-Disposition is missing. */
export async function downloadAdminDocument(documentId: string, fallbackFileName?: string): Promise<void> {
  const file = await loadAdminDocumentFile(documentId, fallbackFileName);
  saveAdminDocumentBlob(file.blob, file.fileName);
}
