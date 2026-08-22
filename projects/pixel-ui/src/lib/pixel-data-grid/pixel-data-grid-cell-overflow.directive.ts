import { Directive, booleanAttribute, input } from '@angular/core';
import PixelTooltipDirective from '../pixel-tooltip/pixel-tooltip';

/**
 * Ellipsis + overflow tooltip helper for custom `pixelGridCell` templates.
 *
 * Applies `.pixel-data-grid__cell-value` and composes {@link PixelTooltipDirective} with
 * `pixelTooltipShowOnOverflow`. Tooltip text defaults to the host's trimmed text when
 * `pixelGridCellOverflow` is empty.
 *
 * Disable via `pixelGridCellOverflowDisabled` or the grid's `cellTooltipWhenTruncated` input
 * (bind `[pixelGridCellOverflowDisabled]="!overflowTooltip"` from the cell context).
 *
 * @example
 * ```html
 * <span pixelGridCellRow>
 *   <span class="avatar" aria-hidden="true">A</span>
 *   <span pixelGridCellOverflow [pixelGridCellOverflow]="value">{{ value }}</span>
 * </span>
 * ```
 */
@Directive({
  selector: '[pixelGridCellOverflow]',
  host: {
    class: 'pixel-data-grid__cell-value',
    '[attr.data-pixel-grid-cell-overflow]': 'showOnOverflow() ? "" : null',
  },
  hostDirectives: [
    {
      directive: PixelTooltipDirective,
      inputs: [
        'pixelTooltip: pixelGridCellOverflow',
        'pixelTooltipDisabled: pixelGridCellOverflowDisabled',
      ],
    },
  ],
})
export default class PixelDataGridCellOverflowDirective {
  /**
   * @type {string}
   * @default ''
   * @description Tooltip message. When empty, the host's own trimmed text is used.
   */
  readonly tooltip = input('', { alias: 'pixelGridCellOverflow' });

  /**
   * @type {boolean}
   * @default true
   * @description Forwards to `pixelTooltipShowOnOverflow` (enabled by default).
   */
  readonly showOnOverflow = input(true, {
    alias: 'pixelGridCellOverflowShowOnOverflow',
    transform: booleanAttribute,
  });

  /**
   * @type {boolean}
   * @default false
   * @description Suppresses the overflow tooltip. Bind `!overflowTooltip` from the cell context
   * to honor the grid's `cellTooltipWhenTruncated` setting.
   */
  readonly disabled = input(false, {
    alias: 'pixelGridCellOverflowDisabled',
    transform: booleanAttribute,
  });
}
