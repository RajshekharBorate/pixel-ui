import { Directive, TemplateRef, inject, input } from '@angular/core';

/**
 * Context for a custom inline editor template:
 * `$implicit` = current draft value, `row` = the row, `field` = column field, plus `commit(value?)`
 * and `cancel()` callbacks to end the edit.
 */
export interface PixelDataGridEditorContext<T = any> {
  $implicit: unknown;
  row: T;
  field: string;
  rowIndex: number;
  commit: (value?: unknown) => void;
  cancel: () => void;
}

/**
 * Declares a custom inline cell editor for a column. Place on an `<ng-template>` whose value matches
 * the column `field`; enable editing with `editable` on the grid and the column.
 *
 * @example
 * ```html
 * <ng-template pixelGridEditor="status" let-value let-commit="commit" let-cancel="cancel">
 *   <pixel-select [value]="value" (valueChange)="commit($event)" />
 * </ng-template>
 * ```
 */
@Directive({
  selector: '[pixelGridEditor]',
})
export default class PixelDataGridEditorDirective<T = any> {
  readonly template = inject(TemplateRef<PixelDataGridEditorContext<T>>);

  /** The column `field` this editor renders. */
  readonly field = input.required<string>({ alias: 'pixelGridEditor' });

  static ngTemplateContextGuard<T>(
    _dir: PixelDataGridEditorDirective<T>,
    _ctx: unknown,
  ): _ctx is PixelDataGridEditorContext<T> {
    return true;
  }
}
