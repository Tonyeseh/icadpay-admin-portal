import { apiUrl } from "@/lib/api-base";
import { adminRefresh } from "@/lib/admin-auth-api";
import { accessTokenExpiryMs } from "@/lib/jwt";
import { useAdminStore } from "@/store/useAdminStore";

const ADMIN_AUTH_PREFIX = "/api/v1/auth/admin";
const REFRESH_WINDOW_MS = 60_000;

function isAdminAuthPath(path: string): boolean {
  return path === ADMIN_AUTH_PREFIX || path.startsWith(`${ADMIN_AUTH_PREFIX}/`);
}

function authorizedFetch(path: string, init: RequestInit): Promise<Response> {
  const token = useAdminStore.getState().accessToken;
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(apiUrl(path), {
    ...init,
    credentials: "include",
    headers,
  });
}

async function refreshAndSave(epoch: number): Promise<void> {
  const data = await adminRefresh();
  useAdminStore.getState().setSessionFromAuthResponse(data, epoch);
}

/** Calls `{origin}/api/...` with `credentials: include` and `Authorization: Bearer` when a token exists. */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (!isAdminAuthPath(path)) {
    const { accessToken, sessionEpoch } = useAdminStore.getState();
    if (accessToken) {
      const expiresAt = accessTokenExpiryMs(accessToken);
      if (expiresAt !== null && expiresAt - Date.now() <= REFRESH_WINDOW_MS) {
        try {
          await refreshAndSave(sessionEpoch);
        } catch {
          // The request still goes out. A 401 retries refresh once, then signs out.
        }
      }
    }
  }

  let response = await authorizedFetch(path, init);
  if (response.status === 403 || response.status !== 401 || isAdminAuthPath(path)) {
    return response;
  }

  const state = useAdminStore.getState();
  if (!state.accessToken && !state.user) return response;

  const epoch = state.sessionEpoch;
  try {
    await refreshAndSave(epoch);
    if (useAdminStore.getState().sessionEpoch !== epoch) return response;
    response = await authorizedFetch(path, init);
    if (response.status === 401) {
      await useAdminStore.getState().signOut();
    }
    return response;
  } catch {
    if (useAdminStore.getState().sessionEpoch === epoch) {
      await useAdminStore.getState().signOut();
    }
    return response;
  }
}
