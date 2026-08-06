import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import PixelButtonComponent from '../pixel-button/pixel-button';
import PixelTooltipDirective from '../pixel-tooltip/pixel-tooltip';
import PixelDividerComponent from '../pixel-divider/pixel-divider';
import PixelMenuComponent from '../pixel-menu/pixel-menu';
import PixelMenuItemComponent from '../pixel-menu/pixel-menu-item';
import PixelMenuTriggerDirective from '../pixel-menu/pixel-menu-trigger';
import PixelPopoverComponent from '../pixel-popover/pixel-popover';
import PixelPopoverTriggerDirective from '../pixel-popover/pixel-popover-trigger';
import {
  PIXEL_EDITOR_TABLE_BORDER_STYLES,
  PIXEL_EDITOR_TABLE_COLUMN_WIDTHS,
  PIXEL_EDITOR_TABLE_ROW_HEIGHTS,
  PIXEL_EDITOR_TABLE_WIDTHS,
  type PixelEditorTableBorderStyle,
  type PixelEditorTableCellAlign,
} from './extensions/pixel-editor-table';
import { PIXEL_EDITOR_HIGHLIGHT_COLORS } from './pickers/pixel-editor-picker.types';
import {
  DEFAULT_PIXEL_EDITOR_LABELS,
  type PixelEditorLabels,
} from './pixel-editor-labels';

/**
 * Contextual chrome when the selection is inside a table.
 */
@Component({
  selector: 'pixel-editor-table-toolbar',
  imports: [
    PixelButtonComponent,
    PixelTooltipDirective,
    PixelDividerComponent,
    PixelMenuComponent,
    PixelMenuItemComponent,
    PixelMenuTriggerDirective,
    PixelPopoverComponent,
    PixelPopoverTriggerDirective,
  ],
  templateUrl: './pixel-editor-table-toolbar.html',
  styleUrl: './pixel-editor-table-toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-editor-table-toolbar',
    role: 'toolbar',
    '[attr.aria-label]': 'l().tableFormatting',
  },
})
export default class PixelEditorTableToolbarComponent {
  /**
   * Resolved i18n labels.
   *
   * @type {PixelEditorLabels}
   * @default DEFAULT_PIXEL_EDITOR_LABELS
   */
  readonly labels = input<PixelEditorLabels>(DEFAULT_PIXEL_EDITOR_LABELS);

  protected readonly l = computed(() => this.labels());

  /**
   * Whether the toolbar controls are disabled.
   *
   * @type {boolean}
   * @default false
   * @description Disables all table chrome actions.
   */
  readonly disabled = input(false);

  /**
   * Current header fill color, or null for the theme default.
   * Prefer theme tokens (`var(--pixel-editor-mark-*)`) from the picker.
   *
   * @type {string | null}
   * @default null
   * @description Highlights the active swatch in the header color picker.
   */
  readonly headerColor = input<string | null>(null);

  /**
   * Current table border style.
   *
   * @type {PixelEditorTableBorderStyle}
   * @default 'solid'
   * @description Active border style for the border menu checkmarks.
   */
  readonly borderStyle = input<PixelEditorTableBorderStyle>('solid');

  readonly addRow = output<void>();
  readonly addRowBefore = output<void>();
  readonly addColumn = output<void>();
  readonly addColumnBefore = output<void>();
  readonly deleteRow = output<void>();
  readonly deleteColumn = output<void>();
  readonly toggleHeader = output<void>();
  readonly toggleHeaderColumn = output<void>();
  readonly mergeCells = output<void>();
  readonly splitCell = output<void>();
  readonly headerColorChange = output<string | null>();
  readonly cellBackgroundChange = output<string | null>();
  readonly cellAlignChange = output<PixelEditorTableCellAlign>();
  readonly borderStyleChange = output<PixelEditorTableBorderStyle>();
  readonly columnWidthChange = output<number | null>();
  readonly equalizeColumns = output<void>();
  readonly rowHeightChange = output<string | null>();
  readonly tableWidthChange = output<string | null>();
  readonly deleteTable = output<void>();

  protected readonly headerColors = PIXEL_EDITOR_HIGHLIGHT_COLORS;
  protected readonly cellColors = PIXEL_EDITOR_HIGHLIGHT_COLORS;

  protected readonly columnWidths = computed(() => {
    const l = this.l();
    const labelById: Record<string, string> = {
      narrow: l.tableColNarrow,
      default: l.tableColDefault,
      wide: l.tableColWide,
      extraWide: l.tableColExtraWide,
    };
    return PIXEL_EDITOR_TABLE_COLUMN_WIDTHS.map((opt) => ({
      ...opt,
      label: labelById[opt.id] ?? opt.label,
    }));
  });

  protected readonly rowHeights = computed(() => {
    const l = this.l();
    const labelById: Record<string, string> = {
      compact: l.tableRowCompact,
      default: l.tableRowDefault,
      comfortable: l.tableRowComfortable,
      tall: l.tableRowTall,
    };
    return PIXEL_EDITOR_TABLE_ROW_HEIGHTS.map((opt) => ({
      ...opt,
      label: labelById[opt.id] ?? opt.label,
    }));
  });

  protected readonly tableWidths = computed(() => {
    const l = this.l();
    const labelById: Record<string, string> = {
      fit: l.tableFitContent,
      '25': l.tableWidth25,
      '50': l.tableWidth50,
      '75': l.tableWidth75,
      '100': l.tableWidth100,
    };
    return PIXEL_EDITOR_TABLE_WIDTHS.map((opt) => ({
      ...opt,
      label: labelById[opt.id] ?? opt.label,
    }));
  });

  protected readonly borderStyles = computed(() => {
    const l = this.l();
    const labelById: Record<string, string> = {
      solid: l.borderSolid,
      dashed: l.borderDashed,
      none: l.borderNone,
    };
    return PIXEL_EDITOR_TABLE_BORDER_STYLES.map((opt) => ({
      ...opt,
      label: labelById[opt.id] ?? opt.label,
    }));
  });

  /** Material icon for the current border style (toolbar trigger). */
  protected readonly borderStyleIcon = computed(
    () =>
      PIXEL_EDITOR_TABLE_BORDER_STYLES.find((s) => s.value === this.borderStyle())?.icon ??
      'border_all',
  );
}
