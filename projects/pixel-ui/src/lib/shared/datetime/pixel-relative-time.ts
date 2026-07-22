/**
 * Locale-aware relative timestamps for feeds and notification lists.
 * Built on `Intl.RelativeTimeFormat` — no third-party date library.
 */

export type PixelRelativeTimeStyle = 'long' | 'short' | 'narrow' | 'compact';
export type PixelRelativeTimeNumeric = 'always' | 'auto';

export interface PixelRelativeTimeOptions {
  /** BCP 47 locale; defaults to the runtime locale. */
  readonly locale?: string;
  /** Reference "now" for tests and clock skew control. */
  readonly now?: number | Date;
  /**
   * `auto` yields natural forms like "yesterday" / "now"; `always` keeps numeric phrases.
   * @default 'auto'
   */
  readonly numeric?: PixelRelativeTimeNumeric;
  /**
   * Relative phrase length. `compact` uses ultra-dense forms like `3m ago` / `2h ago`
   * (notification panels); other values use `Intl.RelativeTimeFormat`.
   * @default 'long'
   */
  readonly style?: PixelRelativeTimeStyle;
  /**
   * Switch to an absolute local date/time after this many calendar days.
   * Pass `null` to keep relative units through years.
   * @default 7
   */
  readonly absoluteAfterDays?: number | null;
}

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const MS_PER_WEEK = 7 * MS_PER_DAY;
const MS_PER_MONTH = 30 * MS_PER_DAY;
const MS_PER_YEAR = 365 * MS_PER_DAY;

/**
 * Formats a past (or future) instant as a relative phrase, falling back to an absolute
 * timestamp after {@link PixelRelativeTimeOptions.absoluteAfterDays}.
 */
export function formatRelativeTime(
  value: number | string | Date,
  options: PixelRelativeTimeOptions = {},
): string {
  const timestamp = toEpochMs(value);
  if (timestamp === null) {
    return '';
  }

  const now = toEpochMs(options.now ?? Date.now()) ?? Date.now();
  const absoluteAfterDays =
    options.absoluteAfterDays === undefined ? 7 : options.absoluteAfterDays;
  const diffMs = timestamp - now;
  const absMs = Math.abs(diffMs);

  if (absoluteAfterDays !== null && absMs >= absoluteAfterDays * MS_PER_DAY) {
    return formatAbsoluteTimestamp(timestamp, options.locale);
  }

  const style = options.style ?? 'long';
  if (style === 'compact') {
    return formatCompactRelativeTime(diffMs, absMs);
  }

  const rtf = new Intl.RelativeTimeFormat(options.locale, {
    numeric: options.numeric ?? 'auto',
    style,
  });

  // First minute collapses to "now" (or locale equivalent) for notification scanability.
  if (absMs < MS_PER_MINUTE) {
    return rtf.format(0, 'second');
  }
  if (absMs < MS_PER_HOUR) {
    return rtf.format(Math.round(diffMs / MS_PER_MINUTE), 'minute');
  }
  if (absMs < MS_PER_DAY) {
    return rtf.format(Math.round(diffMs / MS_PER_HOUR), 'hour');
  }
  if (absoluteAfterDays === null) {
    if (absMs < MS_PER_WEEK) {
      return rtf.format(Math.round(diffMs / MS_PER_DAY), 'day');
    }
    if (absMs < MS_PER_MONTH) {
      return rtf.format(Math.round(diffMs / MS_PER_WEEK), 'week');
    }
    if (absMs < MS_PER_YEAR) {
      return rtf.format(Math.round(diffMs / MS_PER_MONTH), 'month');
    }
    return rtf.format(Math.round(diffMs / MS_PER_YEAR), 'year');
  }

  return rtf.format(Math.round(diffMs / MS_PER_DAY), 'day');
}

/** Locale-aware absolute date + time for tooltips and absolute display mode. */
export function formatAbsoluteTimestamp(
  value: number | string | Date,
  locale?: string,
): string {
  const timestamp = toEpochMs(value);
  if (timestamp === null) {
    return '';
  }
  return new Date(timestamp).toLocaleString(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatCompactRelativeTime(diffMs: number, absMs: number): string {
  const past = diffMs <= 0;
  const suffix = past ? ' ago' : '';
  const prefix = past ? '' : 'in ';

  if (absMs < MS_PER_MINUTE) {
    return 'now';
  }
  if (absMs < MS_PER_HOUR) {
    const minutes = Math.max(1, Math.round(absMs / MS_PER_MINUTE));
    return `${prefix}${minutes}m${suffix}`;
  }
  if (absMs < MS_PER_DAY) {
    const hours = Math.max(1, Math.round(absMs / MS_PER_HOUR));
    return `${prefix}${hours}h${suffix}`;
  }
  const days = Math.max(1, Math.round(absMs / MS_PER_DAY));
  return `${prefix}${days}d${suffix}`;
}

function toEpochMs(value: number | string | Date | undefined): number | null {
  if (value === undefined) {
    return null;
  }
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}
