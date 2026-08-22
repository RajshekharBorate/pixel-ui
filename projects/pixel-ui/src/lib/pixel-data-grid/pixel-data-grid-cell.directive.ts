import { Directive, TemplateRef, inject, input } from '@angular/core';

/**
 * Context exposed to a custom cell template:
 * `$implicit` = row, `value` = the cell value, `index` = row index, `field` = column field.
 */
export interface PixelDataGridCellContext<T = any> {
  $implicit: T;
  value: unknown;
  index: number;
  field: string;
  /** Mirrors the grid's `cellTooltipWhenTruncated` for `pixelGridCellOverflow` bindings. */
  overflowTooltip: boolean;
}

/**
 * Declares a custom cell renderer for a column. Place on an `<ng-template>` whose value matches
 * the column `field`.
 *
 * @example
 * ```html
 * <ng-template pixelGridCell="status" let-row let-value="value">
 *   <pixel-chip [semantic]="row.tone">{{ value }}</pixel-chip>
 * </ng-template>
 * ```
 */
@Directive({
  selector: '[pixelGridCell]',
})
export default class PixelDataGridCellDirective<T = any> {
  readonly template = inject(TemplateRef<PixelDataGridCellContext<T>>);

  /** The column `field` this template renders. */
  readonly field = input.required<string>({ alias: 'pixelGridCell' });

  static ngTemplateContextGuard<T>(
    _dir: PixelDataGridCellDirective<T>,
    _ctx: unknown,
  ): _ctx is PixelDataGridCellContext<T> {
    return true;
  }
}
