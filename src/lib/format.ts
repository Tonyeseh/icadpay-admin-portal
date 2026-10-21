/** Convert integer minor units to a major-unit number using ISO currency fraction digits. */
function minorToMajorUnits(amountMinor: number, currency: string): number {
  const c = currency.trim().toUpperCase() || "NGN";
  let fractionDigits = 2;
  try {
    fractionDigits = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: c,
    }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    fractionDigits = 2;
  }
  return amountMinor / 10 ** fractionDigits;
}

/** Format integer minor units (e.g. kobo) with the given ISO currency code. */
export function formatMinorUnits(
  amountMinor: number,
  currency: string,
  opts: { compact?: boolean } = {},
): string {
  const c = currency.trim().toUpperCase() || "NGN";
  const minor = Number(amountMinor);
  if (!Number.isFinite(minor)) return "—";
  const major = minorToMajorUnits(minor, c);
  try {
    if (opts.compact && Math.abs(major) >= 1_000_000) {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: c,
        notation: "compact",
        maximumFractionDigits: 2,
      }).format(major);
    }
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: c,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    return `${c} ${major.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

export function formatNaira(kobo: number, opts: { compact?: boolean } = {}): string {
  const value = kobo / 100;
  if (opts.compact && value >= 1_000_000_000) {
    return `₦${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (opts.compact && value >= 1_000_000) {
    return `₦${(value / 1_000_000).toFixed(2)}M`;
  }
  if (opts.compact && value >= 1_000) {
    return `₦${(value / 1_000).toFixed(1)}K`;
  }
  return `₦${value.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${formatDate(iso)} · ${d.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function formatRelative(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

export function maskKey(value: string, visibleStart = 8, visibleEnd = 4): string {
  if (value.length <= visibleStart + visibleEnd) return value;
  return `${value.slice(0, visibleStart)}${"•".repeat(20)}${value.slice(-visibleEnd)}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}
