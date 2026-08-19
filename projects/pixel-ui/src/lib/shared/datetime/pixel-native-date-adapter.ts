import { Injectable, inject } from '@angular/core';
import { PixelDateAdapter, PIXEL_DATE_LOCALE } from './pixel-date-adapter';
import { PIXEL_DATE_FORMATS } from './pixel-date-formats';
import {
  buildDate,
  formatDateBySpec,
  parseDateBySpec,
  startOfDay,
  toNativeDate,
} from './pixel-date-utils';

@Injectable()
export class PixelNativeDateAdapter extends PixelDateAdapter<Date> {
  private readonly locale = inject(PIXEL_DATE_LOCALE, { optional: true }) ?? undefined;
  private readonly formats = inject(PIXEL_DATE_FORMATS, { optional: true });

  override getYear(date: Date): number {
    return date.getFullYear();
  }

  override getMonth(date: Date): number {
    return date.getMonth();
  }

  override getDate(date: Date): number {
    return date.getDate();
  }

  override getDayOfWeek(date: Date): number {
    return date.getDay();
  }

  override getMonthNames(style: 'long' | 'short' | 'narrow'): readonly string[] {
    const fmt = new Intl.DateTimeFormat(this.locale, { month: style });
    return Array.from({ length: 12 }, (_unused, month) =>
      fmt.format(new Date(2023, month, 1)),
    );
  }

  override getDateNames(): readonly string[] {
    return Array.from({ length: 31 }, (_unused, index) => String(index + 1));
  }

  override getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): readonly string[] {
    const fmt = new Intl.DateTimeFormat(this.locale, { weekday: style });
    return Array.from({ length: 7 }, (_unused, index) =>
      fmt.format(new Date(2023, 0, 1 + index)),
    );
  }

  override getYearName(date: Date): string {
    return String(this.getYear(date));
  }

  /**
   * Returns the first day of the week for the current locale as a JS `getDay()` index
   * (0 = Sunday, 1 = Monday … 6 = Saturday).
   *
   * Uses `Intl.Locale.prototype.getWeekInfo()` (Chrome 99+, Safari 16+; not Firefox <126).
   * `weekInfo.firstDay` uses ISO values: 1 = Monday … 7 = Sunday.
   * We map Sunday (7) → 0 with `% 7`.
   * Falls back to Sunday (0) when `getWeekInfo` is unavailable or the locale tag is invalid.
   */
  override getFirstDayOfWeek(): number {
    try {
      const loc = new Intl.Locale(this.locale ?? 'und');
      // `getWeekInfo` is Chrome 99+ / Safari 16+. Firefox <126 lacks it.
      const info = (loc as unknown as { getWeekInfo?: () => { firstDay: number } }).getWeekInfo?.();
      if (info?.firstDay != null) {
        // ISO firstDay: 1=Mon … 7=Sun → JS: Mon=1 … Sat=6, Sun=0
        return info.firstDay % 7;
      }
    } catch {
      // Invalid locale tag or unsupported environment — fall through.
    }
    return 0; // Sunday default (en-US / fallback)
  }

  override getNumDaysInMonth(date: Date): number {
    return new Date(this.getYear(date), this.getMonth(date) + 1, 0).getDate();
  }

  override clone(date: Date): Date {
    return new Date(date.getTime());
  }

  override createDate(year: number, month: number, date: number): Date {
    return buildDate(year, month + 1, date) ?? new Date(NaN);
  }

  override today(): Date {
    return startOfDay(new Date());
  }

  override parse(value: unknown, parseFormat?: unknown): Date | null {
    if (value == null || value === '') {
      return null;
    }
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : startOfDay(value);
    }
    if (typeof value === 'number') {
      return toNativeDate(value);
    }
    if (typeof value === 'string') {
      const format = parseFormat ?? this.formats?.parse.dateInput ?? null;
      return parseDateBySpec(value, format, this.locale);
    }
    return null;
  }

  override format(date: Date, displayFormat: unknown): string {
    return formatDateBySpec(date, displayFormat, this.locale);
  }

  override addCalendarYears(date: Date, years: number): Date {
    const y = date.getFullYear() + years;
    const m = date.getMonth();
    const d = date.getDate();
    // Clamp to last valid day of the target month (e.g. Feb 29 on a non-leap year → Feb 28).
    const lastDay = new Date(y, m + 1, 0).getDate();
    return new Date(y, m, Math.min(d, lastDay));
  }

  override addCalendarMonths(date: Date, months: number): Date {
    const rawMonth = date.getMonth() + months;
    const y = date.getFullYear() + Math.floor(rawMonth / 12);
    const m = ((rawMonth % 12) + 12) % 12;
    const d = date.getDate();
    // Clamp to last valid day of the target month (e.g. Jan 31 + 1 month → Feb 28/29).
    const lastDay = new Date(y, m + 1, 0).getDate();
    return new Date(y, m, Math.min(d, lastDay));
  }

  /**
   * Adds `days` calendar days using Y/M/D field arithmetic — DST-safe.
   * `new Date(ms + n * 86400000)` can produce the wrong day across DST boundaries
   * (clocks jump 1 h → day is only 23 h long, so +86400000 ms overshoots).
   */
  override addCalendarDays(date: Date, days: number): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  }

  override toNativeDate(date: Date): Date {
    return startOfDay(date);
  }

  override fromNativeDate(date: Date | null): Date | null {
    return date ? startOfDay(date) : null;
  }

  /** Locale / formats-aware typed-input parser (used by datepicker / range input). */
  parseInput(text: string): Date | null {
    return this.parse(text, this.formats?.parse.dateInput ?? null);
  }
}
