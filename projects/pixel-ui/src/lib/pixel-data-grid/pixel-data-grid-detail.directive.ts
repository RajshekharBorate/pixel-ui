import { Directive, TemplateRef, inject } from '@angular/core';

/** Context for a master-detail template: `$implicit` = row, `index` = absolute row index. */
export interface PixelDataGridDetailContext<T = any> {
  $implicit: T;
  index: number;
}

/**
 * Declares the master-detail content rendered beneath an expanded row. Place on an `<ng-template>`;
 * enable with `expandableRows` on the grid.
 *
 * @example
 * ```html
 * <pixel-data-grid [data]="rows()" [columns]="columns" expandableRows>
 *   <ng-template pixelGridDetail let-row>
 *     <div class="detail">{{ row.description }}</div>
 *   </ng-template>
 * </pixel-data-grid>
 * ```
 */
@Directive({
  selector: '[pixelGridDetail]',
  standalone: true,
})
export default class PixelDataGridDetailDirective<T = any> {
  readonly template = inject(TemplateRef<PixelDataGridDetailContext<T>>);

  static ngTemplateContextGuard<T>(
    _dir: PixelDataGridDetailDirective<T>,
    _ctx: unknown,
  ): _ctx is PixelDataGridDetailContext<T> {
    return true;
  }
}
