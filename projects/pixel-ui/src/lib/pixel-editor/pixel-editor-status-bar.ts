import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import PixelTooltipDirective from '../pixel-tooltip/pixel-tooltip';
import type { PixelEditorBlockKind, PixelEditorSaveState } from './pixel-editor.types';

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
   * Word count shown in the footer.
   *
   * @type {number}
   * @default 0
   */
  readonly wordCount = input(0);

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
