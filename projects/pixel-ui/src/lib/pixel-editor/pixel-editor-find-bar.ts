import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';
import PixelButtonComponent from '../pixel-button/pixel-button';
import PixelCheckboxComponent from '../pixel-checkbox/pixel-checkbox';
import PixelInputComponent from '../pixel-input/pixel-input';
import PixelTooltipDirective from '../pixel-tooltip/pixel-tooltip';
import {
  DEFAULT_PIXEL_EDITOR_LABELS,
  pixelEditorFormatLabel,
  type PixelEditorLabels,
} from './pixel-editor-labels';

/**
 * Find & replace panel for `pixel-editor` (toolbar popover).
 */
@Component({
  selector: 'pixel-editor-find-bar',
  imports: [PixelButtonComponent, PixelCheckboxComponent, PixelInputComponent, PixelTooltipDirective],
  templateUrl: './pixel-editor-find-bar.html',
  styleUrl: './pixel-editor-find-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-editor-find-bar',
    role: 'search',
    '[attr.aria-label]': 'l().findAndReplace',
  },
})
export default class PixelEditorFindBarComponent {
  /**
   * Resolved i18n labels.
   *
   * @type {PixelEditorLabels}
   * @default DEFAULT_PIXEL_EDITOR_LABELS
   */
  readonly labels = input<PixelEditorLabels>(DEFAULT_PIXEL_EDITOR_LABELS);

  protected readonly l = computed(() => this.labels());

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
   * Case-sensitive matching.
   *
   * @type {boolean}
   * @default false
   */
  readonly matchCase = input(false, { transform: booleanAttribute });

  /**
   * Match whole words only.
   *
   * @type {boolean}
   * @default false
   */
  readonly matchWholeWord = input(false, { transform: booleanAttribute });

  /**
   * Disables controls.
   *
   * @type {boolean}
   * @default false
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly findQueryChange = output<string>();
  readonly replaceQueryChange = output<string>();
  readonly matchCaseChange = output<boolean>();
  readonly matchWholeWordChange = output<boolean>();
  readonly findNext = output<void>();
  readonly findPrev = output<void>();
  readonly replace = output<void>();
  readonly replaceAll = output<void>();
  /** Optional — host may close via Esc / outside click; close control removed from UI. */
  readonly close = output<void>();

  /** Shown only when a query is present (`N of M` / `No matches`). */
  protected matchStatus(): string | null {
    if (!this.findQuery().trim()) return null;
    const l = this.l();
    const count = this.matchCount();
    if (count === 0) return l.findNoMatches;
    return pixelEditorFormatLabel(l.findMatchStatus, {
      index: this.matchIndex(),
      count,
    });
  }
}
