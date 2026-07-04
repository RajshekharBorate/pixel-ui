import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * Marks a template as the rich header label for its enclosing `pixel-tab`, overriding the plain
 * `label` / `icon` inputs. Use it for badges, counts, avatars, or any custom markup.
 *
 * @example
 * ```html
 * <pixel-tab>
 *   <ng-template pixelTabLabel>
 *     Inbox <pixel-chip size="sm">12</pixel-chip>
 *   </ng-template>
 *   …panel content…
 * </pixel-tab>
 * ```
 */
@Directive({
  selector: '[pixelTabLabel]',
})
export default class PixelTabLabelDirective {
  readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
}
