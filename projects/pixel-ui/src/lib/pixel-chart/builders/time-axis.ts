import { parseLocalIsoDate } from '../../shared/datetime/pixel-date-utils';
import type { PixelDateAdapter } from '../../shared/datetime/pixel-date-adapter';

/** Category / time-axis value accepted by cartesian builders. */
export type PixelChartAxisValue = string | number | Date;

export type PixelChartXAxisType = 'category' | 'time';

/**
 * Coerce a category value to a millisecond timestamp when it is an intentional date.
 *
 * Accepts `Date`, finite numbers (epoch ms), civil `YYYY-MM-DD`, ISO-8601 with time, and
 * long numeric epoch strings. Rejects free-text labels (`Jan 23`, `Q1`, `1`) so category
 * axes are not re-parsed through `Date.parse`.
 */
export function toChartTimestamp(value: PixelChartAxisValue): number | null {
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isFinite(t) ? t : null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const civil = parseLocalIsoDate(trimmed);
    return civil ? civil.getTime() : null;
  }

  if (/^\d{4}-\d{2}-\d{2}T/i.test(trimmed)) {
    const parsed = Date.parse(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  // Epoch seconds (10) / ms (13) as strings — not ordinal labels like "1" / "15".
  if (/^\d{10,13}$/.test(trimmed)) {
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }

  return null;
}

/**
 * Format an axis label for display.
 *
 * - Plain category strings that are not intentional dates pass through unchanged.
 * - Real dates use `PixelDateAdapter` when provided (display spec must be a pixel
 *   `formatDateBySpec` value — pattern / Intl options / function / `null`). Never pass
 *   Angular named formats like `'mediumDate'`.
 * - Without an adapter, uses `Intl.DateTimeFormat` with optional `dateStyle`.
 */
export function formatChartAxisLabel(
  value: PixelChartAxisValue,
  options?: {
    readonly adapter?: PixelDateAdapter<Date> | null;
    readonly locale?: string;
    /** Pixel display spec (`null` → `defaultFormatDate`). Not Angular DatePipe names. */
    readonly displayFormat?: unknown;
    /** When set (and no adapter / no displayFormat), uses `Intl.DateTimeFormat` `dateStyle`. */
    readonly dateStyle?: 'short' | 'medium' | 'long';
  },
): string {
  if (typeof value === 'string' && toChartTimestamp(value) == null) {
    return value;
  }
  const ts = toChartTimestamp(value);
  if (ts == null) {
    return String(value);
  }
  const date = new Date(ts);
  const adapter = options?.adapter;
  if (adapter) {
    const d = adapter.fromNativeDate(date);
    if (d != null && adapter.isValid(d)) {
      // `null` → formatDateBySpec → defaultFormatDate(locale). Do not use 'mediumDate'.
      return adapter.format(d, options?.displayFormat ?? null);
    }
  }
  if (options?.dateStyle) {
    return new Intl.DateTimeFormat(options.locale, {
      dateStyle: options.dateStyle,
    }).format(date);
  }
  return new Intl.DateTimeFormat(options?.locale, {
    month: 'short',
    day: 'numeric',
    year: '2-digit',
  }).format(date);
}

/** Normalize mixed categories to strings for category axes. */
export function normalizeCategoryLabels(
  categories: readonly PixelChartAxisValue[],
  format?: (value: PixelChartAxisValue) => string,
): string[] {
  return categories.map((c) => (format ? format(c) : formatChartAxisLabel(c)));
}
