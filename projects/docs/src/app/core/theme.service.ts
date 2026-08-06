import { Injectable } from '@angular/core';
import {
  applyPixelTheme,
  initPixelTheme,
  pixelThemeId,
  type PixelThemeId,
  PIXEL_THEME_OPTIONS,
} from 'pixel-ui';

/**
 * Docs / app theme façade over the library reactive theme API.
 * Prefer `applyPixelTheme` / `pixelThemeId` / `pixelThemeVersion` in library code;
 * this service keeps docs UI in sync with the same source of truth.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly options = PIXEL_THEME_OPTIONS;

  /** Mirrors `pixelThemeId` from `pixel-ui` (single source of truth). */
  readonly themeId = pixelThemeId;

  constructor() {
    initPixelTheme('enterprise-light');
  }

  setTheme(themeId: PixelThemeId): void {
    applyPixelTheme(themeId);
  }
}
