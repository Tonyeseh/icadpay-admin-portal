/** Base URL for API calls (no trailing slash). Empty string = same origin (use Vite proxy in dev). */
export function getApiOrigin(): string {
  const raw = import.meta.env.VITE_API_BASE_URL?.trim();
  return raw?.replace(/\/$/, "") ?? "";
}

/** Absolute URL for an API path starting with `/api`. */
export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const origin = getApiOrigin();
  return origin ? `${origin}${p}` : p;
}
