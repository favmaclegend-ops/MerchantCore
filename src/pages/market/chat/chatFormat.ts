// Reusable formatting helpers for Market Chat.

/** "2:14 PM", "Yesterday", or "Mon" for list previews. */
export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const diffDays = Math.round((startOfToday - start) / 86400000)
  if (diffDays === 0)
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return date.toLocaleDateString(undefined, { weekday: 'short' })
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** Full timestamp for the header of an open conversation. */
export function formatFullTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join(' ')
}

// ---------------------------------------------------------------------------
// Discount offer helpers (24h validity window)
// ---------------------------------------------------------------------------

export const DISCOUNT_VALIDITY_MS = 24 * 60 * 60 * 1000; // 24 hours

/** The ISO timestamp at which a discount offer expires (sent time + 24h). */
export function getDiscountExpiry(sentAt: string | null | undefined): number {
  const base = sentAt ? new Date(sentAt).getTime() : NaN;
  if (Number.isNaN(base)) return NaN;
  return base + DISCOUNT_VALIDITY_MS;
}

/** True if the offer has already passed its 24h validity window. */
export function isDiscountExpired(sentAt: string | null | undefined, now = Date.now()): boolean {
  const expiry = getDiscountExpiry(sentAt);
  if (Number.isNaN(expiry)) return false;
  return now >= expiry;
}

/** "23h 59m" style remaining time, or empty when the offer is expired/invalid. */
export function formatDiscountCountdown(
  sentAt: string | null | undefined,
  now = Date.now(),
): string {
  const expiry = getDiscountExpiry(sentAt);
  if (Number.isNaN(expiry)) return '';
  const remaining = expiry - now;
  if (remaining <= 0) return '';
  const totalMinutes = Math.floor(remaining / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Best-effort clean item name from a discount message. The owner composes the
 * text as "<name> at a discount price of <amount>", so we strip that trailing
 * phrase rather than showing the full sentence under the product image.
 */
export function discountItemName(text: string): string {
  if (!text) return '';
  const cleaned = text.replace(/\s+at a discount price of\s+.*$/i, '');
  return cleaned.trim() || text;
}
