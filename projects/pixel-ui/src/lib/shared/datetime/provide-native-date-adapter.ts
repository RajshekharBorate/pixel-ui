import { inject, Provider } from '@angular/core';
import { PixelDateAdapter, PIXEL_DATE_ADAPTER, PIXEL_DATE_LOCALE } from './pixel-date-adapter';
import { PixelDateFormats, PIXEL_DATE_FORMATS, PIXEL_NATIVE_DATE_FORMATS } from './pixel-date-formats';
import { PixelNativeDateAdapter } from './pixel-native-date-adapter';

export interface ProvideNativeDateAdapterOptions {
  readonly locale?: string;
  readonly formats?: PixelDateFormats;
}

/** Registers the native `Date` adapter for calendar, datepicker, and range pickers. */
export function provideNativeDateAdapter(
  options: ProvideNativeDateAdapterOptions = {},
): Provider[] {
  return [
    { provide: PIXEL_DATE_ADAPTER, useClass: PixelNativeDateAdapter },
    { provide: PIXEL_DATE_FORMATS, useValue: options.formats ?? PIXEL_NATIVE_DATE_FORMATS },
    ...(options.locale !== undefined ? [{ provide: PIXEL_DATE_LOCALE, useValue: options.locale }] : []),
  ];
}

/** Convenience providers for component-level DI. */
export function nativeDateAdapterProviders(): Provider[] {
  return [
    { provide: PIXEL_DATE_ADAPTER, useClass: PixelNativeDateAdapter },
    { provide: PIXEL_DATE_FORMATS, useValue: PIXEL_NATIVE_DATE_FORMATS },
  ];
}

export function injectDateAdapter(): PixelDateAdapter<Date> {
  return inject(PIXEL_DATE_ADAPTER) as PixelDateAdapter<Date>;
}
