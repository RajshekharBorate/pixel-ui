import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * Context for a projected row quick-actions template:
 * `$implicit` = row, `index` = absolute row index.
 */
export interface PixelDataGridRowActionsContext<T = any> {
  $implicit: T;
  index: number;
}

/**
 * Projects custom content into the floating row quick-actions pill.
 * When present, replaces the declarative `rowQuickActions` renderer for that grid.
 *
 * @example
 * ```html
 * <ng-template pixelGridRowActions let-row let-index="index">
 *   <pixel-button appearance="icon" ariaLabel="Star" leadingIcon="star" (click)="star(row)" />
 * </ng-template>
 * ```
 */
@Directive({
  selector: '[pixelGridRowActions]',
})
export default class PixelDataGridRowActionsDirective<T = any> {
  readonly template = inject(TemplateRef<PixelDataGridRowActionsContext<T>>);

  static ngTemplateContextGuard<T>(
    _dir: PixelDataGridRowActionsDirective<T>,
    _ctx: unknown,
  ): _ctx is PixelDataGridRowActionsContext<T> {
    return true;
  }
}
