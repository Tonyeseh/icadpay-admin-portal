/** Decode JWT payload without verifying the signature (display / client routing only). */

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = base64 + "=".repeat(padLen);
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) return null;
  return value;
}

/** Claim `permissions` is a JSON array string of permission codes. */
export function permissionsFromAccessToken(token: string): string[] | null {
  const payload = decodeJwtPayload(token);
  const raw = payload?.permissions;
  if (typeof raw !== "string") return null;
  try {
    return asStringArray(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

/** `exp` is seconds since epoch. Used only to decide when to refresh. */
export function accessTokenExpiryMs(token: string): number | null {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (typeof exp !== "number" || !Number.isFinite(exp)) return null;
  return exp * 1000;
}
