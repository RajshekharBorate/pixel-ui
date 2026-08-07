import { InjectionToken } from '@angular/core';

/** Display/parse patterns for native `Date` values (Material-style). */
export interface PixelDateFormats {
  readonly parse: {
    readonly dateInput: unknown;
  };
  readonly display: {
    readonly dateInput: unknown;
    readonly monthYearLabel: unknown;
    readonly dateA11yLabel: unknown;
    readonly monthYearA11yLabel: unknown;
  };
}

export const PIXEL_DATE_FORMATS = new InjectionToken<PixelDateFormats>('PIXEL_DATE_FORMATS');

/** Defaults aligned with Angular Material `MAT_NATIVE_DATE_FORMATS` (locale numeric input). */
export const PIXEL_NATIVE_DATE_FORMATS: PixelDateFormats = {
  parse: {
    dateInput: null,
  },
  display: {
    dateInput: { year: 'numeric', month: 'numeric', day: 'numeric' },
    monthYearLabel: { month: 'short', year: 'numeric' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { month: 'long', year: 'numeric' },
  },
};

/**
 * Fixed European-style day-first formats. Pass to `provideNativeDateAdapter({ formats })`
 * for app-wide `dd/MM/yyyy` display and typed parse (plus ISO).
 */
export const PIXEL_DD_MM_YYYY_FORMATS: PixelDateFormats = {
  parse: {
    dateInput: ['dd/MM/yyyy', 'd/M/yyyy', 'dd-MM-yyyy', 'd-M-yyyy'],
  },
  display: {
    dateInput: 'dd/MM/yyyy',
    monthYearLabel: { month: 'short', year: 'numeric' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { month: 'long', year: 'numeric' },
  },
};
