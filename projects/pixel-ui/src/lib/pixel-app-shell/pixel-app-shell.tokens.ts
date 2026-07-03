import { InjectionToken, Signal } from '@angular/core';

/**
 * Context a `pixel-app-shell` provides to a projected `pixel-header`/`pixel-sidenav` so they can
 * avoid drawing their own independently-painted border/sticky mechanics when the shell's own
 * unified toolbar-divider and sticky wrapper already handle it — see `pixel-app-shell.scss`'s
 * `.pixel-app-shell__toolbar-divider` and `.pixel-app-shell__header--sticky`.
 */
export interface PixelAppShellContext {
  /**
   * True once the shell has detected a projected `pixel-header` and is drawing its toolbar-divider
   * across both the header and the sidenav's `pixelSidenavBrand` region.
   */
  readonly hasHeader: Signal<boolean>;
}

export const PIXEL_APP_SHELL = new InjectionToken<PixelAppShellContext>('PIXEL_APP_SHELL');
