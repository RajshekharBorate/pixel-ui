import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';
import PixelTooltipDirective from '../pixel-tooltip/pixel-tooltip';
import type {
  PixelEditorBlockKind,
  PixelEditorCountMode,
  PixelEditorSaveState,
} from './pixel-editor.types';

/**
 * Footer status bar for `pixel-editor` (Phase 0 shell / Phase 6 polish).
 */
@Component({
  selector: 'pixel-editor-status-bar',
  imports: [PixelTooltipDirective],
  templateUrl: './pixel-editor-status-bar.html',
  styleUrl: './pixel-editor-status-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-editor-status-bar',
    role: 'status',
    'aria-live': 'polite',
  },
})
export default class PixelEditorStatusBarComponent {
  /**
   * Current block kind for the breadcrumb chip.
   *
   * @type {PixelEditorBlockKind}
   * @default 'paragraph'
   */
  readonly blockKind = input<PixelEditorBlockKind>('paragraph');

  /**
   * Numeric count shown in the footer (words or characters depending on `countMode`).
   *
   * @type {number}
   * @default 0
   */
  readonly count = input(0);

  /**
   * How `count` is interpreted / labeled.
   *
   * @type {PixelEditorCountMode}
   * @default 'words'
   */
  readonly countMode = input<PixelEditorCountMode>('words');

  /**
   * Save indicator state.
   *
   * @type {PixelEditorSaveState}
   * @default 'idle'
   */
  readonly saveState = input<PixelEditorSaveState>('idle');

  /**
   * Relative time label next to save state (e.g. "Just now").
   *
   * @type {string}
   * @default ''
   */
  readonly savedAtLabel = input('');

  /**
   * Whether to show the Pixel Document Format hint.
   *
   * @type {boolean}
   * @default true
   */
  readonly showFormatHint = input(true, { transform: booleanAttribute });

  /**
   * Emits when the user cycles the count mode control.
   *
   * @type {void}
   */
  readonly countModeCycle = output<void>();

  /**
   * Copy document as HTML.
   *
   * @type {void}
   */
  readonly copyHtml = output<void>();

  /**
   * Copy document as Markdown.
   *
   * @type {void}
   */
  readonly copyMarkdown = output<void>();

  protected readonly blockLabel = computed(() => {
    switch (this.blockKind()) {
      case 'heading':
        return 'H';
      case 'list':
        return 'L';
      case 'code':
        return '</>';
      case 'table':
        return 'T';
      case 'panel':
        return 'ℹ';
      case 'unknown':
        return '?';
      default:
        return 'P';
    }
  });

  protected readonly countLabel = computed(() => {
    const n = this.count();
    switch (this.countMode()) {
      case 'characters':
        return `${n} characters`;
      case 'charactersWithSpaces':
        return `${n} characters (with spaces)`;
      default:
        return `${n} words`;
    }
  });

  protected readonly countModeTooltip = computed(() => {
    switch (this.countMode()) {
      case 'characters':
        return 'Character count (no spaces). Click to cycle.';
      case 'charactersWithSpaces':
        return 'Character count (with spaces). Click to cycle.';
      default:
        return 'Word count. Click to cycle.';
    }
  });

  protected readonly saveLabel = computed(() => {
    switch (this.saveState()) {
      case 'saving':
        return 'Saving…';
      case 'saved':
        return 'Draft saved';
      case 'error':
        return 'Save failed';
      default:
        return '';
    }
  });
}
