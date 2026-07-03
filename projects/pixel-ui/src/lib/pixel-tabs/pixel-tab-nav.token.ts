import { InjectionToken, type Signal } from '@angular/core';
import type { PixelTabsAlign, PixelTabsAppearance } from './pixel-tabs';

/**
 * Shared config a `pixel-tab-nav` exposes to its projected `pixel-tab-link` children so each link
 * can style its own host (pill vs underline, stretch). Provided via a token rather than the
 * component type to avoid a circular import between the nav and the link.
 */
export interface PixelTabNavConfig {
  readonly appearance: Signal<PixelTabsAppearance>;
  readonly align: Signal<PixelTabsAlign>;
}

export const PIXEL_TAB_NAV = new InjectionToken<PixelTabNavConfig>('PIXEL_TAB_NAV');
