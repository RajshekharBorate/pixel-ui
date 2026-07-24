import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
  output,
} from '@angular/core';
import PixelButtonComponent from '../pixel-button/pixel-button';
import PixelInputComponent from '../pixel-input/pixel-input';
import PixelTooltipDirective from '../pixel-tooltip/pixel-tooltip';

/**
 * Find & replace strip for `pixel-editor` (Phase 5b).
 */
@Component({
  selector: 'pixel-editor-find-bar',
  imports: [PixelButtonComponent, PixelInputComponent, PixelTooltipDirective],
  templateUrl: './pixel-editor-find-bar.html',
  styleUrl: './pixel-editor-find-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-editor-find-bar',
    role: 'search',
    'aria-label': 'Find and replace',
  },
})
export default class PixelEditorFindBarComponent {
  /**
   * Find query.
   *
   * @type {string}
   * @default ''
   */
  readonly findQuery = input('');

  /**
   * Replace query.
   *
   * @type {string}
   * @default ''
   */
  readonly replaceQuery = input('');

  /**
   * Current match index (1-based for display; 0 when none).
   *
   * @type {number}
   * @default 0
   */
  readonly matchIndex = input(0);

  /**
   * Total matches.
   *
   * @type {number}
   * @default 0
   */
  readonly matchCount = input(0);

  /**
   * Disables controls.
   *
   * @type {boolean}
   * @default false
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly findQueryChange = output<string>();
  readonly replaceQueryChange = output<string>();
  readonly findNext = output<void>();
  readonly findPrev = output<void>();
  readonly replace = output<void>();
  readonly replaceAll = output<void>();
  readonly close = output<void>();

  protected matchStatus(): string {
    const count = this.matchCount();
    if (!this.findQuery().trim()) return 'Enter text to find';
    if (count === 0) return 'No matches';
    return `${this.matchIndex()} of ${count}`;
  }
}
