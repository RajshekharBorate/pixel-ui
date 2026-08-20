import { inject, LOCALE_ID, Provider } from '@angular/core';
import { PixelDateAdapter, PIXEL_DATE_ADAPTER, PIXEL_DATE_LOCALE } from './pixel-date-adapter';
import { PixelDateFormats, PIXEL_DATE_FORMATS, PIXEL_NATIVE_DATE_FORMATS } from './pixel-date-formats';
import { PixelNativeDateAdapter } from './pixel-native-date-adapter';

export interface ProvideNativeDateAdapterOptions {
  readonly locale?: string;
  /**
   * Pass `'localeId'` to derive the locale from Angular's `LOCALE_ID` token.
   * Only use this when the app explicitly provides `LOCALE_ID` (e.g. via `{ provide: LOCALE_ID, useValue: 'fr-FR' }`).
   * If `locale` is also set, `locale` wins.
   *
   * **Do not** use this as a default — `LOCALE_ID` is always `'en-US'` unless the app changes it.
   */
  readonly localeFrom?: 'localeId';
  readonly formats?: PixelDateFormats;
}

/** App-level locale strategy for calendar date display and parsing. */
export type ProvidePixelDateLocaleStrategy =
  | { readonly strategy: 'browser' }
  | { readonly strategy: 'localeId' }
  | { readonly strategy: 'fixed'; readonly locale: string; readonly formats?: PixelDateFormats };

export type ProvidePixelDateLocaleOptions = ProvidePixelDateLocaleStrategy;

/**
 * Registers date adapter providers with an explicit locale strategy.
 *
 * - `browser` (default) — viewer Intl; no `PIXEL_DATE_LOCALE` override.
 * - `localeId` — derive from Angular `LOCALE_ID` (pair with `{ provide: LOCALE_ID, useValue: '…' }`).
 * - `fixed` — explicit BCP-47 locale and optional formats (e.g. `PIXEL_DD_MM_YYYY_FORMATS`).
 */
export function providePixelDateLocale(
  options: ProvidePixelDateLocaleOptions = { strategy: 'browser' },
): Provider[] {
  switch (options.strategy) {
    case 'browser':
      return provideNativeDateAdapter();
    case 'localeId':
      return provideNativeDateAdapter({ localeFrom: 'localeId' });
    case 'fixed':
      return provideNativeDateAdapter({ locale: options.locale, formats: options.formats });
  }
}

/** Registers the native `Date` adapter for calendar, datepicker, and range pickers. */
export function provideNativeDateAdapter(
  options: ProvideNativeDateAdapterOptions = {},
): Provider[] {
  const localeProvider: Provider[] = [];
  if (options.locale !== undefined) {
    localeProvider.push({ provide: PIXEL_DATE_LOCALE, useValue: options.locale });
  } else if (options.localeFrom === 'localeId') {
    localeProvider.push({
      provide: PIXEL_DATE_LOCALE,
      useFactory: () => inject(LOCALE_ID),
    });
  }
  return [
    { provide: PIXEL_DATE_ADAPTER, useClass: PixelNativeDateAdapter },
    { provide: PIXEL_DATE_FORMATS, useValue: options.formats ?? PIXEL_NATIVE_DATE_FORMATS },
    ...localeProvider,
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
