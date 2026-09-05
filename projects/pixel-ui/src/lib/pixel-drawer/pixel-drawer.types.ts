import { InjectionToken } from '@angular/core';
import type { PixelDrawerPosition, PixelDrawerSize } from './pixel-drawer';
import type { PixelAuthorizationRequest } from '../services/authorization/authorization.types';

/**
 * Configuration for a drawer opened imperatively via {@link PixelDrawerService.open}. Mirrors the
 * inputs of `pixel-drawer`, plus `data` (injected into the opened component through
 * {@link PIXEL_DRAWER_DATA}) and `disableClose` (the inverse of the component's `dismissable`).
 */
export interface PixelDrawerConfig<D = unknown> {
  /** Arbitrary payload made available to the opened component via {@link PIXEL_DRAWER_DATA}. */
  data?: D;

  /** Title rendered in the drawer's default header. Omit to render the component with no header. */
  title?: string;

  /** Edge the drawer slides in from. Defaults to `'end'`. */
  position?: PixelDrawerPosition;

  /** Size preset (width for start/end, height for top/bottom). Defaults to `'md'`. */
  size?: PixelDrawerSize;

  /** When `true`, scrim click, Escape, and the header close button no longer dismiss the drawer. */
  disableClose?: boolean;

  /** Extra class(es) applied to the drawer surface for one-off styling. */
  panelClass?: string;

  /** Accessible label (overrides the title for labelling purposes). */
  ariaLabel?: string;

  /** Space-separated ids describing the drawer body (maps to `aria-describedby`). */
  ariaDescribedBy?: string;

  /**
   * Permission key or full request. When denied (or auth missing while set), `open` returns a
   * ref that closes immediately without mounting content.
   */
  requires?: string | PixelAuthorizationRequest;
}

/**
 * Injection token for the `data` passed to {@link PixelDrawerService.open}. Inject it in the opened
 * component to read the payload:
 *
 * ```ts
 * const data = inject<MyData>(PIXEL_DRAWER_DATA);
 * ```
 */
export const PIXEL_DRAWER_DATA = new InjectionToken<unknown>('PIXEL_DRAWER_DATA');
