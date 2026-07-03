import { InjectionToken } from '@angular/core';

/** Converts between the application date type `D` and native `Date` for calendar math. */
export abstract class PixelDateAdapter<D = Date> {
  abstract getYear(date: D): number;
  abstract getMonth(date: D): number;
  abstract getDate(date: D): number;
  abstract getDayOfWeek(date: D): number;

  abstract getMonthNames(style: 'long' | 'short' | 'narrow'): readonly string[];
  abstract getDateNames(): readonly string[];
  abstract getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): readonly string[];
  abstract getYearName(date: D): string;
  abstract getFirstDayOfWeek(): number;

  abstract getNumDaysInMonth(date: D): number;
  abstract clone(date: D): D;
  abstract createDate(year: number, month: number, date: number): D;
  abstract today(): D;
  abstract parse(value: unknown, parseFormat?: unknown): D | null;
  abstract format(date: D, displayFormat: unknown): string;
  abstract addCalendarYears(date: D, years: number): D;
  abstract addCalendarMonths(date: D, months: number): D;
  abstract addCalendarDays(date: D, days: number): D;

  /** Converts to native `Date` at local midnight for grid rendering. */
  abstract toNativeDate(date: D): Date;
  /** Parses a native `Date` (or null) into `D`. */
  abstract fromNativeDate(date: Date | null): D | null;

  isDateInstance(obj: unknown): obj is D {
    return obj instanceof Date;
  }

  isValid(date: D): boolean {
    return !Number.isNaN(this.toNativeDate(date).getTime());
  }

  invalid(): D {
    return new Date(NaN) as D;
  }

  compareDate(first: D, second: D): number {
    return this.toNativeDate(first).getTime() - this.toNativeDate(second).getTime();
  }

  sameDate(first: D | null, second: D | null): boolean {
    if (first == null || second == null) {
      return first === second;
    }
    return this.compareDate(first, second) === 0;
  }
}

export const PIXEL_DATE_ADAPTER = new InjectionToken<PixelDateAdapter<unknown>>('PIXEL_DATE_ADAPTER');

export const PIXEL_DATE_LOCALE = new InjectionToken<string | undefined>('PIXEL_DATE_LOCALE', {
  providedIn: 'root',
  factory: () => undefined,
});
