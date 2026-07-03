import { Injectable, signal } from '@angular/core';
import {
  applyPixelTheme,
  initPixelTheme,
  type PixelThemeId,
  PIXEL_THEME_OPTIONS,
} from 'pixel-ui';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly options = PIXEL_THEME_OPTIONS;
  readonly themeId = signal<PixelThemeId>(initPixelTheme('enterprise-light'));

  setTheme(themeId: PixelThemeId): void {
    applyPixelTheme(themeId);
    this.themeId.set(themeId);
  }
}
