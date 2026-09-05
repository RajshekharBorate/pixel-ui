import { InjectionToken } from '@angular/core';
import type { PixelDialogPosition, PixelDialogRole, PixelDialogSize } from './pixel-dialog';
import type { PixelAuthorizationRequest } from '../services/authorization/authorization.types';

/**
 * Configuration for a dialog opened imperatively via {@link PixelDialogService.open}. Mirrors the
 * inputs of `pixel-dialog`, plus `data` (injected into the opened component through
 * {@link PIXEL_DIALOG_DATA}) and `disableClose` (the inverse of the component's `dismissable`).
 */
export interface PixelDialogConfig<D = unknown> {
  /** Arbitrary payload made available to the opened component via {@link PIXEL_DIALOG_DATA}. */
  data?: D;

  /** Title rendered in the dialog's default header. Omit to render the component with no header. */
  title?: string;

  /** Dialog size preset. Defaults to `'md'`. */
  size?: PixelDialogSize;

  /** Placement: a centered modal or a bottom-anchored sheet. Defaults to `'center'`. */
  position?: PixelDialogPosition;

  /** ARIA role — use `'alertdialog'` for confirmations. Defaults to `'dialog'`. */
  role?: PixelDialogRole;

  /** When `true`, scrim click, Escape, and the header close button no longer dismiss the dialog. */
  disableClose?: boolean;

  /** Extra class(es) applied to the dialog surface for one-off styling. */
  panelClass?: string;

  /** Accessible label (overrides the title for labelling purposes). */
  ariaLabel?: string;

  /** Space-separated ids describing the dialog body (maps to `aria-describedby`). */
  ariaDescribedBy?: string;

  /**
   * Permission key or full request. When denied (or auth missing while set), `open` returns a
   * ref that closes immediately without mounting content.
   */
  requires?: string | PixelAuthorizationRequest;
}

/**
 * Injection token for the `data` passed to {@link PixelDialogService.open}. Inject it in the opened
 * component to read the payload:
 *
 * ```ts
 * const data = inject<MyData>(PIXEL_DIALOG_DATA);
 * ```
 */
export const PIXEL_DIALOG_DATA = new InjectionToken<unknown>('PIXEL_DIALOG_DATA');
