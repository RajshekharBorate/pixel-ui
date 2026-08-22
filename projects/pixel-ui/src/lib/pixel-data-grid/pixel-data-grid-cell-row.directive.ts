import { Directive } from '@angular/core';

/**
 * Flex row wrapper for composite custom cells (avatar + label, icon + text).
 *
 * Pair with {@link PixelDataGridCellOverflowDirective} on the truncating text leaf.
 *
 * @example
 * ```html
 * <ng-template pixelGridCell="name" let-value="value">
 *   <span pixelGridCellRow>
 *     <span class="avatar" aria-hidden="true">A</span>
 *     <span pixelGridCellOverflow [pixelGridCellOverflow]="value">{{ value }}</span>
 *   </span>
 * </ng-template>
 * ```
 */
@Directive({
  selector: '[pixelGridCellRow]',
  host: {
    class: 'pixel-data-grid__cell-row',
  },
})
export default class PixelDataGridCellRowDirective {}
