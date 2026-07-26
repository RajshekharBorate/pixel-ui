import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';
import PixelButtonComponent, {
  type PixelButtonAppearance,
  type PixelButtonSize,
  type PixelButtonState,
} from '../pixel-button/pixel-button';
import PixelMenuComponent from '../pixel-menu/pixel-menu';
import PixelMenuTriggerDirective from '../pixel-menu/pixel-menu-trigger';

let nextSplitId = 0;

/**
 * Split button: primary action + caret that opens a `pixel-menu`.
 * Compose with a sibling `<pixel-menu #ref>` bound via `[menu]`.
 */
@Component({
  selector: 'pixel-split-button',
  imports: [PixelButtonComponent, PixelMenuTriggerDirective],
  templateUrl: './pixel-split-button.html',
  styleUrl: './pixel-split-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-split-button',
    role: 'group',
    '[attr.data-size]': 'size()',
    '[attr.data-appearance]': 'appearance()',
    '[attr.aria-label]': 'ariaLabel() || null',
    '[class.pixel-split-button--disabled]': 'isDisabled()',
    '[class.pixel-split-button--full-width]': 'fullWidth()',
  },
})
export default class PixelSplitButtonComponent {
  protected readonly fallbackId = `pixel-split-button-${++nextSplitId}`;

  /**
   * Menu opened by the caret.
   * @type {PixelMenuComponent}
   * @description Required sibling menu panel reference.
   */
  readonly menu = input.required<PixelMenuComponent>();

  /**
   * Optional element id prefix.
   * @type {string}
   * @default ''
   * @description Applied to the primary button when set.
   */
  readonly id = input('');

  /**
   * Visual size for both segments.
   * @type {PixelButtonSize}
   * @default 'md'
   * @description Density for primary and caret.
   */
  readonly size = input<PixelButtonSize>('md');

  /**
   * Shared appearance for both segments.
   * @type {PixelButtonAppearance}
   * @default 'solid'
   * @description Prefer solid/outline/tonal for split chrome.
   */
  readonly appearance = input<PixelButtonAppearance>('solid');

  /**
   * Semantic state (loading/disabled/error/success).
   * @type {PixelButtonState}
   * @default 'default'
   * @description Applied to the primary action; caret follows disabled/loading.
   */
  readonly state = input<PixelButtonState>('default');

  /**
   * Force-disables both segments.
   * @type {boolean}
   * @default false
   * @description Overrides interactive state.
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Stretches the control to the container width.
   * @type {boolean}
   * @default false
   * @description Primary expands; caret stays fixed.
   */
  readonly fullWidth = input(false, { transform: booleanAttribute });

  /**
   * Leading icon on the primary segment.
   * @type {string}
   * @default ''
   * @description Material Symbols ligature.
   */
  readonly leadingIcon = input('');

  /**
   * Accessible name for the group when needed.
   * @type {string}
   * @default ''
   * @description Optional group label.
   */
  readonly ariaLabel = input('');

  /**
   * Accessible name for the caret / menu trigger.
   * @type {string}
   * @default 'More options'
   * @description Required for the icon-only caret.
   */
  readonly menuAriaLabel = input('More options');

  /**
   * Caret glyph.
   * @type {string}
   * @default 'expand_more'
   * @description Material Symbols ligature on the menu trigger.
   */
  readonly menuIcon = input('expand_more');

  /**
   * Screen-reader loading label for the primary segment.
   * @type {string}
   * @default 'Loading'
   * @description Announced while primary is loading.
   */
  readonly loadingLabel = input('Loading');

  /** Primary segment activation (mouse or keyboard). */
  readonly click = output<MouseEvent | KeyboardEvent>();

  protected readonly isDisabled = computed(
    () => this.disabled() || this.state() === 'disabled' || this.state() === 'loading',
  );

  protected readonly caretDisabled = computed(
    () => this.disabled() || this.state() === 'disabled' || this.state() === 'loading',
  );

  protected onPrimaryClick(event: MouseEvent | KeyboardEvent): void {
    this.click.emit(event);
  }
}
