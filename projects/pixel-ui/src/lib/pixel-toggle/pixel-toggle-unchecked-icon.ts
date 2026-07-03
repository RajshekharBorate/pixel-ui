import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * Marks an `<ng-template>` as the thumb icon shown when the switch is unchecked.
 * Pair with `pixelToggleCheckedIcon` for state-specific thumb glyphs.
 *
 * @example
 * ```html
 * <pixel-toggle label="Enable Wifi">
 *   <ng-template pixelToggleCheckedIcon>
 *     <span class="material-symbols-outlined" aria-hidden="true">check</span>
 *   </ng-template>
 *   <ng-template pixelToggleUncheckedIcon>
 *     <span class="material-symbols-outlined" aria-hidden="true">remove</span>
 *   </ng-template>
 * </pixel-toggle>
 * ```
 */
@Directive({
  selector: '[pixelToggleUncheckedIcon]',
  standalone: true,
})
export default class PixelToggleUncheckedIconDirective {
  /** The captured template, rendered inside the thumb when unchecked. */
  readonly templateRef = inject(TemplateRef);
}
