import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
} from '@angular/core';
import type { PixelButtonAppearance, PixelButtonSize } from '../pixel-button/pixel-button';

export type PixelButtonGroupOrientation = 'horizontal' | 'vertical';

let nextGroupId = 0;

/**
 * Joined group of `pixel-button` actions with shared size/appearance chrome.
 * Projects `pixel-button` children; does not manage selection (use `pixel-toggle`
 * segmented mode for exclusive options).
 */
@Component({
  selector: 'pixel-button-group',
  templateUrl: './pixel-button-group.html',
  styleUrl: './pixel-button-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-button-group',
    role: 'group',
    '[attr.data-size]': 'size()',
    '[attr.data-appearance]': 'appearance()',
    '[attr.data-orientation]': 'orientation()',
    '[attr.aria-label]': 'ariaLabel() || null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[class.pixel-button-group--disabled]': 'disabled()',
    '[class.pixel-button-group--full-width]': 'fullWidth()',
    '[class.pixel-button-group--vertical]': 'orientation() === "vertical"',
  },
})
export default class PixelButtonGroupComponent {
  protected readonly fallbackId = `pixel-button-group-${++nextGroupId}`;

  /**
   * Optional element id.
   * @type {string}
   * @default ''
   * @description Stable id for labels and tests.
   */
  readonly id = input('');

  /**
   * Visual size applied as a data attribute for CSS (children keep their own size unless styled).
   * @type {PixelButtonSize}
   * @default 'md'
   * @description Density for joined border geometry.
   */
  readonly size = input<PixelButtonSize>('md');

  /**
   * Appearance hint for joined chrome (outline collapse works best with outline/solid).
   * @type {PixelButtonAppearance}
   * @default 'outline'
   * @description Styling hook for group border treatment.
   */
  readonly appearance = input<PixelButtonAppearance>('outline');

  /**
   * Layout direction.
   * @type {PixelButtonGroupOrientation}
   * @default 'horizontal'
   * @description Horizontal row or vertical stack of joined buttons.
   */
  readonly orientation = input<PixelButtonGroupOrientation>('horizontal');

  /**
   * Disables pointer interaction on the group surface (set disabled on children too).
   * @type {boolean}
   * @default false
   * @description Marks the group unavailable.
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Stretches the group to the container width.
   * @type {boolean}
   * @default false
   * @description Full-width toolbar groups.
   */
  readonly fullWidth = input(false, { transform: booleanAttribute });

  /**
   * Accessible name for the group.
   * @type {string}
   * @default ''
   * @description Required when the group has no visible legend.
   */
  readonly ariaLabel = input('');
}
