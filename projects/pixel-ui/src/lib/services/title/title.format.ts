import type { PixelTitleParts, ResolvedPixelTitleConfig } from './title.config';

const HTML_TAGS = /<[^>]*>/g;
const NEWLINE_OR_TAB = /[\t\n\r\f\v]/g;
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000E-\u001F\u007F-\u009F]/g;
const COLLAPSE_WS = /\s+/g;

/** Strip tags and C0/C1 controls; turn newlines/tabs into spaces; collapse whitespace. */
export function sanitizeTitleText(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  return value
    .replace(HTML_TAGS, '')
    .replace(NEWLINE_OR_TAB, ' ')
    .replace(CONTROL_CHARS, '')
    .replace(COLLAPSE_WS, ' ')
    .trim();
}

export function normalizeTitleCount(count: number | null | undefined): number | null {
  if (count == null || !Number.isFinite(count) || count <= 0) {
    return null;
  }
  return Math.floor(count);
}

/** Clip `text` to `maxLength`, appending `…` when shortened. */
export function ellipsizeTitle(text: string, maxLength: number): string {
  if (maxLength <= 0) {
    return '';
  }
  if (text.length <= maxLength) {
    return text;
  }
  if (maxLength === 1) {
    return '…';
  }
  return `${text.slice(0, maxLength - 1)}…`;
}

function joinTitleParts(separator: string, ...parts: readonly string[]): string {
  return parts.filter((part) => part.length > 0).join(separator);
}

function composeTitle(
  page: string,
  section: string,
  count: number | null,
  config: ResolvedPixelTitleConfig,
): string {
  const bodyCore = joinTitleParts(config.separator, page, section);
  const badge = count != null ? config.labels.count(count) : '';
  const body = badge ? (bodyCore ? `${badge} ${bodyCore}` : badge) : bodyCore;
  return joinTitleParts(config.separator, config.prefix, body, config.suffix);
}

/**
 * Prefer shortening `page`, then drop `section`, then clip the remainder. Brand
 * (`prefix` / `suffix`) is kept when it still fits in `maxLength`.
 */
export function truncatePixelTitle(
  page: string,
  section: string,
  count: number | null,
  config: ResolvedPixelTitleConfig,
): string {
  const max = config.maxLength;
  const composed = composeTitle(page, section, count, config);
  if (composed.length <= max) {
    return composed;
  }

  const fits = (nextPage: string, nextSection: string): boolean =>
    composeTitle(nextPage, nextSection, count, config).length <= max;

  if (page) {
    if (fits(page, section)) {
      return composeTitle(page, section, count, config);
    }
    for (let keep = page.length - 1; keep >= 1; keep--) {
      const shortened = `${page.slice(0, keep)}…`;
      if (fits(shortened, section)) {
        return composeTitle(shortened, section, count, config);
      }
    }
    if (fits('…', section)) {
      return composeTitle('…', section, count, config);
    }
  }

  if (section) {
    const withoutSection = truncatePixelTitle(page, '', count, config);
    if (withoutSection.length <= max) {
      return withoutSection;
    }
  }

  const withoutPage = composeTitle('', '', count, config);
  if (withoutPage.length <= max) {
    return withoutPage;
  }

  return ellipsizeTitle(composed, max);
}

/**
 * Build the document title string from parts + config. Empty `page` falls back to
 * `defaultTitle`. Does not read `document` / `window`.
 */
export function formatPixelTitle(
  parts: PixelTitleParts,
  config: ResolvedPixelTitleConfig,
): string {
  const requestedPage = sanitizeTitleText(parts.page);
  const page = requestedPage || sanitizeTitleText(config.defaultTitle);
  const section = sanitizeTitleText(parts.section);
  const count = normalizeTitleCount(parts.count);
  const prefix = sanitizeTitleText(config.prefix);
  const suffix = sanitizeTitleText(config.suffix);
  const resolved: ResolvedPixelTitleConfig = { ...config, prefix, suffix };

  if (config.format) {
    const custom = sanitizeTitleText(config.format({ ...parts, page, section, count }, resolved));
    const fallback = truncatePixelTitle(page, section, count, resolved);
    return ellipsizeTitle(custom || fallback, resolved.maxLength);
  }

  return truncatePixelTitle(page, section, count, resolved);
}
