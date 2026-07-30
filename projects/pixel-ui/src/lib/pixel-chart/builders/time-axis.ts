import type { PixelDateAdapter } from '../../shared/datetime/pixel-date-adapter';

/** Category / time-axis value accepted by cartesian builders. */
export type PixelChartAxisValue = string | number | Date;

export type PixelChartXAxisType = 'category' | 'time';

/** Coerce a category value to a millisecond timestamp when possible. */
export function toChartTimestamp(value: PixelChartAxisValue): number | null {
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isFinite(t) ? t : null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Format an axis label for display.
 * Prefers `PixelDateAdapter` when provided; otherwise `Intl.DateTimeFormat`.
 */
export function formatChartAxisLabel(
  value: PixelChartAxisValue,
  options?: {
    readonly adapter?: PixelDateAdapter<Date> | null;
    readonly locale?: string;
    readonly displayFormat?: unknown;
    /** When set (and no adapter), uses `Intl.DateTimeFormat` `dateStyle`. */
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
      return adapter.format(d, options?.displayFormat ?? 'mediumDate');
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
