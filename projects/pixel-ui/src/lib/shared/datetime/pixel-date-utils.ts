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

export function defaultFormatDate(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}
