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

export const PIXEL_NATIVE_DATE_FORMATS: PixelDateFormats = {
  parse: {
    dateInput: null,
  },
  display: {
    dateInput: { dateStyle: 'medium' },
    monthYearLabel: { month: 'short', year: 'numeric' },
    dateA11yLabel: { dateStyle: 'full' },
    monthYearA11yLabel: { month: 'long', year: 'numeric' },
  },
};
