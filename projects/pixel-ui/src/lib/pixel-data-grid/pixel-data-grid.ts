import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  type OnDestroy,
  type OnInit,
  booleanAttribute,
  computed,
  contentChild,
  contentChildren,
  effect,
  inject,
  Injector,
  input,
  model,
  numberAttribute,
  output,
  signal,
  untracked,
  viewChild,
  afterNextRender,
} from '@angular/core';
import { type Subscription, from, isObservable } from 'rxjs';
import PixelButtonComponent from '../pixel-button/pixel-button';
import PixelCheckboxComponent from '../pixel-checkbox/pixel-checkbox';
import PixelDrawerComponent from '../pixel-drawer/pixel-drawer';
import PixelDatepickerComponent from '../pixel-datepicker/pixel-datepicker';
import PixelInputComponent from '../pixel-input/pixel-input';
import PixelMenuComponent from '../pixel-menu/pixel-menu';
import PixelMenuItemComponent from '../pixel-menu/pixel-menu-item';
import PixelMenuTriggerDirective from '../pixel-menu/pixel-menu-trigger';
import PixelPaginatorComponent, { type PixelPageEvent } from '../pixel-paginator/pixel-paginator';
import PixelLoaderComponent from '../pixel-loader/pixel-loader';
import PixelSelectComponent, { type PixelSelectOption } from '../pixel-select/pixel-select';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';
import PixelTooltipDirective from '../pixel-tooltip/pixel-tooltip';
import { PixelExportService } from '../services/export/export.service';
import { formatExportDate } from '../services/export/public-api';
import { PixelAuthorizationService } from '../services/authorization/authorization.service';
import {
  injectDateFieldIoContext,
  resolveDateFieldLocale,
} from '../shared/datetime/pixel-date-field-io';
import { PIXEL_DATE_LOCALE } from '../shared/datetime/pixel-date-adapter';
import { highlightElement, scrollToElement } from '../services/navigate/navigate-dom';
import {
  PIXEL_UI_ANALYTICS,
  trackPixelUiAnalytics,
} from '../shared/analytics/pixel-ui-analytics';
import PixelDataGridCellDirective from './pixel-data-grid-cell.directive';
import PixelDataGridColumnsPanelComponent from './pixel-data-grid-columns-panel';
import type { PixelDataGridColumnsPanelReorderEvent } from './pixel-data-grid-columns-panel';
import {
  startColumnDragPreview,
  type PixelDataGridDragPreviewSession,
} from './pixel-data-grid-drag-preview';
import PixelDataGridDetailDirective from './pixel-data-grid-detail.directive';
import PixelDataGridEditorDirective from './pixel-data-grid-editor.directive';
import PixelDataGridRowActionsDirective from './pixel-data-grid-row-actions.directive';
import { PixelDataGridStore } from './pixel-data-grid.store';
import type {
  PixelDataGridCellEditEvent,
  PixelDataGridColumn,
  PixelDataGridCriteria,
  PixelDataGridDataSource,
  PixelDataGridDensity,
  PixelDataGridLoadingMode,
  PixelDataGridExportFormat,
  PixelDataGridExportScope,
  PixelDataGridExportSource,
  PixelDataGridExportOutcome,
  PixelDataGridFilterOperator,
  PixelDataGridFilterState,
  PixelDataGridFilterValue,
  PixelDataGridLabels,
  PixelDataGridPageEvent,
  PixelDataGridPinSide,
  PixelDataGridGroupRow,
  PixelDataGridRenderRow,
  PixelDataGridRowClickEvent,
  PixelDataGridRowId,
  PixelDataGridRowQuickAction,
  PixelDataGridRowQuickActionEvent,
  PixelDataGridRowQuickActionsMode,
  PixelDataGridSelectionMode,
  PixelDataGridSortDescriptor,
  PixelDataGridSortEvent,
  PixelDataGridState,
} from './pixel-data-grid.types';
import {
  PIXEL_DATA_GRID_OPERATOR_LABELS,
  clearGridLayout,
  cycleGridSort,
  formatGridCell,
  formatLabel,
  gridHeaderLabel,
  gridOperatorsFor,
  gridRenderRowKey,
  gridStateToJson,
  isValuelessGridOperator,
  mergePixelDataGridLabels,
  parseGridDate,
  parseGridState,
  readGridLayout,
  toGridExportColumns,
  writeGridLayout,
} from './pixel-data-grid.utils';
import {
  MIN_LAYOUT_COLUMN_PX,
  resolveViewportColumnWidths,
} from './pixel-data-grid-column-layout';
import {
  effectiveColumnMinWidthPx,
  estimateHeaderMinWidthPx,
  measureHeaderMinWidthFromElement,
  type PixelDataGridHeaderMinWidthContext,
} from './pixel-data-grid-header-min-width';

/** Width (px) of the leading selection (checkbox) column. */
const SELECTION_COLUMN_WIDTH = 44;

/** Width (px) of the leading master-detail toggle column. */
const DETAIL_COLUMN_WIDTH = 40;

/** Estimated / locked body row height (px) per density — sized to fit in-cell editors. */
const DENSITY_ROW_HEIGHT: Record<PixelDataGridDensity, number> = {
  compact: 44,
  standard: 48,
  comfortable: 56,
};

/** Fallback skeleton body row count when auto-sizing has no pageSize / viewport / known rows. */
const DEFAULT_AUTO_SKELETON_ROWS = 10;

/** Ignore a second pointerdown within this window so double-click reset does not start a drag. */
const RESIZE_DOUBLE_CLICK_MS = 400;

let nextDataGridId = 0;

/**
 * Enterprise data grid (work in progress — built phase by phase). Provide `data` and `columns`;
 * render rich cells with `<ng-template pixelGridCell="field">`. Phase 0 established the
 * store-driven foundation; Phase 1 adds the data pipeline: multi-column sort (shift-click),
 * per-column filters, a global quick search, and pagination — client-side by default, or
 * server-driven via `serverSide` + `criteriaChange`, or fully managed via a `[dataSource]`.
 *
 * @example
 * ```html
 * <pixel-data-grid [data]="rows()" [columns]="columns" [rowId]="rowIdFn" searchable [paginated]="true" />
 * ```
 */
@Component({
  selector: 'pixel-data-grid',
  imports: [
    NgTemplateOutlet,
    PixelButtonComponent,
    PixelCheckboxComponent,
    PixelDataGridColumnsPanelComponent,
    PixelDatepickerComponent,
    PixelDrawerComponent,
    PixelInputComponent,
    PixelLoaderComponent,
    PixelMenuComponent,
    PixelMenuItemComponent,
    PixelMenuTriggerDirective,
    PixelPaginatorComponent,
    PixelSelectComponent,
    PixelSkeletonComponent,
    PixelTooltipDirective,
  ],
  // PixelDataGridDetailDirective is a content directive (projected by consumers); not imported here.
  templateUrl: './pixel-data-grid.html',
  styleUrl: './pixel-data-grid.scss',
  providers: [PixelDataGridStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-data-grid-host',
    '[attr.data-density]': 'density()',
    '[attr.data-row-actions-mode]': 'effectiveRowQuickActionsMode()',
    '[class.pixel-data-grid-host--loading]': 'isLoading()',
    '[class.pixel-data-grid-host--coarse-pointer]': 'coarsePointer()',
    '[class.pixel-data-grid-host--keyboard-nav]': 'rowActionsKeyboardNav()',
    '[attr.aria-busy]': 'isLoading() || showSkeleton() || null',
    '(pointerdown)': 'onHostPointerDown($event)',
    '(keydown)': 'onHostKeyDown($event)',
  },
})
export default class PixelDataGridComponent<T = any> implements OnInit, OnDestroy {
  protected readonly store = inject(PixelDataGridStore) as PixelDataGridStore<T>;
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly exporter = inject(PixelExportService);
  private readonly analytics = inject(PIXEL_UI_ANALYTICS, { optional: true });
  private readonly auth = inject(PixelAuthorizationService, { optional: true });
  private searchAnalyticsTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly cellTemplates = contentChildren(PixelDataGridCellDirective);
  private readonly editorTemplates = contentChildren(PixelDataGridEditorDirective);
  private readonly rowActionsDirective = contentChild(PixelDataGridRowActionsDirective);

  protected readonly fallbackId = `pixel-data-grid-${nextDataGridId++}`;

  // ── Data & columns ────────────────────────────────────────────────────────────────────────
  /** Row data (ignored when a `dataSource` is bound). */
  readonly data = input<readonly T[]>([]);
  /** Column definitions. */
  readonly columns = input<readonly PixelDataGridColumn<T>[]>([]);
  /** Stable row identity for tracking (and future selection). Defaults to the row index. */
  readonly rowId = input<PixelDataGridRowId<T>>((_row, index) => index);

  /**
   * @component pixel-data-grid
   * Partial override map for toolbar / selection / column-menu / panel chrome copy.
   * @type {Partial<PixelDataGridLabels>}
   * @default {}
   * @description Merged with {@link DEFAULT_PIXEL_DATA_GRID_LABELS}. Use `{n}`, `{total}`, `{col}`
   * placeholders (see {@link formatLabel}). Does not replace `emptyMessage`.
   */
  readonly labels = input<Partial<PixelDataGridLabels>>({});

  /**
   * @component pixel-data-grid
   * BCP-47 locale for built-in `type: 'date'` cell display.
   * @type {string | undefined}
   * @default undefined
   * @description Precedence: this input → `PIXEL_DATE_LOCALE` → browser Intl. Display uses the
   * same formatter as datepicker; export still emits canonical `YYYY-MM-DD`.
   */
  readonly dateLocale = input<string | undefined>(undefined);

  private readonly injectedDateLocale = inject(PIXEL_DATE_LOCALE, { optional: true });
  private readonly dateFieldIo = injectDateFieldIoContext();

  protected readonly resolvedDateLocale = computed(() =>
    resolveDateFieldLocale(this.dateLocale(), this.injectedDateLocale ?? undefined),
  );

  protected readonly l = computed(() => mergePixelDataGridLabels(this.labels()));
  protected readonly formatLabel = formatLabel;
  protected readonly resolvedOperatorLabels = computed(() => ({
    ...PIXEL_DATA_GRID_OPERATOR_LABELS,
    ...this.l().operators,
  }));

  // ── Presentation ──────────────────────────────────────────────────────────────────────────
  readonly density = input<PixelDataGridDensity>('standard');
  readonly stickyHeader = input(true, { transform: booleanAttribute });
  readonly striped = input(false, { transform: booleanAttribute });
  readonly hoverable = input(true, { transform: booleanAttribute });
  readonly clickableRows = input(false, { transform: booleanAttribute });
  /**
   * @component pixel-data-grid
   * Explicit busy flag (also set automatically while a `dataSource` fetch is in flight).
   * @type {boolean}
   * @default false
   * @description Combined with `loadingMode` to choose spinner overlay vs in-body skeleton rows.
   */
  readonly loading = input(false, { transform: booleanAttribute });
  /**
   * @component pixel-data-grid
   * How in-flight loads are presented.
   * @type {PixelDataGridLoadingMode}
   * @default 'skeleton'
   * @description `skeleton` keeps headers, column widths, and pins and fills the body with
   * placeholder rows auto-sized to the upcoming layout (same as `showSkeleton`); `loader` keeps
   * existing rows and shows a centered spinner overlay. Applies to both the `loading` input and
   * DataSource fetches.
   */
  readonly loadingMode = input<PixelDataGridLoadingMode>('skeleton');
  /**
   * @component pixel-data-grid
   * Force in-body skeleton rows regardless of `loading` / fetch state.
   * @type {boolean}
   * @default false
   * @description Useful for route-level first paint before any fetch starts. While loading,
   * prefer `loadingMode="skeleton"` so DataSource fetches pick it up automatically.
   */
  readonly showSkeleton = input(false, { transform: booleanAttribute });
  /**
   * @component pixel-data-grid
   * Placeholder body row count while the skeleton is shown.
   * @type {number}
   * @default 0
   * @description `0` (default) auto-sizes: `pageSize` when paginated, visible viewport rows when
   * virtual, otherwise the current row count or 10. A positive value forces that many rows.
   */
  readonly skeletonRows = input(0, { transform: numberAttribute });
  readonly emptyMessage = input('No records to display.');
  readonly caption = input('');

  // ── Toolbar / search ─────────────────────────────────────────────────────────────────────
  /** Shows a global quick-filter search box above the grid. */
  readonly searchable = input(false, { transform: booleanAttribute });
  readonly searchPlaceholder = input('Search…');
  /**
   * Stable analytics id for this grid (e.g. `claims-inbox`). When `PIXEL_UI_ANALYTICS` is
   * provided, sort / filter / export emit `data.table.*` events with this id.
   *
   * @type {string}
   * @default ''
   */
  readonly analyticsId = input('');
  /** Shows a toolbar button that opens the "Manage columns" panel (pin/hide/reorder + layout). */
  readonly columnChooser = input(false, { transform: booleanAttribute });
  /**
   * Namespaced key enabling built-in `localStorage` persistence for the panel's Save/Restore/Clear
   * layout actions. When set, the grid also restores the saved layout automatically on init.
   */
  readonly layoutKey = input<string | null>(null);

  // ── Column tooling (Phase 2) ──────────────────────────────────────────────────────────────
  /** Enables drag-resize handles (a column can opt out with `resizable: false`). */
  readonly resizableColumns = input(false, { transform: booleanAttribute });
  /**
   * @component pixel-data-grid
   * Shows a persistent vertical hairline on each resize handle.
   *
   * @type {boolean}
   * @default true
   * @description When `resizableColumns` is on, paints a thin divider-token cue on every handle so
   * resize is discoverable. Set `false` to hide the idle line (hover/drag still highlight).
   */
  readonly showResizeLine = input(true, { transform: booleanAttribute });
  /**
   * @component pixel-data-grid
   * Readable floor (px) for columns that omit `minWidth`.
   *
   * @type {number}
   * @default 120
   * @description Applied as `max(defaultColumnMinWidth, headerContentEstimate)` for layout and
   * resize. Explicit `column.minWidth` still wins (including values below this floor). Not a
   * mobile-only switch — raises the shared readable minimum for all viewports.
   */
  readonly defaultColumnMinWidth = input(MIN_LAYOUT_COLUMN_PX, { transform: numberAttribute });
  /** Enables drag-to-reorder of column headers. */
  readonly reorderableColumns = input(false, { transform: booleanAttribute });
  /** Enables pin-left / pin-right actions in the per-column header menu. */
  readonly pinnableColumns = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-data-grid
   * Shows a tooltip with the full cell value when default cell text is truncated.
   *
   * @type {boolean}
   * @default true
   * @description Uses `pixelTooltipShowOnOverflow` on built-in formatted cells only; custom
   * `pixelGridCell` templates opt in manually.
   */
  readonly cellTooltipWhenTruncated = input(true, { transform: booleanAttribute });

  // ── Selection (Phase 3) ───────────────────────────────────────────────────────────────────
  /** Row selection mode. `multiple` adds a checkbox column with select-all + shift-range. */
  readonly selectionMode = input<PixelDataGridSelectionMode>('none');
  /** Two-way selected rows (by reference / `rowId`). */
  readonly selectedRows = model<T[]>([]);

  // ── Export (Phase 3) ──────────────────────────────────────────────────────────────────────
  /** Shows the toolbar export menu (CSV / JSON / Excel / clipboard). */
  readonly exportable = input(false, { transform: booleanAttribute });
  /**
   * @type {string}
   * @default ''
   * @description When set, export toolbar and {@link exportData} require this permission
   * via {@link PixelAuthorizationService}. Empty → no auth gate.
   */
  readonly exportAccess = input('');
  /** Base file name for downloads (without extension). */
  readonly exportFileName = input('grid-export');
  /** Formats offered in the export menu. */
  readonly exportFormats = input<PixelDataGridExportFormat[]>(['csv', 'json', 'excel', 'clipboard']);

  // ── Sorting ───────────────────────────────────────────────────────────────────────────────
  /** Allows shift-click to build a multi-column sort. When false, sorting is single-column. */
  readonly multiSort = input(true, { transform: booleanAttribute });
  /** Two-way multi-column sort model (priority order). */
  readonly sortModel = model<readonly PixelDataGridSortDescriptor[]>([]);

  // ── Filtering ─────────────────────────────────────────────────────────────────────────────
  /** Two-way per-column filter state (field → { operator, value }). */
  readonly filters = model<PixelDataGridFilterState>({});
  /** Two-way global quick-filter text. */
  readonly quickFilter = model('');

  // ── Pagination ────────────────────────────────────────────────────────────────────────────
  readonly paginated = input(false, { transform: booleanAttribute });
  readonly pageIndex = model(0);
  readonly pageSize = model(10);
  readonly pageSizeOptions = input<number[]>([10, 25, 50, 100]);

  // ── Data source / server mode ─────────────────────────────────────────────────────────────
  /** Defer sorting/filtering/paging to the parent and render `data` verbatim. */
  readonly serverSide = input(false, { transform: booleanAttribute });
  /** Total record count for server-side paging. Defaults to the filtered client count. */
  readonly totalRecords = input<number | null>(null);
  /** A pluggable data source. When bound, the grid fetches on every criteria change. */
  readonly dataSource = input<PixelDataGridDataSource<T> | null>(null);

  // ── Virtualization & scale (Phase 4) ──────────────────────────────────────────────────────
  /** Render only the visible rows (fixed-height windowing). Bypasses pagination. */
  readonly virtualScroll = input(false, { transform: booleanAttribute });
  /** Fixed row height in px for virtualization. `0` derives it from density. */
  readonly rowHeight = input(0, { transform: numberAttribute });
  /** Viewport height in px when virtual scrolling. */
  readonly virtualHeight = input(480, { transform: numberAttribute });
  /** Extra rows rendered above/below the viewport to smooth fast scrolling. */
  readonly virtualOverscan = input(8, { transform: numberAttribute });
  /** Emit `loadMore` as the user nears the bottom (for incremental / server paging). */
  readonly infiniteScroll = input(false, { transform: booleanAttribute });
  /** Whether more rows are available to load (gates `loadMore`). */
  readonly hasMore = input(true, { transform: booleanAttribute });

  // ── Grouping & master-detail (Phase 5) ────────────────────────────────────────────────────
  /** Fields to group rows by, in order. Group headers are collapsible; columns can aggregate. */
  readonly groupBy = input<string[]>([]);
  /** Enables a master-detail toggle column that expands the `pixelGridDetail` template per row. */
  readonly expandableRows = input(false, { transform: booleanAttribute });

  // ── Inline editing (Phase 6) ──────────────────────────────────────────────────────────────
  /** Master switch for inline cell editing (a column must also set `editable: true`). */
  readonly editable = input(false, { transform: booleanAttribute });

  // ── Row quick actions (Gmail-style pill) ─────────────────────────────────────────────────
  /**
   * @component pixel-data-grid
   * Declarative floating quick actions for each data row (Gmail-style hover/focus pill).
   * @type {readonly PixelDataGridRowQuickAction[]}
   * @default []
   * @description When non-empty (and no `pixelGridRowActions` template), the first
   * `rowQuickActionsMaxVisible` icons render in the pill; the rest go in a ⋮ menu.
   * On coarse pointers (touch), the pill reveals for the tapped row only (sticky until
   * another row is tapped or a tap outside clears it). Ignored when a row-actions template is projected.
   */
  readonly rowQuickActions = input<readonly PixelDataGridRowQuickAction<T>[]>([]);
  /**
   * @component pixel-data-grid
   * Max icon buttons shown before overflowing into the ⋮ menu.
   * @type {number}
   * @default 3
   */
  readonly rowQuickActionsMaxVisible = input(3, { transform: numberAttribute });
  /**
   * @component pixel-data-grid
   * When the quick-actions pill is revealed.
   * @type {PixelDataGridRowQuickActionsMode}
   * @default 'hover-focus'
   * @description On coarse pointers, `hover` / `hover-focus` use tap-to-reveal (sticky row
   * ownership) instead of always-visible. Only `always` shows every row's pill at once.
   */
  readonly rowQuickActionsMode = input<PixelDataGridRowQuickActionsMode>('hover-focus');

  private readonly detailDirective = contentChild(PixelDataGridDetailDirective);

  // ── Outputs ───────────────────────────────────────────────────────────────────────────────
  readonly rowClick = output<PixelDataGridRowClickEvent<T>>();
  /**
   * @component pixel-data-grid
   * Emitted when a declarative `rowQuickActions` item is activated.
   * @type {PixelDataGridRowQuickActionEvent}
   */
  readonly rowQuickAction = output<PixelDataGridRowQuickActionEvent<T>>();
  readonly sortChange = output<PixelDataGridSortEvent>();
  readonly pageChange = output<PixelDataGridPageEvent>();
  /** Unified criteria (sort + page + quick filter + filters) for server-side data sources. */
  readonly criteriaChange = output<PixelDataGridCriteria>();
  /** Emits the visible column fields whenever column visibility changes. */
  readonly columnVisibilityChange = output<string[]>();
  /** Emits the full view-state snapshot whenever column layout (order/width/visibility/pin) changes. */
  readonly stateChange = output<PixelDataGridState>();
  /** Emits the selected rows whenever the selection changes. */
  readonly selectionChange = output<T[]>();
  /** Emits when the user scrolls near the bottom and `infiniteScroll` + `hasMore` are set. */
  readonly loadMore = output<void>();
  /** Emits when an inline cell edit is committed. */
  readonly cellEdit = output<PixelDataGridCellEditEvent<T>>();
  /** Emits the saved JSON payload whenever `saveLayout()` runs. */
  readonly layoutSave = output<string>();
  /** Emits the restored JSON payload whenever `restoreLayout()` succeeds. */
  readonly layoutRestore = output<string>();
  /** Emits whenever `clearLayout()` runs. */
  readonly layoutClear = output<void>();

  // ── Derived view state ────────────────────────────────────────────────────────────────────
  protected readonly visibleColumns = computed(() => this.store.visibleColumns());
  protected readonly displayRows = computed(() => this.store.displayRows());
  /**
   * Resolved skeleton body row count: explicit `skeletonRows` when &gt; 0, otherwise match the
   * layout the grid is about to show (page size / virtual viewport / known rows).
   */
  protected readonly effectiveSkeletonRowCount = computed(() => {
    const override = Math.floor(this.skeletonRows());
    if (override > 0) {
      return override;
    }
    if (this.virtualScroll()) {
      const rowHeight = Math.max(1, this.effectiveRowHeight());
      const viewport = this.viewportHeight() || this.virtualHeight();
      return Math.max(1, Math.ceil(viewport / rowHeight));
    }
    if (this.paginated()) {
      return Math.max(1, Math.floor(this.pageSize()) || 1);
    }
    const known = this.displayRows().length;
    return known > 0 ? known : DEFAULT_AUTO_SKELETON_ROWS;
  });
  /** Stable indexes for `@for` of in-body skeleton placeholder rows. */
  protected readonly skeletonRowIndexes = computed(() =>
    Array.from({ length: this.effectiveSkeletonRowCount() }, (_, i) => i),
  );
  /** Keeps tbody height stable while skeleton rows are shown (count × density row height). */
  protected readonly skeletonBodyMinHeight = computed(() =>
    this.effectiveSkeletonRowCount() * Math.max(1, this.effectiveRowHeight()),
  );
  /** Alternating bar widths so skeleton cells don't read as a uniform block. */
  protected readonly skeletonBarWidths = ['72%', '58%', '84%', '46%', '66%'] as const;
  protected readonly showSortPriority = computed(() => this.sortModel().length > 1);
  /**
   * Maps grid density → embedded control size (paginator / input / select), so the
   * three densities are visually distinct: `compact → xs`, `standard → sm`, `comfortable → md`.
   */
  protected readonly controlSize = computed<'xs' | 'sm' | 'md'>(() => {
    switch (this.density()) {
      case 'compact':
        return 'xs';
      case 'comfortable':
        return 'md';
      default:
        return 'sm';
    }
  });

  /**
   * Selection / inline-edit checkboxes use `md` for a clearer tap target and optical weight
   * in the sticky selection column (independent of density-mapped form controls).
   */
  protected readonly checkboxSize = 'md' as const;

  // ── Grouping / master-detail (Phase 5) ────────────────────────────────────────────────────
  protected readonly detailColumnWidth = DETAIL_COLUMN_WIDTH;
  protected readonly showDetailColumn = computed(
    () => this.expandableRows() && !!this.detailDirective(),
  );
  protected readonly detailColumnLeft = computed(() =>
    this.selectionMode() !== 'none' ? SELECTION_COLUMN_WIDTH : 0,
  );
  protected readonly detailTemplateRef = computed(() => this.detailDirective()?.template ?? null);
  protected readonly useFlatRender = computed(() => this.store.useFlatRender());
  protected readonly renderRows = computed(() => this.store.renderRows());
  protected readonly grandTotals = computed(() => this.store.grandTotals());
  protected readonly showGrandTotal = computed(
    () => this.store.hasAggregates() && !this.virtualScroll(),
  );
  protected readonly totalColumnCount = computed(
    () =>
      this.visibleColumns().length +
      (this.selectionMode() !== 'none' ? 1 : 0) +
      (this.showDetailColumn() ? 1 : 0) +
      (this.rowActionsEnabled() ? 1 : 0),
  );
  private readonly columnByField = computed(
    () => new Map<string, PixelDataGridColumn<T>>(this.columns().map((column) => [column.field, column])),
  );

  // ── Inline editing / keyboard focus (Phase 6) ─────────────────────────────────────────────
  /** The cell currently being edited (absolute row index + field), or `null`. */
  protected readonly editingCell = signal<{ rowIndex: number; field: string } | null>(null);
  /** Draft value for the in-progress edit. */
  protected readonly editDraft = signal<unknown>(null);
  /** Validation message for the in-progress edit, or `null`. */
  protected readonly editError = signal<string | null>(null);
  /** Roving-tabindex focus over data cells (absolute row index + visible-column index). */
  protected readonly focusedCell = signal<{ row: number; col: number } | null>(null);

  private readonly editorTemplateMap = computed(() => {
    const map = new Map<string, PixelDataGridEditorDirective>();
    for (const dir of this.editorTemplates()) {
      map.set(dir.field(), dir);
    }
    return map;
  });

  /** Leading non-data columns (selection + detail) for ARIA column indexing. */
  protected readonly leadingColumnCount = computed(
    () => (this.selectionMode() !== 'none' ? 1 : 0) + (this.showDetailColumn() ? 1 : 0),
  );
  /** Combined inline size (px) of leading selection/detail columns. */
  protected readonly leadingColumnWidthPx = computed(() => {
    let width = 0;
    if (this.selectionMode() !== 'none') {
      width += SELECTION_COLUMN_WIDTH;
    }
    if (this.showDetailColumn()) {
      width += DETAIL_COLUMN_WIDTH;
    }
    return width;
  });
  /** Estimated header minimum widths (before DOM refinement). */
  protected readonly estimatedHeaderMinWidths = computed(() => {
    const widths: Record<string, number> = {};
    for (const column of this.visibleColumns()) {
      widths[column.field] = estimateHeaderMinWidthPx(
        column,
        this.headerMinContextForColumn(column),
      );
    }
    return widths;
  });

  private readonly domHeaderMinWidths = signal<Readonly<Record<string, number>>>({});

  /** Header-aware minimum widths (DOM-refined when available, else estimated). */
  protected readonly headerMinWidths = computed(() => {
    const estimated = this.estimatedHeaderMinWidths();
    if (this.columnResizingSignal()) {
      return estimated;
    }
    const measured = this.domHeaderMinWidths();
    const merged = { ...estimated };
    for (const [field, px] of Object.entries(measured)) {
      if (px > 0) {
        merged[field] = px;
      }
    }
    return merged;
  });

  protected readonly resolvedLayoutWidths = computed(() => {
    const viewport = this.scrollWidth();
    if (viewport <= 0) {
      return null;
    }

    const baseline = this.resizeBaselineWidths;
    const activeField = this.resizeState?.field;
    if (baseline && activeField) {
      const live = this.store.columnWidths()[activeField] ?? baseline[activeField];
      return { ...baseline, [activeField]: live };
    }

    return resolveViewportColumnWidths({
      columns: this.visibleColumns(),
      viewportWidthPx: viewport,
      leadingWidthPx: this.leadingColumnWidthPx(),
      userWidths: this.store.columnWidths(),
      headerMinWidths: this.headerMinWidths(),
      defaultMinWidthPx: this.resolvedDefaultColumnMinWidth(),
    });
  });
  protected readonly ariaColCount = computed(
    () =>
      this.visibleColumns().length +
      this.leadingColumnCount() +
      (this.rowActionsEnabled() ? 1 : 0),
  );
  /** Full row count for `aria-rowcount` (+1 header), independent of virtualization. */
  protected readonly ariaRowCount = computed(() => this.store.sortedRows().length + 1);
  /** Arrow-key navigation is enabled only on the flat, non-virtualized data path. */
  protected readonly keyboardNavEnabled = computed(
    () => !this.useFlatRender() && !this.virtualScroll(),
  );

  // ── Virtualization (Phase 4) ──────────────────────────────────────────────────────────────
  private readonly scrollerRef = viewChild<ElementRef<HTMLElement>>('scroller');
  private readonly scrollTop = signal(0);
  /** Measured inline size of the scroll viewport (px) for viewport column layout. */
  private readonly scrollWidth = signal(0);
  private readonly viewportHeight = signal(0);
  private loadMorePending = false;

  protected readonly effectiveRowHeight = computed(
    () => this.rowHeight() || DENSITY_ROW_HEIGHT[this.density()],
  );

  /** [start, end) row window for virtualization (over the full filtered+sorted set). */
  private readonly virtualRange = computed(() => {
    const rowHeight = Math.max(1, this.effectiveRowHeight());
    const total = this.store.sortedRows().length;
    const overscan = Math.max(0, this.virtualOverscan());
    // Fall back to `virtualHeight` before the scroller has been measured (or if layout is 0).
    // Without this, the first paint can be an empty window until the user scrolls.
    const viewport = this.viewportHeight() || this.virtualHeight();
    const visible = Math.max(1, Math.ceil(viewport / rowHeight)) + overscan * 2;
    let start = Math.max(0, Math.floor(this.scrollTop() / rowHeight) - overscan);
    if (start >= total && total > 0) {
      start = Math.max(0, total - visible);
    }
    const end = Math.min(total, start + visible);
    return { start, end };
  });

  /** Rows actually rendered: the virtual window, or the paged/all display rows. */
  protected readonly viewRows = computed<readonly T[]>(() => {
    if (!this.virtualScroll()) {
      return this.displayRows();
    }
    const { start, end } = this.virtualRange();
    return this.store.sortedRows().slice(start, end);
  });

  /** Absolute index of the first rendered row (0 unless virtualizing). */
  protected readonly viewStartIndex = computed(() =>
    this.virtualScroll() ? this.virtualRange().start : 0,
  );

  protected readonly topSpacerHeight = computed(() =>
    this.virtualScroll() ? this.virtualRange().start * this.effectiveRowHeight() : 0,
  );

  protected readonly bottomSpacerHeight = computed(() => {
    if (!this.virtualScroll()) {
      return 0;
    }
    const { end } = this.virtualRange();
    return (this.store.sortedRows().length - end) * this.effectiveRowHeight();
  });

  // ── Column tooling: derived view state ────────────────────────────────────────────────────
  protected readonly showToolbar = computed(
    () =>
      this.searchable() ||
      this.columnChooser() ||
      this.exportMenuVisible() ||
      this.store.isGrouped(),
  );

  /**
   * Export toolbar visibility — `exportable` plus optional {@link exportAccess} gate.
   * While auth is hydrating (`unknown`/`loading`), the menu stays visible.
   */
  protected readonly exportMenuVisible = computed(() => {
    if (!this.exportable()) {
      return false;
    }
    return this.exportAccessAllowed();
  });

  /** True when export is permitted (or ungated). */
  protected readonly exportAccessAllowed = computed(() => {
    const key = this.exportAccess()?.trim();
    if (!key) {
      return true;
    }
    if (!this.auth) {
      return false;
    }
    if (this.auth.shouldShowWhilePending()) {
      return true;
    }
    return (
      this.auth.authorize({
        permission: key,
        action: 'export',
        resource: { type: 'data-grid', id: this.analyticsId() || this.fallbackId },
      }).status === 'allow'
    );
  });

  /** Columns after access filtering (denied → hidden + non-exportable). */
  private readonly columnsForStore = computed((): readonly PixelDataGridColumn<T>[] => {
    const cols = this.columns();
    if (!this.auth) {
      return cols;
    }
    const pending = this.auth.shouldShowWhilePending();
    return cols.map((column) => {
      const key = column.access?.trim();
      if (!key || pending) {
        return column;
      }
      const allowed =
        this.auth!.authorize({
          permission: key,
          action: 'view',
          resource: { type: 'column', id: column.field },
        }).status === 'allow';
      if (allowed) {
        return column;
      }
      return { ...column, hidden: true, exportable: false };
    });
  });

  protected readonly isGrouped = computed(() => this.store.isGrouped());

  /** Open state of the "Manage columns" drawer. */
  protected readonly columnsPanelOpen = signal(false);

  // ── Selection derived state ───────────────────────────────────────────────────────────────
  protected readonly hasCheckboxColumn = computed(() => this.selectionMode() === 'multiple');
  protected readonly selectionColumnWidth = SELECTION_COLUMN_WIDTH;
  /** Selection keyed by `rowId` so identity survives paging / sorting / filtering. */
  private readonly selectedKeys = computed(() => {
    const idFn = this.rowId();
    return new Set(this.selectedRows().map((row, index) => idFn(row, index)));
  });
  protected readonly allPageSelected = computed(() => {
    const rows = this.displayRows();
    return rows.length > 0 && rows.every((row, index) => this.isSelected(row, index));
  });
  protected readonly somePageSelected = computed(() => {
    const rows = this.displayRows();
    const selected = rows.filter((row, index) => this.isSelected(row, index)).length;
    return selected > 0 && selected < rows.length;
  });
  /** True when the whole current page is selected but more rows exist beyond it (client mode). */
  protected readonly canSelectAcrossPages = computed(
    () =>
      this.selectionMode() === 'multiple' &&
      !this.serverSide() &&
      !this.dataSource() &&
      this.allPageSelected() &&
      this.store.effectiveTotal() > this.displayRows().length,
  );
  /** Anchor index (within the current page) for shift-click range selection. */
  private selectionAnchor: number | null = null;

  // ── Export state ──────────────────────────────────────────────────────────────────────────
  /** When a selection exists, restrict exports to the selected rows. */
  protected readonly exportSelectedOnly = signal(false);
  private exportSub?: Subscription;
  /** Per-column header kebab menu shows when pinning or hiding from the header is available. */
  protected readonly showColumnMenu = computed(() => this.pinnableColumns() || this.columnChooser());
  /** True while a column resize drag is in progress. */
  private readonly columnResizingSignal = signal(false);
  protected readonly columnResizing = this.columnResizingSignal.asReadonly();

  /** Transient drag-reorder state. */
  protected readonly dragField = signal<string | null>(null);
  protected readonly dropTarget = signal<{ field: string; after: boolean } | null>(null);
  private dragPreviewSession: PixelDataGridDragPreviewSession | null = null;

  /** Loading busy = explicit `loading` input or an in-flight DataSource fetch. */
  private readonly fetchLoading = signal(false);
  protected readonly isLoading = computed(() => this.loading() || this.fetchLoading());

  /** In-body skeleton rows: forced via `showSkeleton`, or loading with `loadingMode="skeleton"`. */
  protected readonly showLoadingSkeleton = computed(
    () => this.showSkeleton() || (this.isLoading() && this.loadingMode() === 'skeleton'),
  );

  /** Spinner overlay: only when loading in `loader` mode (and not forced into skeleton). */
  protected readonly showLoadingOverlay = computed(
    () => this.isLoading() && this.loadingMode() === 'loader' && !this.showSkeleton(),
  );

  private resizeState: {
    field: string;
    startX: number;
    startWidth: number;
    minWidth: number;
    maxWidth?: number;
  } | null = null;
  private resizeFrame: number | null = null;
  private resizePointerX: number | null = null;
  private resizeDidMove = false;
  private lastResizePointerDownAt = 0;
  /** Column widths at drag start — siblings stay fixed until pointer-up. */
  private resizeBaselineWidths: Readonly<Record<string, number>> | null = null;

  private readonly templateMap = computed(() => {
    const map = new Map<string, PixelDataGridCellDirective>();
    for (const dir of this.cellTemplates()) {
      map.set(dir.field(), dir);
    }
    return map;
  });

  private fetchSub?: Subscription;

  constructor() {
    // Inputs → store.
    effect(() => this.store.columns.set(this.columnsForStore()));
    effect(() => this.store.rowId.set(this.rowId()));
    effect(() => this.store.density.set(this.density()));
    effect(() => this.store.serverSide.set(this.serverSide() || !!this.dataSource()));
    effect(() => this.store.groupBy.set(this.groupBy()));
    effect(() => this.store.detailEnabled.set(this.showDetailColumn()));
    effect(() => {
      const selectionWidth = this.selectionMode() !== 'none' ? SELECTION_COLUMN_WIDTH : 0;
      const detailWidth = this.showDetailColumn() ? DETAIL_COLUMN_WIDTH : 0;
      this.store.leadingOffset.set(selectionWidth + detailWidth);
    });
    effect(() => {
      // A DataSource owns `data`/`totalRecords` via fetch results; don't clobber them here.
      if (!this.dataSource()) {
        this.store.data.set(this.data());
        this.store.totalRecords.set(this.totalRecords());
      }
    });

    // Two-way models → store (host models are the source of truth for pipeline state).
    effect(() => {
      this.store.sortModel.set(this.sortModel());
      this.store.filters.set(this.filters());
      this.store.quickFilter.set(this.quickFilter());
      this.store.paginated.set(this.paginated());
      this.store.pageIndex.set(this.pageIndex());
      this.store.pageSize.set(this.pageSize());
    });

    // Reset to the first page when the current page falls out of range (e.g. data shrank).
    effect(() => {
      if (this.paginated() && this.pageIndex() > this.store.pageCount() - 1) {
        untracked(() => this.pageIndex.set(0));
      }
    });

    // DataSource: refetch whenever the criteria change.
    effect(() => {
      const source = this.dataSource();
      const criteria = this.buildCriteria();
      if (!source) {
        return;
      }
      untracked(() => this.runFetch(source, criteria));
    });

    // New data (or a fresh fetch) clears the in-flight load-more guard.
    effect(() => {
      this.store.data();
      untracked(() => (this.loadMorePending = false));
    });

    // Measure the virtual viewport and keep it in sync with element resizes. Seed from
    // `virtualHeight` when the scroller is missing or still has a 0 client height so the first
    // paint already has a usable window (docs examples / deferred tabs often measure 0 once).
    effect((onCleanup) => {
      if (!this.virtualScroll()) {
        return;
      }
      const fallback = Math.max(0, this.virtualHeight());
      const scroller = this.scrollerRef()?.nativeElement;
      if (!scroller) {
        untracked(() => {
          if (fallback > 0 && this.viewportHeight() <= 0) {
            this.viewportHeight.set(fallback);
          }
        });
        return;
      }
      const apply = (): void => {
        const measured = scroller.clientHeight || fallback;
        if (measured > 0) {
          this.viewportHeight.set(measured);
        }
      };
      apply();
      if (typeof ResizeObserver === 'undefined') {
        return;
      }
      const observer = new ResizeObserver(() => apply());
      observer.observe(scroller);
      onCleanup(() => observer.disconnect());
    });

    // Measure scroll viewport width for column layout.
    effect((onCleanup) => {
      const scroller = this.scrollerRef()?.nativeElement;
      if (!scroller) {
        return;
      }
      const apply = (): void => {
        const measured = scroller.clientWidth;
        if (measured > 0) {
          this.scrollWidth.set(measured);
        }
      };
      apply();
      if (typeof ResizeObserver === 'undefined') {
        return;
      }
      const observer = new ResizeObserver(() => apply());
      observer.observe(scroller);
      onCleanup(() => observer.disconnect());
    });

    effect(() => {
      const resolved = this.resolvedLayoutWidths();
      untracked(() => this.store.setResolvedLayoutWidths(resolved));
    });

    effect(() => {
      this.visibleColumns();
      this.density();
      this.reorderableColumns();
      this.pinnableColumns();
      this.columnChooser();
      this.sortModel();
      this.store.pinnedOverrides();

      if (this.columnResizingSignal()) {
        return;
      }

      afterNextRender(
        () => {
          untracked(() => this.refreshDomHeaderMinWidths());
        },
        { injector: this.injector },
      );
    });
  }

  ngOnInit(): void {
    // Best-effort: a no-op when `layoutKey` is unset or nothing was previously saved.
    this.restoreLayout();
    if (typeof matchMedia === 'function') {
      this.coarsePointerMql = matchMedia('(pointer: coarse)');
      this.coarsePointer.set(this.coarsePointerMql.matches);
      this.coarsePointerMql.addEventListener('change', this.onCoarsePointerChange);
    }
  }

  ngOnDestroy(): void {
    if (this.searchAnalyticsTimer) {
      clearTimeout(this.searchAnalyticsTimer);
      this.searchAnalyticsTimer = null;
    }
    this.fetchSub?.unsubscribe();
    this.exportSub?.unsubscribe();
    this.stopDragPreview();
    this.cancelResizeFrame();
    this.coarsePointerMql?.removeEventListener('change', this.onCoarsePointerChange);
    this.coarsePointerMql = null;
  }

  /** Tracks scroll position for virtualization and fires `loadMore` near the bottom. */
  protected onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    this.scrollTop.set(el.scrollTop);
    if (this.viewportHeight() !== el.clientHeight) {
      this.viewportHeight.set(el.clientHeight);
    }
    if (this.scrollWidth() !== el.clientWidth) {
      this.scrollWidth.set(el.clientWidth);
    }
    if (
      this.infiniteScroll() &&
      this.hasMore() &&
      !this.loadMorePending &&
      el.scrollHeight - el.scrollTop - el.clientHeight < this.effectiveRowHeight() * 4
    ) {
      this.loadMorePending = true;
      this.loadMore.emit();
    }
  }

  // ── Cell rendering ────────────────────────────────────────────────────────────────────────
  protected headerLabel(column: PixelDataGridColumn<T>): string {
    return gridHeaderLabel(column);
  }

  protected formatCell(row: T, column: PixelDataGridColumn<T>): string {
    return formatGridCell(row, column, {
      labels: this.l(),
      dateLocale: this.resolvedDateLocale(),
      dateFieldIo: this.dateFieldIo,
    });
  }

  protected cellValue(row: T, field: string): unknown {
    return (row as Record<string, unknown>)[field];
  }

  protected cellTemplateFor(field: string): PixelDataGridCellDirective | undefined {
    return this.templateMap().get(field);
  }

  protected trackRow = (index: number, row: T): string | number => this.store.keyFor(row, index);

  protected onRowClick(row: T, index: number): void {
    if (!this.clickableRows()) {
      return;
    }
    this.rowClick.emit({ row, index });
  }

  // ── Row quick actions ─────────────────────────────────────────────────────────────────────
  /**
   * Coarse pointer (touch) — tap-to-reveal sticky ownership instead of always-visible pills.
   * Host class retained as a test/debug hook.
   */
  protected readonly coarsePointer = signal(false);
  /** Row id currently owning the pill (mouse hover, or sticky tap on coarse pointers). */
  protected readonly pointerHoverRowId = signal<string | number | null>(null);
  /**
   * When true, `:focus-within` may keep a pill visible (keyboard Tab into actions).
   * Cleared on pointerdown so a mouse click does not freeze the pill via focus.
   */
  protected readonly rowActionsKeyboardNav = signal(false);
  /** Row id whose overflow menu is open — keeps the pill visible while the menu is open. */
  protected readonly rowActionsMenuOpenFor = signal<string | number | null>(null);
  private coarsePointerMql: MediaQueryList | null = null;
  private readonly onCoarsePointerChange = (): void => {
    this.coarsePointer.set(!!this.coarsePointerMql?.matches);
  };

  protected readonly rowActionsTemplate = computed(
    () => this.rowActionsDirective()?.template ?? null,
  );

  protected readonly rowActionsEnabled = computed(
    () => !!this.rowActionsTemplate() || this.rowQuickActions().length > 0,
  );

  protected readonly effectiveRowQuickActionsMode = computed((): PixelDataGridRowQuickActionsMode => {
    // Do not force `always` on coarse pointers — that stacks a pill on every row and
    // crushes mobile layouts. Touch uses sticky tap ownership via pointer handlers.
    return this.rowQuickActionsMode();
  });

  protected onHostPointerDown(event: PointerEvent): void {
    this.rowActionsKeyboardNav.set(false);
    if (!this.coarsePointer() || !this.rowActionsEnabled()) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const row = target.closest('[data-pixel-row-id]');
    if (!row || !this.hostRef.nativeElement.contains(row)) {
      // Tap outside data rows clears sticky pill (menu-open row stays via menu-open class).
      if (this.rowActionsMenuOpenFor() == null) {
        this.pointerHoverRowId.set(null);
      }
      return;
    }
    const rowKey = row.getAttribute('data-pixel-row-id');
    if (rowKey == null) {
      return;
    }
    const menuOpenFor = this.rowActionsMenuOpenFor();
    if (menuOpenFor != null && String(menuOpenFor) !== rowKey) {
      return;
    }
    this.pointerHoverRowId.set(rowKey);
    this.blurStuckRowActionsFocus(rowKey);
  }

  protected onHostKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Tab' || event.key.startsWith('Arrow') || event.key === 'Home' || event.key === 'End') {
      this.rowActionsKeyboardNav.set(true);
    }
  }

  protected onRowActionsPointerEnter(rowKey: string | number): void {
    const menuOpenFor = this.rowActionsMenuOpenFor();
    // While an overflow menu is open, only that row may own hover — avoid a second pill.
    if (menuOpenFor != null && menuOpenFor !== rowKey) {
      return;
    }
    this.pointerHoverRowId.set(rowKey);
    this.blurStuckRowActionsFocus(rowKey);
  }

  protected onRowActionsPointerLeave(rowKey: string | number, event: PointerEvent): void {
    // Keep hover ownership on the menu-owner row even if the pointer drifts to another row
    // (hover enter on others is ignored while the menu is open).
    if (this.rowActionsMenuOpenFor() === rowKey) {
      return;
    }
    // Coarse / touch: finger lift fires pointerleave — keep sticky tap ownership until
    // another row (or outside) is tapped via onHostPointerDown.
    if (this.coarsePointer()) {
      return;
    }
    const next = event.relatedTarget;
    if (next instanceof Node && this.hostRef.nativeElement.contains(next)) {
      const nextRow = (next as Element).closest?.('[data-pixel-row-id]');
      if (nextRow) {
        // Moving to another row — enter handler on that row owns hover.
        if (this.pointerHoverRowId() === rowKey) {
          this.pointerHoverRowId.set(null);
        }
        return;
      }
    }
    if (this.pointerHoverRowId() === rowKey) {
      this.pointerHoverRowId.set(null);
    }
  }

  /** Drop focus left in another row so `:focus-within` cannot freeze its pill. */
  private blurStuckRowActionsFocus(activeRowKey: string | number): void {
    if (typeof document === 'undefined') {
      return;
    }
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || !this.hostRef.nativeElement.contains(active)) {
      return;
    }
    const activeRow = active.closest('[data-pixel-row-id]');
    if (!activeRow) {
      return;
    }
    const focusedKey = activeRow.getAttribute('data-pixel-row-id');
    if (focusedKey == null || focusedKey === String(activeRowKey)) {
      return;
    }
    if (this.rowActionsMenuOpenFor() != null && String(this.rowActionsMenuOpenFor()) === focusedKey) {
      return;
    }
    active.blur();
  }

  protected isRowActionsHovered(rowKey: string | number): boolean {
    return this.pointerHoverRowId() === rowKey;
  }

  protected resolvedRowActions(row: T): PixelDataGridRowQuickAction<T>[] {
    return this.rowQuickActions().filter((action) => {
      if (action.visible && !action.visible(row)) {
        return false;
      }
      const access = action.access;
      if (!access) {
        return true;
      }
      if (!this.auth) {
        return false;
      }
      if (this.auth.shouldShowWhilePending()) {
        return true;
      }
      const key = typeof access === 'function' ? access(row)?.trim() : access.trim();
      if (!key) {
        return true;
      }
      return (
        this.auth.authorize({
          permission: key,
          action: 'view',
          resource: { type: 'row', id: String(this.rowId()(row, 0)) },
        }).status === 'allow'
      );
    });
  }

  protected visibleQuickActions(row: T): PixelDataGridRowQuickAction<T>[] {
    const max = Math.max(0, Math.floor(this.rowQuickActionsMaxVisible()) || 0);
    return this.resolvedRowActions(row).slice(0, max);
  }

  protected overflowQuickActions(row: T): PixelDataGridRowQuickAction<T>[] {
    const max = Math.max(0, Math.floor(this.rowQuickActionsMaxVisible()) || 0);
    return this.resolvedRowActions(row).slice(max);
  }

  protected isQuickActionDisabled(action: PixelDataGridRowQuickAction<T>, row: T): boolean {
    const disabled = action.disabled;
    if (typeof disabled === 'function') {
      return disabled(row);
    }
    return !!disabled;
  }

  protected onRowQuickAction(
    action: PixelDataGridRowQuickAction<T>,
    row: T,
    index: number,
    event: Event,
  ): void {
    event.stopPropagation();
    if (this.isQuickActionDisabled(action, row)) {
      return;
    }
    this.rowQuickAction.emit({
      actionId: action.id,
      row,
      index,
      originalEvent: event,
    });
  }

  protected onRowActionsMenuOpenChange(rowKey: string | number, open: boolean): void {
    this.rowActionsMenuOpenFor.set(open ? rowKey : null);
    if (open) {
      // Drop stray hover on other rows so only the menu owner shows a pill.
      this.pointerHoverRowId.set(rowKey);
    }
  }

  protected isRowActionsMenuOpen(rowKey: string | number): boolean {
    return this.rowActionsMenuOpenFor() === rowKey;
  }

  // ── Column tooling: pin / width / drag view helpers ──────────────────────────────────────
  protected pinSide(column: PixelDataGridColumn<T>): PixelDataGridPinSide | null {
    return this.store.columnPin(column);
  }

  protected columnWidthStyle(column: PixelDataGridColumn<T>): string | null {
    const resolved = this.resolvedLayoutWidths()?.[column.field];
    if (resolved !== undefined) {
      return `${resolved}px`;
    }

    const resized = this.store.columnWidths()[column.field];
    if (resized !== undefined) {
      return `${resized}px`;
    }
    if (this.pinSide(column)) {
      return `${this.store.columnEffectiveWidthPx(column)}px`;
    }
    return column.width !== undefined ? `${column.width}px` : null;
  }

  protected effectiveColumnMinWidth(column: PixelDataGridColumn<T>): number {
    const headerPx = this.headerMinWidths()[column.field] ?? 0;
    return effectiveColumnMinWidthPx(column, headerPx, this.resolvedDefaultColumnMinWidth());
  }

  /** Sanitized readable floor for omitted `column.minWidth` (never negative / NaN). */
  private resolvedDefaultColumnMinWidth(): number {
    const value = this.defaultColumnMinWidth();
    if (!Number.isFinite(value) || value < 0) {
      return MIN_LAYOUT_COLUMN_PX;
    }
    return Math.round(value);
  }

  private headerMinContextForColumn(
    column: PixelDataGridColumn<T>,
  ): PixelDataGridHeaderMinWidthContext {
    return {
      headerLabel: this.headerLabel(column),
      density: this.density(),
      sortable: !!column.sortable,
      sortPriority: this.sortPriority(column),
      showSortPriority: this.showSortPriority(),
      pinned: this.pinSide(column),
      hasFilter: !!column.filter,
      reorderable: this.reorderableColumns() && !this.pinSide(column),
      showColumnMenu: this.showColumnMenu(),
    };
  }

  private refreshDomHeaderMinWidths(): void {
    const scroller = this.scrollerRef()?.nativeElement;
    if (!scroller) {
      return;
    }
    const headers = scroller.querySelectorAll<HTMLElement>(
      'th.pixel-data-grid__cell--header[data-field]',
    );
    const measured: Record<string, number> = {};
    for (const th of headers) {
      const field = th.dataset['field'];
      if (!field) {
        continue;
      }
      const px = measureHeaderMinWidthFromElement(th);
      if (px > 0) {
        measured[field] = px;
      }
    }
    this.domHeaderMinWidths.set(measured);
  }

  protected showCellOverflowTooltip(column: PixelDataGridColumn<T>): boolean {
    return (
      this.cellTooltipWhenTruncated() &&
      !this.cellTemplateFor(column.field) &&
      this.columnCellOverflow(column) !== 'clip'
    );
  }

  protected columnCellOverflow(column: PixelDataGridColumn<T>): 'ellipsis' | 'clip' {
    return column.overflow ?? 'ellipsis';
  }

  protected pinLeftOffset(column: PixelDataGridColumn<T>): number | null {
    if (this.pinSide(column) !== 'left') {
      return null;
    }
    return this.store.pinLayout().leftOffset[column.field] ?? 0;
  }

  protected pinRightOffset(column: PixelDataGridColumn<T>): number | null {
    if (this.pinSide(column) !== 'right') {
      return null;
    }
    return this.store.pinLayout().rightOffset[column.field] ?? 0;
  }

  protected isResizable(column: PixelDataGridColumn<T>): boolean {
    return column.resizable ?? this.resizableColumns();
  }

  protected isDropBefore(column: PixelDataGridColumn<T>): boolean {
    const target = this.dropTarget();
    return !!target && target.field === column.field && !target.after && this.dragField() !== column.field;
  }

  protected isDropAfter(column: PixelDataGridColumn<T>): boolean {
    const target = this.dropTarget();
    return !!target && target.field === column.field && target.after && this.dragField() !== column.field;
  }

  // ── Column resize (pointer) ──────────────────────────────────────────────────────────────
  protected onResizeStart(column: PixelDataGridColumn<T>, event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const now = performance.now();
    if (now - this.lastResizePointerDownAt < RESIZE_DOUBLE_CLICK_MS) {
      return;
    }
    this.lastResizePointerDownAt = now;
    this.resizeDidMove = false;
    const handle = event.target as HTMLElement;
    const headerCell = handle.closest('th');
    const resolved = this.resolvedLayoutWidths()?.[column.field];
    const storeWidth = this.store.columnWidths()[column.field];
    const startWidth =
      headerCell?.getBoundingClientRect().width ??
      resolved ??
      storeWidth ??
      this.store.columnEffectiveWidthPx(column);
    this.resizeState = {
      field: column.field,
      startX: event.clientX,
      startWidth,
      minWidth: this.effectiveColumnMinWidth(column),
      maxWidth: column.maxWidth,
    };
    this.resizeBaselineWidths = {
      ...(untracked(() => this.resolvedLayoutWidths()) ?? {}),
    };
    handle.setPointerCapture(event.pointerId);
  }

  protected onResizeMove(event: PointerEvent): void {
    if (!this.resizeState) {
      return;
    }
    this.resizePointerX = event.clientX;
    if (this.resizeFrame != null) {
      return;
    }
    this.resizeFrame = requestAnimationFrame(() => this.flushResizeMove());
  }

  protected onResizeEnd(): void {
    this.flushResizeMove();
    this.cancelResizeFrame();
    if (!this.resizeState) {
      return;
    }
    const didMove = this.resizeDidMove;
    this.resizeState = null;
    this.resizeBaselineWidths = null;
    this.columnResizingSignal.set(false);
    if (didMove) {
      this.refreshDomHeaderMinWidths();
      this.emitState();
    }
  }

  private flushResizeMove(): void {
    this.resizeFrame = null;
    const state = this.resizeState;
    const pointerX = this.resizePointerX;
    if (!state || pointerX == null) {
      return;
    }
    const delta = pointerX - state.startX;
    if (delta !== 0) {
      this.resizeDidMove = true;
      this.columnResizingSignal.set(true);
    }
    let next = Math.max(state.minWidth, Math.round(state.startWidth + delta));
    if (state.maxWidth != null) {
      next = Math.min(next, state.maxWidth);
    }
    const current = this.store.columnWidths()[state.field];
    if (current === next) {
      return;
    }
    this.store.setColumnWidth(state.field, next, state.minWidth, state.maxWidth);
  }

  private cancelResizeFrame(): void {
    if (this.resizeFrame != null) {
      cancelAnimationFrame(this.resizeFrame);
      this.resizeFrame = null;
    }
    this.resizePointerX = null;
  }

  /** Double-click the handle to clear a manual width and return to auto sizing. */
  protected onResizeReset(column: PixelDataGridColumn<T>, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.cancelResizeFrame();
    this.resizeState = null;
    this.resizeBaselineWidths = null;
    this.resizeDidMove = false;
    this.lastResizePointerDownAt = 0;
    this.columnResizingSignal.set(false);
    this.store.resetColumnWidth(column.field);
    this.refreshDomHeaderMinWidths();
    this.emitState();
  }

  // ── Column reorder (HTML5 drag-and-drop) ─────────────────────────────────────────────────
  protected onHeaderDragStart(column: PixelDataGridColumn<T>, event: DragEvent): void {
    if (!this.reorderableColumns()) {
      event.preventDefault();
      return;
    }
    this.dragField.set(column.field);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', column.field);
    }
    this.stopDragPreview();
    const headerCell = (event.currentTarget as HTMLElement | null)?.closest('th');
    if (headerCell) {
      this.dragPreviewSession = startColumnDragPreview(
        event,
        headerCell as HTMLElement,
        this.hostRef.nativeElement,
      );
    }
  }

  protected onHeaderDragOver(column: PixelDataGridColumn<T>, event: DragEvent): void {
    // Pinned columns can't be reordered into/out of their frozen section, so they aren't drop
    // targets (no preventDefault → drop is rejected here, and no indicator is shown).
    if (!this.dragField() || this.pinSide(column)) {
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const cols = this.visibleColumns();
    const dragIdx = cols.findIndex((c) => c.field === this.dragField());
    const targetIdx = cols.findIndex((c) => c.field === column.field);
    // When the dragged column is the immediate left neighbour, placing it "before" the
    // target would be a no-op (same position). Force "after" for the whole target width.
    // Mirror for the immediate right neighbour.
    let after: boolean;
    if (dragIdx === targetIdx - 1) {
      after = true;
    } else if (dragIdx === targetIdx + 1) {
      after = false;
    } else {
      after = event.clientX > rect.left + rect.width / 2;
    }
    this.dropTarget.set({ field: column.field, after });
  }

  protected onHeaderDrop(column: PixelDataGridColumn<T>, event: DragEvent): void {
    event.preventDefault();
    const from = this.dragField();
    const target = this.dropTarget();
    if (from && target && !this.pinSide(column)) {
      this.store.reorderColumn(from, target.field, target.after);
    }
    this.endHeaderDrag();
    this.emitState();
  }

  protected onHeaderDragEnd(): void {
    this.stopDragPreview();
    this.endHeaderDrag();
  }

  private endHeaderDrag(): void {
    this.dragField.set(null);
    this.dropTarget.set(null);
  }

  private stopDragPreview(): void {
    this.dragPreviewSession?.cleanup();
    this.dragPreviewSession = null;
  }

  /** Reorder requested from the "Manage columns" panel's vertical drag list. */
  protected onPanelReorder(event: PixelDataGridColumnsPanelReorderEvent): void {
    this.store.reorderColumn(event.field, event.targetField, event.after);
    this.emitState();
  }

  // ── Column header menu actions ───────────────────────────────────────────────────────────
  protected setColumnSort(column: PixelDataGridColumn<T>, direction: 'asc' | 'desc' | null): void {
    const next: PixelDataGridSortDescriptor[] = direction
      ? [{ field: column.field, direction }]
      : this.sortModel().filter((descriptor) => descriptor.field !== column.field);
    this.sortModel.set(next);
    if (this.paginated()) {
      this.pageIndex.set(0);
    }
    this.sortChange.emit({ sort: next });
    this.emitCriteria();
    trackPixelUiAnalytics(this.analytics, {
      name: 'data.table.sort',
      component: { name: 'pixel-data-grid' },
      properties: {
        ...(this.analyticsId().trim() ? { gridId: this.analyticsId().trim() } : {}),
        field: column.field,
        ...(direction ? { direction } : {}),
        columnCount: next.length,
        additive: false,
        source: 'column-menu',
      },
    });
  }

  protected pinColumn(column: PixelDataGridColumn<T>, side: PixelDataGridPinSide | null): void {
    this.store.setColumnPinned(column.field, side);
    this.emitState();
  }

  protected toggleColumnVisibility(column: PixelDataGridColumn<T>): void {
    if (column.lockVisible) {
      return;
    }
    this.store.toggleColumnHidden(column);
    this.emitVisibility();
    this.emitState();
  }

  protected hideColumn(column: PixelDataGridColumn<T>): void {
    if (column.lockVisible) {
      return;
    }
    this.store.setColumnHidden(column.field, true);
    this.emitVisibility();
    this.emitState();
  }

  // ── View state (public API) ──────────────────────────────────────────────────────────────
  /** Returns the full view-state snapshot (columns + sort + filters + search + page). */
  getState(): PixelDataGridState {
    return {
      columns: this.store.columnStates(),
      sort: this.sortModel(),
      filters: this.filters(),
      quickFilter: this.quickFilter(),
      page: { pageIndex: this.pageIndex(), pageSize: this.pageSize() },
    };
  }

  /** Applies a previously captured view state. */
  setState(state: PixelDataGridState): void {
    this.store.applyColumnStates(state.columns ?? []);
    this.sortModel.set(state.sort ?? []);
    this.filters.set(state.filters ?? {});
    this.quickFilter.set(state.quickFilter ?? '');
    if (state.page) {
      this.pageIndex.set(state.page.pageIndex);
      this.pageSize.set(state.page.pageSize);
    }
    this.emitVisibility();
    this.emitState();
  }

  /** Serializes the current view state to JSON. */
  getStateJson(pretty = false): string {
    return gridStateToJson(this.getState(), pretty);
  }

  /** Loads a view state from JSON. Returns `false` when the payload is malformed. */
  setStateFromJson(json: string): boolean {
    const parsed = parseGridState(json);
    if (!parsed) {
      return false;
    }
    this.setState(parsed);
    return true;
  }

  /** Clears all column overrides (order, widths, visibility, pinning). */
  resetColumns(): void {
    this.store.resetColumns();
    this.emitVisibility();
    this.emitState();
  }

  /** Serializes the current view state and, when `layoutKey` is set, persists it to localStorage. */
  saveLayout(): void {
    const json = this.getStateJson();
    const key = this.layoutKey();
    if (key) {
      writeGridLayout(key, json);
    }
    this.layoutSave.emit(json);
  }

  /** Restores the view state saved under `layoutKey`. Returns `false` if unset/missing/malformed. */
  restoreLayout(): boolean {
    const key = this.layoutKey();
    const json = key ? readGridLayout(key) : null;
    if (!json || !this.setStateFromJson(json)) {
      return false;
    }
    this.layoutRestore.emit(json);
    return true;
  }

  /** Resets column overrides and, when `layoutKey` is set, clears the persisted layout. */
  clearLayout(): void {
    this.resetColumns();
    const key = this.layoutKey();
    if (key) {
      clearGridLayout(key);
    }
    this.layoutClear.emit();
  }

  private emitVisibility(): void {
    this.columnVisibilityChange.emit(this.visibleColumns().map((column) => column.field));
  }

  private emitState(): void {
    this.stateChange.emit(this.getState());
  }

  // ── Selection (Phase 3) ──────────────────────────────────────────────────────────────────
  protected isSelected(row: T, index: number): boolean {
    return this.selectedKeys().has(this.rowId()(row, index));
  }

  protected onRowToggle(row: T, index: number, event?: MouseEvent | KeyboardEvent): void {
    event?.stopPropagation();
    const mode = this.selectionMode();
    if (mode === 'none') {
      return;
    }

    if (mode === 'single') {
      this.commitSelection(this.isSelected(row, index) ? [] : [row]);
      this.selectionAnchor = index;
      return;
    }

    // multiple — shift-click selects the range from the anchor to the clicked row.
    if (event?.shiftKey && this.selectionAnchor !== null) {
      const rows = this.displayRows();
      const [from, to] = [this.selectionAnchor, index].sort((a, b) => a - b);
      const range = rows.slice(from, to + 1);
      const idFn = this.rowId();
      const next = [...this.selectedRows()];
      const seen = new Set(next.map((selected, selectedIndex) => idFn(selected, selectedIndex)));
      for (const candidate of range) {
        const key = idFn(candidate, 0);
        if (!seen.has(key)) {
          seen.add(key);
          next.push(candidate);
        }
      }
      this.commitSelection(next);
      return;
    }

    const idFn = this.rowId();
    const key = idFn(row, index);
    const current = this.selectedRows();
    const exists = current.some((selected, selectedIndex) => idFn(selected, selectedIndex) === key);
    this.commitSelection(
      exists
        ? current.filter((selected, selectedIndex) => idFn(selected, selectedIndex) !== key)
        : [...current, row],
    );
    this.selectionAnchor = index;
  }

  protected onToggleAllPage(): void {
    if (this.selectionMode() !== 'multiple') {
      return;
    }
    if (this.allPageSelected()) {
      const page = new Set(this.displayRows());
      this.commitSelection(this.selectedRows().filter((row) => !page.has(row)));
    } else {
      const current = this.selectedRows();
      const merged = [...current];
      for (const row of this.displayRows()) {
        if (!current.includes(row)) {
          merged.push(row);
        }
      }
      this.commitSelection(merged);
    }
  }

  /** Selects every row that passes the current filters (client mode only). */
  protected selectAllAcrossPages(): void {
    if (this.selectionMode() !== 'multiple' || this.serverSide() || this.dataSource()) {
      return;
    }
    this.commitSelection([...this.store.sortedRows()]);
  }

  /** Clears the entire selection. */
  clearSelection(): void {
    this.commitSelection([]);
  }

  /**
   * Reveals a row for deep-link / navigate flows: optional page jump (client-paged),
   * optional select, scroll into view, and a temporary highlight class.
   * For server-paged grids, pass `page` (the row must exist on that page's loaded data).
   *
   * @returns `true` when the row element was found after paging.
   */
  async revealRow(
    rowId: string | number,
    options: {
      readonly page?: number;
      readonly select?: boolean;
      readonly highlightMs?: number;
    } = {},
  ): Promise<boolean> {
    const idKey = String(rowId);
    const idFn = this.rowId();

    if (options.page != null && this.paginated()) {
      this.pageIndex.set(Math.max(0, options.page));
    } else if (this.paginated() && !this.serverSide() && !this.dataSource()) {
      const sorted = this.store.sortedRows();
      const index = sorted.findIndex((row, i) => String(idFn(row, i)) === idKey);
      if (index < 0) {
        return false;
      }
      const size = Math.max(1, this.pageSize());
      this.pageIndex.set(Math.floor(index / size));
    }

    await new Promise<void>((resolve) => {
      if (typeof requestAnimationFrame === 'undefined') {
        resolve();
        return;
      }
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    const rows = this.store.displayRows();
    const localIndex = rows.findIndex((row, i) => String(idFn(row, i)) === idKey);
    if (localIndex < 0) {
      return false;
    }

    if (options.select !== false && this.selectionMode() !== 'none') {
      const row = rows[localIndex];
      if (this.selectionMode() === 'single') {
        this.commitSelection([row]);
      } else {
        const current = this.selectedRows();
        const already = current.some((r, i) => String(idFn(r, i)) === idKey);
        if (!already) {
          this.commitSelection([...current, row]);
        }
      }
    }

    const host = this.hostRef.nativeElement;
    const escaped =
      typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
        ? CSS.escape(idKey)
        : idKey.replace(/["\\]/g, '\\$&');
    const rowEl = host.querySelector(
      `.pixel-data-grid__row[data-pixel-row-id="${escaped}"]`,
    ) as HTMLElement | null;
    if (!rowEl) {
      return false;
    }

    scrollToElement(rowEl, { offset: 8, behavior: 'smooth' });

    const highlightMs = options.highlightMs ?? 2_000;
    if (highlightMs > 0) {
      // Continuous ring via navigate overlay (tr outline paints per-cell in browsers).
      highlightElement(rowEl, highlightMs);
    }
    return true;
  }

  /** Stable string id for a row (used by `data-pixel-row-id` and reveal). */
  protected rowIdKey(row: T, index: number): string {
    return String(this.rowId()(row, index));
  }

  private commitSelection(rows: T[]): void {
    this.selectedRows.set(rows);
    this.selectionChange.emit(rows);
  }

  // ── Export (Phase 3) ─────────────────────────────────────────────────────────────────────
  protected toggleExportSelectedOnly(): void {
    this.exportSelectedOnly.update((value) => !value);
  }

  /** Columns included in exports (visible, not `exportable: false`). */
  private exportColumns(): PixelDataGridColumn<T>[] {
    return this.visibleColumns().filter((column) => column.exportable !== false);
  }

  /**
   * Exports rows for the given scope (defaults to the menu's selected/all toggle). For `all` in a
   * DataSource-backed grid, every row is fetched first via `fetch` with a full-page criteria.
   */
  exportData(
    format: PixelDataGridExportFormat,
    scope?: PixelDataGridExportScope,
    source: PixelDataGridExportSource = 'toolbar',
  ): void {
    if (!this.exportAccessAllowed()) {
      this.emitExportOutcome(format, {
        scope: scope ?? 'all',
        source,
        rowCount: 0,
        outcome: 'failure',
      });
      return;
    }
    const resolvedScope: PixelDataGridExportScope =
      scope ?? (this.exportSelectedOnly() && this.selectedRows().length ? 'selected' : 'all');

    if (resolvedScope === 'selected') {
      this.writeExport(format, this.selectedRows(), { scope: resolvedScope, source });
      return;
    }
    if (resolvedScope === 'page') {
      this.writeExport(format, [...this.displayRows()], { scope: resolvedScope, source });
      return;
    }

    // scope === 'all'
    const dataSource = this.dataSource();
    if (dataSource) {
      this.exportAllFromDataSource(dataSource, format, source);
      return;
    }
    const rows = this.serverSide() ? [...this.store.data()] : [...this.store.sortedRows()];
    this.writeExport(format, rows, { scope: resolvedScope, source });
  }

  private exportAllFromDataSource(
    source: PixelDataGridDataSource<T>,
    format: PixelDataGridExportFormat,
    exportSource: PixelDataGridExportSource,
  ): void {
    const total = this.store.effectiveTotal() || this.displayRows().length || 1;
    const result = source.fetch({
      sort: this.sortModel(),
      page: { pageIndex: 0, pageSize: total },
      quickFilter: this.quickFilter(),
      filters: this.filters(),
    });
    const stream = isObservable(result) ? result : from(Promise.resolve(result));
    this.exportSub?.unsubscribe();
    this.exportSub = stream.subscribe({
      next: (page) =>
        this.writeExport(format, page.rows as T[], {
          scope: 'all',
          source: exportSource,
          requestedRowCount: total,
        }),
      error: () =>
        this.emitExportOutcome(format, {
          scope: 'all',
          source: exportSource,
          rowCount: 0,
          outcome: 'failure',
        }),
    });
  }

  private writeExport(
    format: PixelDataGridExportFormat,
    rows: readonly T[],
    meta: {
      scope: PixelDataGridExportScope;
      source: PixelDataGridExportSource;
      requestedRowCount?: number;
    },
  ): void {
    const columns = toGridExportColumns(this.exportColumns(), this.l());
    const base = this.exportFileName();
    const partial =
      meta.requestedRowCount != null &&
      meta.requestedRowCount > 0 &&
      rows.length < meta.requestedRowCount;

    if (!rows.length) {
      this.emitExportOutcome(format, {
        scope: meta.scope,
        source: meta.source,
        rowCount: 0,
        columnCount: columns.length,
        outcome: 'empty',
      });
      return;
    }

    const onSuccess = () => {
      this.emitExportOutcome(format, {
        scope: meta.scope,
        source: meta.source,
        rowCount: rows.length,
        columnCount: columns.length,
        outcome: 'success',
        ...(partial ? { partial: true } : {}),
      });
    };

    const onFailure = () => {
      this.emitExportOutcome(format, {
        scope: meta.scope,
        source: meta.source,
        rowCount: rows.length,
        columnCount: columns.length,
        outcome: 'failure',
      });
    };

    switch (format) {
      case 'json': {
        try {
          const text = this.exporter.serializeJson(rows, columns);
          this.exporter.saveAs(text, `${base}.json`, 'application/json');
          onSuccess();
        } catch {
          onFailure();
        }
        return;
      }
      case 'excel': {
        void this.exporter
          .buildExcelBlob(rows, columns, { sheetName: base })
          .then((blob) => {
            this.exporter.saveAs(blob, `${base}.xlsx`);
            onSuccess();
          })
          .catch(() => onFailure());
        return;
      }
      case 'clipboard': {
        void this.exporter
          .copyText(this.exporter.serializeTsv(rows, columns))
          .then(() => onSuccess())
          .catch(() => onFailure());
        return;
      }
      default: {
        try {
          const text = this.exporter.serializeCsv(rows, columns);
          this.exporter.saveAs(text, `${base}.csv`, 'text/csv');
          onSuccess();
        } catch {
          onFailure();
        }
      }
    }
  }

  private emitExportOutcome(
    format: PixelDataGridExportFormat,
    payload: {
      scope: PixelDataGridExportScope;
      source: PixelDataGridExportSource;
      rowCount: number;
      columnCount?: number;
      outcome: PixelDataGridExportOutcome;
      partial?: boolean;
    },
  ): void {
    trackPixelUiAnalytics(this.analytics, {
      name: 'data.export',
      component: { name: 'pixel-data-grid' },
      properties: {
        ...(this.analyticsId().trim() ? { gridId: this.analyticsId().trim() } : {}),
        format,
        scope: payload.scope,
        rowCount: payload.rowCount,
        ...(payload.columnCount != null ? { columnCount: payload.columnCount } : {}),
        hasActiveFilters: this.hasActiveFilters(),
        source: payload.source,
        outcome: payload.outcome,
        ...(payload.partial ? { partial: true } : {}),
      },
    });
  }

  private hasActiveFilters(): boolean {
    return (
      Object.keys(this.filters()).length > 0 || this.quickFilter().trim().length > 0
    );
  }

  /** Guarded analytics id: `{gridId}-{suffix}` or empty when grid has no analyticsId. */
  protected gridAnalyticsId(suffix: string): string {
    const gid = this.analyticsId().trim();
    return gid ? `${gid}-${suffix}` : '';
  }

  protected gridAnalyticsFilterId(field: string, part: 'menu' | 'operator' | 'value'): string {
    const gid = this.analyticsId().trim();
    if (!gid) {
      return '';
    }
    if (part === 'menu') {
      return `${gid}-filter-${field}`;
    }
    return `${gid}-filter-${field}-${part}`;
  }

  protected gridAnalyticsColumnMenuId(field: string): string {
    const gid = this.analyticsId().trim();
    return gid ? `${gid}-column-${field}` : '';
  }

  protected exportLabel(format: PixelDataGridExportFormat): string {
    const labels = this.l();
    switch (format) {
      case 'csv':
        return labels.exportAsCsv;
      case 'json':
        return labels.exportAsJson;
      case 'excel':
        return labels.exportAsExcel;
      case 'clipboard':
        return labels.copyToClipboard;
      default:
        return labels.exportAsCsv;
    }
  }

  // ── Grouping & master-detail (Phase 5) ────────────────────────────────────────────────────
  protected renderRowKey = (_index: number, renderRow: PixelDataGridRenderRow<T>): string =>
    gridRenderRowKey(renderRow);

  protected groupFieldHeader(field: string): string {
    const column = this.columnByField().get(field);
    return column ? gridHeaderLabel(column) : field;
  }

  protected groupRowLabel(group: PixelDataGridGroupRow): string {
    return `${this.groupFieldHeader(group.field)}: ${group.label}`;
  }

  protected toggleGroup(group: PixelDataGridGroupRow): void {
    this.store.toggleGroup(group.key);
  }

  /** Expands every group. */
  expandAllGroups(): void {
    this.store.expandAllGroups();
  }

  /** Collapses every group. */
  collapseAllGroups(): void {
    this.store.collapseAllGroups();
  }

  protected isDetailExpanded(row: T, index: number): boolean {
    return this.store.isDetailExpanded(this.rowId()(row, index));
  }

  protected onDetailToggle(row: T, index: number, event?: Event): void {
    event?.stopPropagation();
    this.store.toggleDetail(this.rowId()(row, index));
  }

  /** Formats an aggregate value (numbers locale-formatted; avg trimmed to 2 dp). */
  protected formatAggregate(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'number') {
      return Number.isInteger(value)
        ? value.toLocaleString()
        : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    return String(value);
  }

  protected columnAggregate(
    column: PixelDataGridColumn<T>,
    aggregates: Record<string, unknown>,
  ): string {
    return this.formatAggregate(aggregates[column.field]);
  }

  // ── Inline editing (Phase 6) ──────────────────────────────────────────────────────────────
  protected isEditable(column: PixelDataGridColumn<T>): boolean {
    return this.editable() && !!column.editable;
  }

  protected isEditing(rowIndex: number, column: PixelDataGridColumn<T>): boolean {
    const editing = this.editingCell();
    return !!editing && editing.rowIndex === rowIndex && editing.field === column.field;
  }

  protected editorTemplateFor(field: string): PixelDataGridEditorDirective | undefined {
    return this.editorTemplateMap().get(field);
  }

  protected editorOptionsFor(column: PixelDataGridColumn<T>): PixelSelectOption[] {
    return (column.editorOptions ?? []).map((option) => ({
      value: option.value,
      label: option.label,
    }));
  }

  protected startEdit(
    row: T,
    rowIndex: number,
    column: PixelDataGridColumn<T>,
    event?: Event,
  ): void {
    if (!this.isEditable(column)) {
      return;
    }
    event?.stopPropagation();
    this.editingCell.set({ rowIndex, field: column.field });
    this.editDraft.set((row as Record<string, unknown>)[column.field]);
    this.editError.set(null);
    setTimeout(() => this.focusEditor(), 0);
  }

  /** Closure passed to a custom `pixelGridEditor` template's context. */
  protected makeCommit(
    row: T,
    rowIndex: number,
    column: PixelDataGridColumn<T>,
  ): (value?: unknown) => void {
    return (value?: unknown) => this.commitEdit(row, rowIndex, column, value);
  }

  protected makeCancel(): () => void {
    return () => this.cancelEdit();
  }

  /** Updates the draft and clears a stale validation error as the user types. */
  protected onEditDraftChange(value: unknown): void {
    this.editDraft.set(value);
    if (this.editError()) {
      this.editError.set(null);
    }
  }

  protected commitEdit(
    row: T,
    rowIndex: number,
    column: PixelDataGridColumn<T>,
    value?: unknown,
  ): void {
    const editing = this.editingCell();
    if (!editing || editing.rowIndex !== rowIndex || editing.field !== column.field) {
      // Guards against double-commit (e.g. Enter then blur once focus moves).
      return;
    }
    const next = value === undefined ? this.editDraft() : value;
    const error = column.validate ? column.validate(next, row) : null;
    if (error) {
      // Keep the attempted value in the draft so immediate-commit editors (select / date /
      // checkbox) stay visually in sync while showing error chrome.
      if (value !== undefined) {
        this.editDraft.set(next);
      }
      this.editError.set(error);
      return;
    }
    const record = row as Record<string, unknown>;
    const oldValue = record[column.field];
    record[column.field] = next;
    this.editingCell.set(null);
    this.editError.set(null);
    this.cellEdit.emit({ row, field: column.field, rowIndex, oldValue, newValue: next });
    this.refocusCell(rowIndex, column);
  }

  protected cancelEdit(rowIndex?: number, column?: PixelDataGridColumn<T>): void {
    this.editingCell.set(null);
    this.editError.set(null);
    if (rowIndex !== undefined && column) {
      this.refocusCell(rowIndex, column);
    }
  }

  protected onEditorKeydown(
    event: KeyboardEvent,
    row: T,
    rowIndex: number,
    column: PixelDataGridColumn<T>,
  ): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      // Stop the keydown reaching the grid's nav handler (which would re-open the editor).
      event.stopPropagation();
      this.commitEdit(row, rowIndex, column);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.cancelEdit(rowIndex, column);
    }
  }

  private focusEditor(): void {
    const editing = this.hostRef.nativeElement.querySelector('.pixel-data-grid__cell--editing');
    const focusable = editing?.querySelector<HTMLElement>(
      'input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();
  }

  private refocusCell(rowIndex: number, column: PixelDataGridColumn<T>): void {
    const colIndex = this.visibleColumns().indexOf(column);
    if (colIndex < 0) {
      return;
    }
    this.focusedCell.set({ row: rowIndex, col: colIndex });
    setTimeout(() => this.focusCellAt(rowIndex, colIndex), 0);
  }

  // ── Keyboard navigation & ARIA (Phase 6) ──────────────────────────────────────────────────
  protected cellTabIndex(rowIndex: number, colIndex: number): number {
    if (!this.keyboardNavEnabled()) {
      return -1;
    }
    const focused = this.focusedCell();
    if (focused) {
      return focused.row === rowIndex && focused.col === colIndex ? 0 : -1;
    }
    return rowIndex === 0 && colIndex === 0 ? 0 : -1;
  }

  protected onCellFocus(rowIndex: number, colIndex: number): void {
    if (this.keyboardNavEnabled()) {
      this.focusedCell.set({ row: rowIndex, col: colIndex });
    }
  }

  protected onGridKeydown(event: KeyboardEvent): void {
    // Ignore keystrokes originating inside an editor / form control (commit/cancel handle those).
    const target = event.target as HTMLElement | null;
    if (target?.closest('.pixel-data-grid__editor, input, select, textarea')) {
      return;
    }
    if (this.editingCell() || !this.keyboardNavEnabled()) {
      return;
    }
    const rows = this.viewRows().length;
    const cols = this.visibleColumns().length;
    if (rows === 0 || cols === 0) {
      return;
    }
    const current = this.focusedCell() ?? { row: 0, col: 0 };
    let { row, col } = current;

    switch (event.key) {
      case 'ArrowDown':
        row = Math.min(rows - 1, row + 1);
        break;
      case 'ArrowUp':
        row = Math.max(0, row - 1);
        break;
      case 'ArrowRight':
        col = Math.min(cols - 1, col + 1);
        break;
      case 'ArrowLeft':
        col = Math.max(0, col - 1);
        break;
      case 'Home':
        col = 0;
        break;
      case 'End':
        col = cols - 1;
        break;
      case 'Enter':
      case 'F2': {
        const column = this.visibleColumns()[col];
        const targetRow = this.viewRows()[row];
        if (column && targetRow != null && this.isEditable(column)) {
          this.startEdit(targetRow, row, column);
          event.preventDefault();
        }
        return;
      }
      default:
        return;
    }
    event.preventDefault();
    this.focusedCell.set({ row, col });
    this.focusCellAt(row, col);
  }

  private focusCellAt(row: number, col: number): void {
    const cell = this.hostRef.nativeElement.querySelector<HTMLElement>(
      `[data-r="${row}"][data-c="${col}"]`,
    );
    cell?.focus();
  }

  // ── Sorting ───────────────────────────────────────────────────────────────────────────────
  protected onHeaderSort(column: PixelDataGridColumn<T>, event: MouseEvent): void {
    if (!column.sortable) {
      return;
    }
    const additive = this.multiSort() && event.shiftKey;
    const next = cycleGridSort(this.sortModel(), column.field, additive);
    this.sortModel.set(next);
    if (this.paginated()) {
      this.pageIndex.set(0);
    }
    this.sortChange.emit({ sort: next });
    this.emitCriteria();
    const primary = next[0];
    trackPixelUiAnalytics(this.analytics, {
      name: 'data.table.sort',
      component: { name: 'pixel-data-grid' },
      properties: {
        ...(this.analyticsId().trim() ? { gridId: this.analyticsId().trim() } : {}),
        field: column.field,
        ...(primary?.field === column.field && primary.direction
          ? { direction: primary.direction }
          : {}),
        columnCount: next.length,
        additive,
        source: 'header',
      },
    });
  }

  protected sortDirection(column: PixelDataGridColumn<T>): 'asc' | 'desc' | null {
    return this.store.sortDescriptorFor(column.field)?.direction ?? null;
  }

  protected sortPriority(column: PixelDataGridColumn<T>): number {
    return this.store.sortPriorityFor(column.field);
  }

  protected sortIcon(column: PixelDataGridColumn<T>): string {
    const direction = this.sortDirection(column);
    if (!direction) {
      return 'unfold_more';
    }
    return direction === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  protected ariaSort(
    column: PixelDataGridColumn<T>,
  ): 'ascending' | 'descending' | 'none' | null {
    if (!column.sortable) {
      return null;
    }
    const direction = this.sortDirection(column);
    if (!direction) {
      return 'none';
    }
    return direction === 'asc' ? 'ascending' : 'descending';
  }

  // ── Quick filter ──────────────────────────────────────────────────────────────────────────
  protected onQuickFilter(value: string): void {
    this.quickFilter.set(value);
    if (this.paginated()) {
      this.pageIndex.set(0);
    }
    this.emitCriteria();
    if (this.searchAnalyticsTimer) {
      clearTimeout(this.searchAnalyticsTimer);
    }
    this.searchAnalyticsTimer = setTimeout(() => {
      this.searchAnalyticsTimer = null;
      trackPixelUiAnalytics(this.analytics, {
        name: 'data.table.search',
        component: { name: 'pixel-data-grid' },
        properties: {
          ...(this.analyticsId().trim() ? { gridId: this.analyticsId().trim() } : {}),
          hasQuery: value.trim().length > 0,
        },
      });
    }, 400);
  }

  // ── Per-column filters ────────────────────────────────────────────────────────────────────
  protected operatorsFor(column: PixelDataGridColumn<T>): readonly PixelDataGridFilterOperator[] {
    return column.filter ? gridOperatorsFor(column.filter) : [];
  }

  protected currentFilter(field: string): PixelDataGridFilterValue | null {
    return this.filters()[field] ?? null;
  }

  protected filterOperator(column: PixelDataGridColumn<T>): PixelDataGridFilterOperator {
    return this.currentFilter(column.field)?.operator ?? this.operatorsFor(column)[0];
  }

  protected filterValue(column: PixelDataGridColumn<T>): unknown {
    return this.currentFilter(column.field)?.value ?? '';
  }

  /** Binds the date filter control; filter state keeps a serializable `YYYY-MM-DD` string. */
  protected filterDateValue(column: PixelDataGridColumn<T>): Date | null {
    return parseGridDate(this.filterValue(column));
  }

  protected onFilterDateChange(column: PixelDataGridColumn<T>, date: Date | null): void {
    this.applyFilter(column, this.filterOperator(column), date ? formatExportDate(date) : '');
  }

  /** Draft value for the built-in date editor (`Date` or null). */
  protected editDateValue(): Date | null {
    return parseGridDate(this.editDraft());
  }

  protected onEditDateChange(
    row: T,
    rowIndex: number,
    column: PixelDataGridColumn<T>,
    date: Date | null,
  ): void {
    this.editDraft.set(date);
    this.commitEdit(row, rowIndex, column, date);
  }

  protected hasFilter(column: PixelDataGridColumn<T>): boolean {
    return !!this.filters()[column.field];
  }

  /** `pixel-select` options for a column's filter operators. */
  protected operatorOptions(column: PixelDataGridColumn<T>): PixelSelectOption[] {
    const labels = this.resolvedOperatorLabels();
    return this.operatorsFor(column).map((operator) => ({
      value: operator,
      label: labels[operator],
    }));
  }

  /** `pixel-select` options for a `select` column filter (with an "Any" reset). */
  protected filterSelectOptions(column: PixelDataGridColumn<T>): PixelSelectOption[] {
    const options = column.filter?.options ?? [];
    return [
      { value: '', label: this.l().filterAny },
      ...options.map((option) => ({ value: option.value, label: option.label })),
    ];
  }

  protected readonly booleanFilterOptions = computed<PixelSelectOption[]>(() => {
    const labels = this.l();
    return [
      { value: '', label: labels.filterAny },
      { value: 'true', label: labels.booleanYes },
      { value: 'false', label: labels.booleanNo },
    ];
  });

  protected isValuelessOperator(operator: PixelDataGridFilterOperator): boolean {
    return isValuelessGridOperator(operator);
  }

  protected applyFilter(
    column: PixelDataGridColumn<T>,
    operator: PixelDataGridFilterOperator,
    rawValue: unknown,
  ): void {
    if (
      !this.isValuelessOperator(operator) &&
      (rawValue === null || rawValue === undefined || rawValue === '')
    ) {
      this.clearFilter(column);
      return;
    }
    this.filters.set({ ...this.filters(), [column.field]: { operator, value: rawValue } });
    if (this.paginated()) {
      this.pageIndex.set(0);
    }
    this.emitCriteria();
    trackPixelUiAnalytics(this.analytics, {
      name: 'data.table.filter',
      component: { name: 'pixel-data-grid' },
      properties: {
        ...(this.analyticsId().trim() ? { gridId: this.analyticsId().trim() } : {}),
        field: column.field,
        operator,
        ...(column.filter?.type ? { filterType: column.filter.type } : {}),
      },
    });
  }

  protected clearFilter(column: PixelDataGridColumn<T>): void {
    const next = { ...this.filters() };
    if (!(column.field in next)) {
      return;
    }
    delete next[column.field];
    this.filters.set(next);
    this.emitCriteria();
    trackPixelUiAnalytics(this.analytics, {
      name: 'data.table.filter.clear',
      component: { name: 'pixel-data-grid' },
      properties: {
        ...(this.analyticsId().trim() ? { gridId: this.analyticsId().trim() } : {}),
        field: column.field,
      },
    });
  }

  // ── Pagination ────────────────────────────────────────────────────────────────────────────
  /** Bridges the embedded `pixel-paginator` page event to the grid's models + outputs. */
  protected onPaginatorPage(event: PixelPageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.pageChange.emit({ pageIndex: event.pageIndex, pageSize: event.pageSize });
    this.emitCriteria();
    trackPixelUiAnalytics(this.analytics, {
      name: 'data.table.page',
      component: { name: 'pixel-data-grid' },
      properties: {
        ...(this.analyticsId().trim() ? { gridId: this.analyticsId().trim() } : {}),
        pageIndex: event.pageIndex,
        pageSize: event.pageSize,
      },
    });
  }

  // ── Criteria & data source ────────────────────────────────────────────────────────────────
  private buildCriteria(): PixelDataGridCriteria {
    return {
      sort: this.sortModel(),
      page: { pageIndex: this.pageIndex(), pageSize: this.pageSize() },
      quickFilter: this.quickFilter(),
      filters: this.filters(),
    };
  }

  private emitCriteria(): void {
    this.criteriaChange.emit(this.buildCriteria());
  }

  private runFetch(source: PixelDataGridDataSource<T>, criteria: PixelDataGridCriteria): void {
    this.fetchSub?.unsubscribe();
    this.fetchLoading.set(true);
    const result = source.fetch(criteria);
    const stream = isObservable(result) ? result : from(Promise.resolve(result));
    this.fetchSub = stream.subscribe({
      next: (page) => {
        this.store.data.set(page.rows as readonly T[]);
        this.store.totalRecords.set(page.total);
        this.fetchLoading.set(false);
      },
      error: () => this.fetchLoading.set(false),
    });
  }
}
