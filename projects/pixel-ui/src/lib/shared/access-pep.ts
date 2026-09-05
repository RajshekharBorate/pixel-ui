import { InjectionToken, type Signal } from '@angular/core';

/**
 * Optional same-host PEP from `[pixelAccess]`. Pixel controls inject this with
 * `{ optional: true, self: true }` so deny can drive `disabled` / `readonly`
 * without importing the authorization engine.
 *
 * The token file must stay free of `PixelAuthorizationService`.
 */
export interface PixelAccessPep {
  /** Hide the host (denied + hide mode, after pending). */
  readonly hidden: Signal<boolean>;
  /** Non-interactive (denied + disable, or hide as defense-in-depth). */
  readonly disabled: Signal<boolean>;
  /** Native readonly on fields (denied + readonly mode). */
  readonly readonly: Signal<boolean>;
}

export const PIXEL_ACCESS_PEP = new InjectionToken<PixelAccessPep>('PIXEL_ACCESS_PEP');
