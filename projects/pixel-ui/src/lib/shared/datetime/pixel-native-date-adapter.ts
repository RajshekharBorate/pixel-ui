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

  override getFirstDayOfWeek(): number {
    return 0;
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
    return new Date(date.getFullYear() + years, date.getMonth(), date.getDate());
  }

  override addCalendarMonths(date: Date, months: number): Date {
    return new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
  }

  override addCalendarDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 86_400_000);
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
