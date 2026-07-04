import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * Marks an `<ng-template>` as the thumb icon shown when the switch is checked.
 * Project SVG, Material Symbols, images, or any component in place of a string input.
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
  selector: '[pixelToggleCheckedIcon]',
})
export default class PixelToggleCheckedIconDirective {
  /** The captured template, rendered inside the thumb when checked. */
  readonly templateRef = inject(TemplateRef);
}
