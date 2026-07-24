import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import PixelButtonComponent from '../pixel-button/pixel-button';
import PixelTooltipDirective from '../pixel-tooltip/pixel-tooltip';
import PixelDividerComponent from '../pixel-divider/pixel-divider';

/**
 * Contextual chrome when the selection is inside a table.
 */
@Component({
  selector: 'pixel-editor-table-toolbar',
  imports: [PixelButtonComponent, PixelTooltipDirective, PixelDividerComponent],
  templateUrl: './pixel-editor-table-toolbar.html',
  styleUrl: './pixel-editor-table-toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-editor-table-toolbar',
    role: 'toolbar',
    'aria-label': 'Table formatting',
  },
})
export default class PixelEditorTableToolbarComponent {
  /**
   * Whether the toolbar controls are disabled.
   *
   * @type {boolean}
   * @default false
   */
  readonly disabled = input(false);

  readonly addRow = output<void>();
  readonly addColumn = output<void>();
  readonly deleteRow = output<void>();
  readonly deleteColumn = output<void>();
  readonly toggleHeader = output<void>();
  readonly deleteTable = output<void>();
}
