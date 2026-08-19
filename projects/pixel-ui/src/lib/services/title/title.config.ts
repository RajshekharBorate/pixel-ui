import { InjectionToken } from '@angular/core';

/**
 * Structured title parts. `count` is tab-only UX (unread badge); omit it when `≤ 0`.
 * Query / hash filters do not belong here.
 */
export interface PixelTitleParts {
  /** Primary page name (truncated first when the composed title exceeds `maxLength`). */
  readonly page?: string | null;
  /** Optional subsection after the page (`Inbox · Security`). */
  readonly section?: string | null;
  /** Unread / pending count shown as `(n)` before the page. Ignored when `≤ 0`. */
  readonly count?: number | null;
}

/** Kind passed to {@link PixelTitleService.setError}. */
export type PixelTitleErrorKind = 'not-found' | 'forbidden' | 'error';

/** Overridable copy for error titles and the count badge. */
export interface PixelTitleLabels {
  /** @default `'Page not found'` */
  readonly notFound: string;
  /** @default `'Access denied'` */
  readonly forbidden: string;
  /** @default `'Something went wrong'` */
  readonly error: string;
  /** Formats a positive count. @default `(n) => \`(${n})\`` */
  readonly count: (n: number) => string;
}

/**
 * Optional complete-composition hook. The result is still sanitized and clipped to
 * `maxLength` as a whole (page-first truncation cannot run on an opaque string).
 */
export type PixelTitleFormatFn = (
  parts: PixelTitleParts,
  config: ResolvedPixelTitleConfig,
) => string;

/** Optional extras for {@link PixelTitleService.set}. */
export interface PixelTitleSetOptions {
  /**
   * When set, the write is ignored if it does not match the last successful Router
   * navigation id (stale async resolvers).
   */
  readonly navigationId?: number;
}

/**
 * App-level title defaults. `suffix` / `prefix` are brand strings **without** the
 * separator (`'Acme'`, not `' · Acme'`).
 */
export interface PixelTitleConfig {
  /** Brand (or locale) prepended before the page. */
  readonly prefix?: string;
  /** Brand appended after the page. Preferred over prefix for tab readability. */
  readonly suffix?: string;
  /** Joiner between prefix / page / section / suffix. @default `' · '` */
  readonly separator?: string;
  /** Clip composed title to this length (OS tabs clip independently). @default `60` */
  readonly maxLength?: number;
  /** Used by {@link PixelTitleService.reset} and empty `page` fallback. */
  readonly defaultTitle?: string;
  /**
   * When true, replace Angular's `TitleStrategy` so route `title` values run through
   * this formatter. Do not also subscribe to Router events. @default `false`
   */
  readonly syncRouterTitle?: boolean;
  /** Debounce for count-only updates to avoid tab flicker. @default `1000` */
  readonly countDebounceMs?: number;
  /** Error copy and count badge. Pass localized strings from the app. */
  readonly labels?: Partial<PixelTitleLabels>;
  /** Replace default composition (sanitize + maxLength still apply). */
  readonly format?: PixelTitleFormatFn;
}

export interface ResolvedPixelTitleConfig {
  readonly prefix: string;
  readonly suffix: string;
  readonly separator: string;
  readonly maxLength: number;
  readonly defaultTitle: string;
  readonly syncRouterTitle: boolean;
  readonly countDebounceMs: number;
  readonly labels: PixelTitleLabels;
  readonly format?: PixelTitleFormatFn;
}

export const PIXEL_TITLE_DEFAULT_LABELS: PixelTitleLabels = {
  notFound: 'Page not found',
  forbidden: 'Access denied',
  error: 'Something went wrong',
  count: (n: number) => `(${n})`,
};

export const PIXEL_TITLE_DEFAULTS: ResolvedPixelTitleConfig = {
  prefix: '',
  suffix: '',
  separator: ' · ',
  maxLength: 60,
  defaultTitle: '',
  syncRouterTitle: false,
  countDebounceMs: 1000,
  labels: PIXEL_TITLE_DEFAULT_LABELS,
};

/** Optional partial defaults for {@link PixelTitleService}. */
export const PIXEL_TITLE_CONFIG = new InjectionToken<PixelTitleConfig>('PIXEL_TITLE_CONFIG');

export function resolvePixelTitleConfig(
  partial?: PixelTitleConfig | null,
): ResolvedPixelTitleConfig {
  return {
    ...PIXEL_TITLE_DEFAULTS,
    ...partial,
    prefix: partial?.prefix ?? PIXEL_TITLE_DEFAULTS.prefix,
    suffix: partial?.suffix ?? PIXEL_TITLE_DEFAULTS.suffix,
    separator: partial?.separator ?? PIXEL_TITLE_DEFAULTS.separator,
    maxLength: partial?.maxLength ?? PIXEL_TITLE_DEFAULTS.maxLength,
    defaultTitle: partial?.defaultTitle ?? PIXEL_TITLE_DEFAULTS.defaultTitle,
    syncRouterTitle: partial?.syncRouterTitle ?? PIXEL_TITLE_DEFAULTS.syncRouterTitle,
    countDebounceMs: partial?.countDebounceMs ?? PIXEL_TITLE_DEFAULTS.countDebounceMs,
    labels: { ...PIXEL_TITLE_DEFAULT_LABELS, ...partial?.labels },
    format: partial?.format,
  };
}
