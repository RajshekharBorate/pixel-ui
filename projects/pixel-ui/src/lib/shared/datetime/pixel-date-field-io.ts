import { inject } from '@angular/core';
import { PixelDateAdapter, PIXEL_DATE_ADAPTER, PIXEL_DATE_LOCALE } from './pixel-date-adapter';
import { PixelDateFormats, PIXEL_DATE_FORMATS } from './pixel-date-formats';
import {
  defaultFormatDate,
  defaultParseDate,
  formatDateBySpec,
  formatHintFromDisplaySpec,
  parseDateBySpec,
} from './pixel-date-utils';

/** Optional DI handles used by datepicker / range field format + parse. */
export interface PixelDateFieldIoContext {
  readonly adapter: PixelDateAdapter<Date> | null;
  readonly formats: PixelDateFormats | null;
  readonly injectedLocale: string | undefined;
}

export function injectDateFieldIoContext(): PixelDateFieldIoContext {
  return {
    adapter: (inject(PIXEL_DATE_ADAPTER, { optional: true }) as PixelDateAdapter<Date> | null) ?? null,
    formats: inject(PIXEL_DATE_FORMATS, { optional: true }) ?? null,
    injectedLocale: inject(PIXEL_DATE_LOCALE, { optional: true }) ?? undefined,
  };
}

export function resolveDateFieldLocale(
  inputLocale: string | undefined,
  injectedLocale: string | undefined,
): string | undefined {
  return inputLocale ?? injectedLocale;
}

/**
 * Priority: custom `displayWith` → adapter + formats → formats alone → `defaultFormatDate`.
 * Custom means any function other than the library `defaultFormatDate` reference.
 */
export function formatDateFieldValue(
  date: Date,
  displayWith: (date: Date, locale?: string) => string,
  locale: string | undefined,
  io: PixelDateFieldIoContext,
): string {
  if (displayWith !== defaultFormatDate) {
    return displayWith(date, locale);
  }
  const displayFormat = io.formats?.display.dateInput ?? null;
  if (io.adapter) {
    return io.adapter.format(date, displayFormat);
  }
  return formatDateBySpec(date, displayFormat, locale);
}

/**
 * Priority: custom `parseValue` → adapter.parse(format) → formats alone → `defaultParseDate`.
 */
export function parseDateFieldValue(
  text: string,
  parseValue: (text: string, locale?: string) => Date | null,
  locale: string | undefined,
  io: PixelDateFieldIoContext,
): Date | null {
  if (parseValue !== defaultParseDate) {
    return parseValue(text, locale);
  }
  const parseFormat = io.formats?.parse.dateInput ?? null;
  if (io.adapter) {
    return io.adapter.parse(text, parseFormat) as Date | null;
  }
  return parseDateBySpec(text, parseFormat, locale);
}

/**
 * Resolve format hint: explicit override → display pattern / locale order when `showFormatHint`.
 */
export function resolveDateFieldFormatHint(
  formatHint: string,
  showFormatHint: boolean,
  locale: string | undefined,
  io: PixelDateFieldIoContext,
): string {
  const explicit = formatHint.trim();
  if (explicit) {
    return explicit;
  }
  if (!showFormatHint) {
    return '';
  }
  return formatHintFromDisplaySpec(io.formats?.display.dateInput ?? null, locale);
}
