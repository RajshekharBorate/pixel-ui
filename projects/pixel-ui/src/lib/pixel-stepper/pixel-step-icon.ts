import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * Marks an `<ng-template>` as custom content for a step's indicator — render an avatar, image,
 * inline SVG, or any component in place of the number / Material Symbols glyph. Status glyphs
 * (✓ completed, ! error, spinner, lock) still take precedence so validation feedback is preserved.
 *
 * @example
 * ```html
 * <pixel-step label="Ada">
 *   <ng-template pixelStepIcon>
 *     <pixel-avatar name="Ada Lovelace" size="xs" />
 *   </ng-template>
 * </pixel-step>
 * ```
 */
@Directive({
  selector: '[pixelStepIcon]',
  standalone: true,
})
export default class PixelStepIconDirective {
  /** The captured template, rendered by the step header inside the indicator. */
  readonly templateRef = inject(TemplateRef);
}
