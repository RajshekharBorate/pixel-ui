// ─── Pixel Title — public surface ──────────────────────────────────────────────

export { PixelTitleService } from './title.service';
export { PixelTitleStrategy } from './title.strategy';
export { providePixelTitle } from './title.provide';
export {
  PIXEL_TITLE_CONFIG,
  PIXEL_TITLE_DEFAULTS,
  PIXEL_TITLE_DEFAULT_LABELS,
  resolvePixelTitleConfig,
} from './title.config';
export type {
  PixelTitleConfig,
  PixelTitleErrorKind,
  PixelTitleFormatFn,
  PixelTitleLabels,
  PixelTitleParts,
  PixelTitleSetOptions,
  ResolvedPixelTitleConfig,
} from './title.config';
export {
  ellipsizeTitle,
  formatPixelTitle,
  normalizeTitleCount,
  sanitizeTitleText,
  truncatePixelTitle,
} from './title.format';
