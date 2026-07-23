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
  input,
  model,
  numberAttribute,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { type Subscription, from, isObservable } from 'rxjs';
import PixelButtonComponent from '../pixel-button/pixel-button';
import PixelCheckboxComponent from '../pixel-checkbox/pixel-checkbox';
import PixelDrawerComponent from '../pixel-drawer/pixel-drawer';
import PixelInputComponent from '../pixel-input/pixel-input';
import PixelMenuComponent from '../pixel-menu/pixel-menu';
import PixelMenuItemComponent from '../pixel-menu/pixel-menu-item';
import PixelMenuTriggerDirective from '../pixel-menu/pixel-menu-trigger';
import PixelPaginatorComponent, { type PixelPageEvent } from '../pixel-paginator/pixel-paginator';
import PixelLoaderComponent from '../pixel-loader/pixel-loader';
import PixelSelectComponent, { type PixelSelectOption } from '../pixel-select/pixel-select';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';
import { PixelExportService } from '../services/export/export.service';
import PixelDataGridCellDirective from './pixel-data-grid-cell.directive';
import PixelDataGridColumnsPanelComponent, {
  type PixelDataGridColumnsPanelReorderEvent,
} from './pixel-data-grid-columns-panel';
import {
  startColumnDragPreview,
  type PixelDataGridDragPreviewSession,
} from './pixel-data-grid-drag-preview';
import PixelDataGridDetailDirective from './pixel-data-grid-detail.directive';
import PixelDataGridEditorDirective from './pixel-data-grid-editor.directive';
import { PixelDataGridStore } from './pixel-data-grid.store';
import type {
  PixelDataGridCellEditEvent,
  PixelDataGridColumn,
  PixelDataGridCriteria,
  PixelDataGridDataSource,
  PixelDataGridDensity,
  PixelDataGridExportFormat,
  PixelDataGridExportScope,
  PixelDataGridFilterOperator,
  PixelDataGridFilterState,
  PixelDataGridFilterValue,
  PixelDataGridPageEvent,
  PixelDataGridPinSide,
  PixelDataGridGroupRow,
  PixelDataGridRenderRow,
  PixelDataGridRowClickEvent,
  PixelDataGridRowId,
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
  gridHeaderLabel,
  gridOperatorsFor,
  gridRenderRowKey,
  gridStateToJson,
  isValuelessGridOperator,
  parseGridState,
  readGridLayout,
  toGridExportColumns,
  writeGridLayout,
} from './pixel-data-grid.utils';

/** Width (px) of the leading selection (checkbox) column. */
const SELECTION_COLUMN_WIDTH = 44;

/** Width (px) of the leading master-detail toggle column. */
const DETAIL_COLUMN_WIDTH = 40;

/** Estimated row height (px) per density, used when `rowHeight` is not set for virtualization. */
const DENSITY_ROW_HEIGHT: Record<PixelDataGridDensity, number> = {
  compact: 37,
  standard: 45,
  comfortable: 53,
};

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
    PixelDrawerComponent,
    PixelInputComponent,
    PixelLoaderComponent,
    PixelMenuComponent,
    PixelMenuItemComponent,
    PixelMenuTriggerDirective,
    PixelPaginatorComponent,
    PixelSelectComponent,
    PixelSkeletonComponent,
  ],
  // PixelDataGridDetailDirective is a content directive (projected by consumers); not imported here.
  templateUrl: './pixel-data-grid.html',
  styleUrl: './pixel-data-grid.scss',
  providers: [PixelDataGridStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-data-grid-host',
    '[attr.data-density]': 'density()',
    '[class.pixel-data-grid-host--loading]': 'isLoading()',
  },
})
export default class PixelDataGridComponent<T = any> implements OnInit, OnDestroy {
  protected readonly store = inject(PixelDataGridStore) as PixelDataGridStore<T>;
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly exporter = inject(PixelExportService);
  private readonly cellTemplates = contentChildren(PixelDataGridCellDirective);
  private readonly editorTemplates = contentChildren(PixelDataGridEditorDirective);

  protected readonly fallbackId = `pixel-data-grid-${nextDataGridId++}`;
  protected readonly operatorLabels = PIXEL_DATA_GRID_OPERATOR_LABELS;

  // ── Data & columns ────────────────────────────────────────────────────────────────────────
  /** Row data (ignored when a `dataSource` is bound). */
  readonly data = input<readonly T[]>([]);
  /** Column definitions. */
  readonly columns = input<readonly PixelDataGridColumn<T>[]>([]);
  /** Stable row identity for tracking (and future selection). Defaults to the row index. */
  readonly rowId = input<PixelDataGridRowId<T>>((_row, index) => index);

  // ── Presentation ──────────────────────────────────────────────────────────────────────────
  readonly density = input<PixelDataGridDensity>('standard');
  readonly stickyHeader = input(true, { transform: booleanAttribute });
  readonly striped = input(false, { transform: booleanAttribute });
  readonly hoverable = input(true, { transform: booleanAttribute });
  readonly clickableRows = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly showSkeleton = input(false, { transform: booleanAttribute });
  readonly skeletonRows = input(5, { transform: numberAttribute });
  readonly emptyMessage = input('No records to display.');
  readonly caption = input('');

  // ── Toolbar / search ─────────────────────────────────────────────────────────────────────
  /** Shows a global quick-filter search box above the grid. */
  readonly searchable = input(false, { transform: booleanAttribute });
  readonly searchPlaceholder = input('Search…');
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
  /** Enables drag-to-reorder of column headers. */
  readonly reorderableColumns = input(false, { transform: booleanAttribute });
  /** Enables pin-left / pin-right actions in the per-column header menu. */
  readonly pinnableColumns = input(false, { transform: booleanAttribute });

  // ── Selection (Phase 3) ───────────────────────────────────────────────────────────────────
  /** Row selection mode. `multiple` adds a checkbox column with select-all + shift-range. */
  readonly selectionMode = input<PixelDataGridSelectionMode>('none');
  /** Two-way selected rows (by reference / `rowId`). */
  readonly selectedRows = model<T[]>([]);

  // ── Export (Phase 3) ──────────────────────────────────────────────────────────────────────
  /** Shows the toolbar export menu (CSV / JSON / Excel / clipboard). */
  readonly exportable = input(false, { transform: booleanAttribute });
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

  private readonly detailDirective = contentChild(PixelDataGridDetailDirective);

  // ── Outputs ───────────────────────────────────────────────────────────────────────────────
  readonly rowClick = output<PixelDataGridRowClickEvent<T>>();
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
  protected readonly skeletonColumnCount = computed(() => this.columns().length || 4);
  protected readonly showSortPriority = computed(() => this.sortModel().length > 1);
  /**
   * Maps grid density → embedded control size (paginator / input / select / checkbox), so the
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
      (this.showDetailColumn() ? 1 : 0),
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
  protected readonly ariaColCount = computed(
    () => this.visibleColumns().length + this.leadingColumnCount(),
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
      this.exportable() ||
      this.store.isGrouped(),
  );
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

  /** Transient drag-reorder state. */
  protected readonly dragField = signal<string | null>(null);
  protected readonly dropTarget = signal<{ field: string; after: boolean } | null>(null);
  private dragPreviewSession: PixelDataGridDragPreviewSession | null = null;

  /** Loading overlay = explicit `loading` input or an in-flight DataSource fetch. */
  private readonly fetchLoading = signal(false);
  protected readonly isLoading = computed(() => this.loading() || this.fetchLoading());

  private resizeState: {
    field: string;
    startX: number;
    startWidth: number;
    minWidth: number;
  } | null = null;

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
    effect(() => this.store.columns.set(this.columns()));
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
  }

  ngOnInit(): void {
    // Best-effort: a no-op when `layoutKey` is unset or nothing was previously saved.
    this.restoreLayout();
  }

  ngOnDestroy(): void {
    this.fetchSub?.unsubscribe();
    this.exportSub?.unsubscribe();
    this.stopDragPreview();
  }

  /** Tracks scroll position for virtualization and fires `loadMore` near the bottom. */
  protected onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    this.scrollTop.set(el.scrollTop);
    if (this.viewportHeight() !== el.clientHeight) {
      this.viewportHeight.set(el.clientHeight);
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
    return formatGridCell(row, column);
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

  // ── Column tooling: pin / width / drag view helpers ──────────────────────────────────────
  protected pinSide(column: PixelDataGridColumn<T>): PixelDataGridPinSide | null {
    return this.store.columnPin(column);
  }

  protected columnWidthStyle(column: PixelDataGridColumn<T>): string | null {
    const resized = this.store.columnWidths()[column.field];
    if (resized !== undefined) {
      return `${resized}px`;
    }
    if (this.pinSide(column)) {
      return `${this.store.columnEffectiveWidthPx(column)}px`;
    }
    return column.width || null;
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

  protected isPinEdgeLeft(column: PixelDataGridColumn<T>): boolean {
    return this.store.pinLayout().lastLeftField === column.field;
  }

  protected isPinEdgeRight(column: PixelDataGridColumn<T>): boolean {
    return this.store.pinLayout().firstRightField === column.field;
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
    const handle = event.target as HTMLElement;
    const headerCell = handle.closest('th');
    const startWidth =
      headerCell?.getBoundingClientRect().width ?? this.store.columnEffectiveWidthPx(column);
    this.resizeState = {
      field: column.field,
      startX: event.clientX,
      startWidth,
      minWidth: column.minWidth ?? 56,
    };
    handle.setPointerCapture(event.pointerId);
  }

  protected onResizeMove(event: PointerEvent): void {
    if (!this.resizeState) {
      return;
    }
    const delta = event.clientX - this.resizeState.startX;
    this.store.setColumnWidth(
      this.resizeState.field,
      this.resizeState.startWidth + delta,
      this.resizeState.minWidth,
    );
  }

  protected onResizeEnd(): void {
    if (!this.resizeState) {
      return;
    }
    this.resizeState = null;
    this.emitState();
  }

  /** Double-click the handle to clear a manual width and return to auto sizing. */
  protected onResizeReset(column: PixelDataGridColumn<T>): void {
    this.store.resetColumnWidth(column.field);
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
  exportData(format: PixelDataGridExportFormat, scope?: PixelDataGridExportScope): void {
    const resolvedScope: PixelDataGridExportScope =
      scope ?? (this.exportSelectedOnly() && this.selectedRows().length ? 'selected' : 'all');

    if (resolvedScope === 'selected') {
      this.writeExport(format, this.selectedRows());
      return;
    }
    if (resolvedScope === 'page') {
      this.writeExport(format, [...this.displayRows()]);
      return;
    }

    // scope === 'all'
    const source = this.dataSource();
    if (source) {
      this.exportAllFromDataSource(source, format);
      return;
    }
    const rows = this.serverSide() ? [...this.store.data()] : [...this.store.sortedRows()];
    this.writeExport(format, rows);
  }

  private exportAllFromDataSource(
    source: PixelDataGridDataSource<T>,
    format: PixelDataGridExportFormat,
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
      next: (page) => this.writeExport(format, page.rows as T[]),
    });
  }

  private writeExport(format: PixelDataGridExportFormat, rows: readonly T[]): void {
    const columns = toGridExportColumns(this.exportColumns());
    const base = this.exportFileName();

    switch (format) {
      case 'json':
        this.exporter.exportTable(rows, columns, 'json', { fileName: base });
        return;
      case 'excel':
        this.exporter.exportTable(rows, columns, 'excel', {
          fileName: base,
          sheetName: base,
        });
        return;
      case 'clipboard':
        void this.exporter.copyText(this.exporter.serializeTsv(rows, columns));
        return;
      default:
        this.exporter.exportTable(rows, columns, 'csv', { fileName: base });
    }
  }

  protected exportLabel(format: PixelDataGridExportFormat): string {
    const verb = format === 'clipboard' ? 'Copy' : 'Export as';
    const noun =
      format === 'csv'
        ? 'CSV'
        : format === 'json'
          ? 'JSON'
          : format === 'excel'
            ? 'Excel'
            : 'to clipboard';
    return format === 'clipboard' ? 'Copy to clipboard' : `${verb} ${noun}`;
  }

  // ── Grouping & master-detail (Phase 5) ────────────────────────────────────────────────────
  protected renderRowKey = (_index: number, renderRow: PixelDataGridRenderRow<T>): string =>
    gridRenderRowKey(renderRow);

  protected groupFieldHeader(field: string): string {
    const column = this.columnByField().get(field);
    return column ? gridHeaderLabel(column) : field;
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

  protected hasFilter(column: PixelDataGridColumn<T>): boolean {
    return !!this.filters()[column.field];
  }

  /** `pixel-select` options for a column's filter operators. */
  protected operatorOptions(column: PixelDataGridColumn<T>): PixelSelectOption[] {
    return this.operatorsFor(column).map((operator) => ({
      value: operator,
      label: this.operatorLabels[operator],
    }));
  }

  /** `pixel-select` options for a `select` column filter (with an "Any" reset). */
  protected filterSelectOptions(column: PixelDataGridColumn<T>): PixelSelectOption[] {
    const options = column.filter?.options ?? [];
    return [
      { value: '', label: 'Any' },
      ...options.map((option) => ({ value: option.value, label: option.label })),
    ];
  }

  protected readonly booleanFilterOptions: PixelSelectOption[] = [
    { value: '', label: 'Any' },
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' },
  ];

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
  }

  protected clearFilter(column: PixelDataGridColumn<T>): void {
    const next = { ...this.filters() };
    if (!(column.field in next)) {
      return;
    }
    delete next[column.field];
    this.filters.set(next);
    this.emitCriteria();
  }

  // ── Pagination ────────────────────────────────────────────────────────────────────────────
  /** Bridges the embedded `pixel-paginator` page event to the grid's models + outputs. */
  protected onPaginatorPage(event: PixelPageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.pageChange.emit({ pageIndex: event.pageIndex, pageSize: event.pageSize });
    this.emitCriteria();
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
