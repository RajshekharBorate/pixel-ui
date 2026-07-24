/**
 * Formats a Date as a calendar `YYYY-MM-DD` in the **local** timezone.
 * Do not use `Date#toISOString().slice(0, 10)` for date-only values — that is UTC and
 * shifts the day in positive-offset zones (e.g. IST).
 */
export function toLocalIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
