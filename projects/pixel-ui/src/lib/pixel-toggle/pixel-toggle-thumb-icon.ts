import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Material Symbols glyph sized for a `pixel-toggle` switch thumb.
 * Use inside `<ng-template pixelToggleCheckedIcon>` / `pixelToggleUncheckedIcon>`.
 *
 * @example
 * ```html
 * <pixel-toggle label="Enable Wifi">
 *   <ng-template pixelToggleCheckedIcon>
 *     <pixel-toggle-thumb-icon icon="check" />
 *   </ng-template>
 *   <ng-template pixelToggleUncheckedIcon>
 *     <pixel-toggle-thumb-icon icon="remove" />
 *   </ng-template>
 * </pixel-toggle>
 * ```
 */
@Component({
  selector: 'pixel-toggle-thumb-icon',
  standalone: true,
  template: `
    <span class="pixel-toggle-thumb-icon__glyph material-symbols-outlined" aria-hidden="true">{{
      icon()
    }}</span>
  `,
  styleUrl: './pixel-toggle-thumb-icon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-toggle-thumb-icon',
    '[attr.aria-hidden]': 'true',
  },
})
export default class PixelToggleThumbIconComponent {
  /** Material Symbols glyph name (ligature text). */
  readonly icon = input.required<string>();
}
