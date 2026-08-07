/** Shared date helpers used by calendar, datepicker, and range picker. */

export const MS_PER_DAY = 86_400_000;

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function toNativeDate(value: Date | string | number | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed);
}

export function sameDay(a: Date | null, b: Date | null): boolean {
  return !!a && !!b && a.getTime() === b.getTime();
}

export function compareDay(a: Date, b: Date): number {
  return a.getTime() - b.getTime();
}

export function isBetweenInclusive(date: Date, start: Date, end: Date): boolean {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

export function normalizeRange(start: Date, end: Date): { readonly start: Date; readonly end: Date } {
  return compareDay(start, end) <= 0 ? { start, end } : { start: end, end: start };
}

export function normalizeDateClasses(
  value: string | readonly string[] | null | undefined,
): readonly string[] {
  if (!value) {
    return [];
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  return value.map((cls) => cls.trim()).filter(Boolean);
}

/** Field order (day / month / year) the locale uses for a numeric date, for typed-input parsing. */
export function localeDateFieldOrder(locale?: string): ('day' | 'month' | 'year')[] {
  try {
    const parts = new Intl.DateTimeFormat(locale).formatToParts(new Date(2023, 10, 25));
    const order = parts
      .filter((part) => part.type === 'day' || part.type === 'month' || part.type === 'year')
      .map((part) => part.type as 'day' | 'month' | 'year');
    return order.length === 3 ? order : ['month', 'day', 'year'];
  } catch {
    return ['month', 'day', 'year'];
  }
}

/** Constructs a `Date` only when the calendar fields round-trip (rejects e.g. 2023-02-30). */
export function buildDate(year: number, month: number, day: number): Date | null {
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
    return startOfDay(date);
  }
  return null;
}

/**
 * Best-effort, locale-aware parser for typed dates. Handles ISO (`YYYY-MM-DD`), locale-ordered
 * numeric input (`/`, `.`, or `-` separators), and falls back to the native `Date` parser.
 */
export function defaultParseDate(text: string, locale?: string): Date | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  const iso = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    return buildDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  const numeric = trimmed.match(/^(\d{1,4})[/.\-](\d{1,2})[/.\-](\d{1,4})$/);
  if (numeric) {
    const order = localeDateFieldOrder(locale);
    const nums = [Number(numeric[1]), Number(numeric[2]), Number(numeric[3])];
    const fields: Record<'day' | 'month' | 'year', number> = { day: 1, month: 1, year: 1970 };
    order.forEach((field, index) => (fields[field] = nums[index]));
    let year = fields.year;
    if (year < 100) {
      year += year >= 70 ? 1900 : 2000;
    }
    return buildDate(year, fields.month, fields.day);
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed);
}

/**
 * Locale short numeric date (Material-native style) — e.g. `7/15/2024` (en-US),
 * `15/07/2024` (en-GB). Not a fixed `MM/DD/YYYY` mask.
 */
export function defaultFormatDate(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(date);
}

/** Accessible format hint from locale field order — e.g. `MM/DD/YYYY` (en-US), `DD/MM/YYYY` (en-GB). */
export function localeDateFormatHint(locale?: string): string {
  const labels: Record<'day' | 'month' | 'year', string> = {
    day: 'DD',
    month: 'MM',
    year: 'YYYY',
  };
  return localeDateFieldOrder(locale)
    .map((field) => labels[field])
    .join('/');
}

const PATTERN_TOKEN = /yyyy|yy|MM|M|dd|d/g;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** Formats a date with a simple pattern (`dd/MM/yyyy`, `M/d/yyyy`, …). */
export function formatDatePattern(date: Date, pattern: string): string {
  const values: Record<string, string> = {
    yyyy: String(date.getFullYear()),
    yy: String(date.getFullYear()).slice(-2),
    MM: pad2(date.getMonth() + 1),
    M: String(date.getMonth() + 1),
    dd: pad2(date.getDate()),
    d: String(date.getDate()),
  };
  return pattern.replace(PATTERN_TOKEN, (token) => values[token] ?? token);
}

/** Parses typed text against a simple pattern (`dd/MM/yyyy`, `M/d/yyyy`, …). */
export function parseDatePattern(text: string, pattern: string): Date | null {
  const trimmed = text.trim();
  if (!trimmed || !pattern.trim()) {
    return null;
  }

  let regexSource = '';
  const fields: Array<'year' | 'month' | 'day'> = [];
  let lastIndex = 0;
  PATTERN_TOKEN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = PATTERN_TOKEN.exec(pattern)) !== null) {
    regexSource += escapeRegExp(pattern.slice(lastIndex, match.index));
    const token = match[0];
    if (token === 'yyyy') {
      regexSource += '(\\d{4})';
      fields.push('year');
    } else if (token === 'yy') {
      regexSource += '(\\d{2})';
      fields.push('year');
    } else if (token === 'MM' || token === 'dd') {
      regexSource += '(\\d{1,2})';
      fields.push(token === 'MM' ? 'month' : 'day');
    } else if (token === 'M' || token === 'd') {
      regexSource += '(\\d{1,2})';
      fields.push(token === 'M' ? 'month' : 'day');
    }
    lastIndex = match.index + token.length;
  }
  regexSource += escapeRegExp(pattern.slice(lastIndex));

  const matched = trimmed.match(new RegExp(`^${regexSource}$`));
  if (!matched) {
    return null;
  }

  const parts: Record<'year' | 'month' | 'day', number> = { year: NaN, month: NaN, day: NaN };
  fields.forEach((field, index) => {
    parts[field] = Number(matched[index + 1]);
  });
  if (Number.isNaN(parts.year) || Number.isNaN(parts.month) || Number.isNaN(parts.day)) {
    return null;
  }
  let year = parts.year;
  if (year < 100) {
    year += year >= 70 ? 1900 : 2000;
  }
  return buildDate(year, parts.month, parts.day);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Formats using a Material-style display spec: pattern string, Intl options, function, or null
 * (falls back to `defaultFormatDate`).
 */
export function formatDateBySpec(date: Date, displayFormat: unknown, locale?: string): string {
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  if (displayFormat == null) {
    return defaultFormatDate(date, locale);
  }
  if (typeof displayFormat === 'function') {
    return (displayFormat as (d: Date, loc?: string) => string)(date, locale);
  }
  if (typeof displayFormat === 'string') {
    return formatDatePattern(date, displayFormat);
  }
  try {
    return new Intl.DateTimeFormat(locale, displayFormat as Intl.DateTimeFormatOptions).format(date);
  } catch {
    return defaultFormatDate(date, locale);
  }
}

/**
 * Parses using a Material-style parse spec: pattern string / string[], Intl options (locale
 * numeric), or null (`defaultParseDate`). Always accepts ISO `YYYY-MM-DD` first.
 */
export function parseDateBySpec(text: string, parseFormat: unknown, locale?: string): Date | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  const iso = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    return buildDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  if (parseFormat == null) {
    return defaultParseDate(trimmed, locale);
  }

  if (typeof parseFormat === 'string') {
    return parseDatePattern(trimmed, parseFormat) ?? defaultParseDate(trimmed, locale);
  }

  if (Array.isArray(parseFormat)) {
    for (const candidate of parseFormat) {
      if (typeof candidate === 'string') {
        const parsed = parseDatePattern(trimmed, candidate);
        if (parsed) {
          return parsed;
        }
      }
    }
    return defaultParseDate(trimmed, locale);
  }

  // Intl options / unknown objects → locale-ordered numeric + fallbacks.
  return defaultParseDate(trimmed, locale);
}

/** Hint text from a display spec (pattern string) or locale order. */
export function formatHintFromDisplaySpec(displayFormat: unknown, locale?: string): string {
  if (typeof displayFormat === 'string' && displayFormat.trim()) {
    return displayFormat.replace(/yyyy/gi, 'YYYY').replace(/dd/gi, 'DD').replace(/mm/gi, 'MM');
  }
  return localeDateFormatHint(locale);
}
