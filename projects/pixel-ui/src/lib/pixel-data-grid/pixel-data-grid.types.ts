/**
 * Public type surface for `pixel-data-grid`.
 *
 * The grid is built phase by phase; this file grows with each phase. Phase 0 covers the
 * foundation: columns, rows, density, and built-in cell rendering. Phase 1 adds the data pipeline
 * (sorting, filtering, quick search, pagination) and the DataSource abstraction. Later phases
 * extend these types (selection, grouping, editing, …) without breaking earlier APIs.
 */

import type { Observable } from 'rxjs';

/**
 * Convenience alias for a plain record row. The grid does not *require* this shape — its generic
 * `T` is unconstrained so concrete interfaces bind in templates without casts — but consumers who
 * have no row interface can use `PixelDataGridRow` as a sensible default.
 */
export type PixelDataGridRow = Record<string, unknown>;

/** Text alignment for a column's header and cells. */
export type PixelDataGridAlign = 'start' | 'center' | 'end';

/** Overflow presentation for built-in (non-template) cells. */
export type PixelDataGridColumnOverflow = 'ellipsis' | 'clip';

/** Visual row density. */
export type PixelDataGridDensity = 'comfortable' | 'standard' | 'compact';

/**
 * How the grid presents an in-flight load (`loading` input or DataSource fetch).
 * - `skeleton` — keep headers / column layout; fill the body with skeleton placeholder rows (default).
 * - `loader` — spinner overlay on top of the current table (good for refetch / paging).
 */
export type PixelDataGridLoadingMode = 'loader' | 'skeleton';

/**
 * Built-in cell renderers. Use a custom cell template (`pixelGridCell`) for anything richer.
 * Phase 0 ships the primitive value renderers; richer renderers (link/chip/icon/progress) land
 * in later phases.
 */
export type PixelDataGridColumnType = 'text' | 'number' | 'date' | 'boolean';

/** Resolves a stable identity for a row (selection, tracking, virtualization). */
export type PixelDataGridRowId<T = any> = (row: T, index: number) => string | number;

/** Formats a raw cell value to a display string (overrides the built-in `type` formatter). */
export type PixelDataGridValueFormatter<T = any> = (value: unknown, row: T) => string;

/** Column definition for `pixel-data-grid`. */
export interface PixelDataGridColumn<T = any> {
  /** Property key on the row object (also the custom-cell template key). */
  field: keyof T & string;
  /** Header label. Defaults to the field name. */
  header?: string;
  /** Header/cell alignment. */
  align?: PixelDataGridAlign;
  /** Fixed column width in px. Ignored when `flex` is set (viewport layout). */
  width?: number;
  /** Flex grow weight for unsized columns (mutually exclusive with `width`). */
  flex?: number;
  /** Maximum width in px when resizing or in viewport layout. */
  maxWidth?: number;
  /** Built-in cell overflow when no custom template is supplied (default `ellipsis`). */
  overflow?: PixelDataGridColumnOverflow;
  /** Built-in formatting when no custom template is supplied. */
  type?: PixelDataGridColumnType;
  /** Hides the column without removing it from config. */
  hidden?: boolean;
  /** Excludes the column from any future column chooser (always visible). */
  lockVisible?: boolean;
  /** Accessible tooltip/description for the header. */
  description?: string;
  /** Custom display formatter; wins over the built-in `type` formatter. */
  valueFormatter?: PixelDataGridValueFormatter<T>;
  /** Enables click-to-sort (shift-click to add to a multi-column sort). */
  sortable?: boolean;
  /** Enables a per-column filter popover. */
  filter?: PixelDataGridColumnFilter;
  /** Allow drag-resize of this column. Defaults to the grid's `resizableColumns`. Set `false` to opt out. */
  resizable?: boolean;
  /** Minimum width in px when resizing and in viewport layout. When omitted, defaults to the
   *  measured header content width (label + controls), floored at the grid's
   *  `defaultColumnMinWidth` (120px unless overridden). */
  minWidth?: number;
  /** Pin/freeze this column to the start or end of the grid. */
  pinned?: PixelDataGridPinSide;
  /** Include this column when exporting. Defaults to `true`. */
  exportable?: boolean;
  /** Aggregation shown in group headers and the grand-total footer for this column. */
  aggregate?: PixelDataGridAggregator<T>;
  /** Allow inline editing of this column (requires the grid's `editable`). */
  editable?: boolean;
  /** Built-in editor for this column (default `'text'`). Use `pixelGridEditor` for custom editors. */
  editor?: PixelDataGridEditorType;
  /** Options for a `select` editor. */
  editorOptions?: readonly PixelDataGridFilterOption[];
  /** Validates an edited value; return an error message, or `null` when valid. */
  validate?: (value: unknown, row: T) => string | null;
}

// ── Inline editing ──────────────────────────────────────────────────────────────────────────

/** Built-in inline cell editors. */
export type PixelDataGridEditorType = 'text' | 'number' | 'date' | 'select' | 'checkbox';

/** Emitted when an inline cell edit is committed. */
export interface PixelDataGridCellEditEvent<T = any> {
  readonly row: T;
  readonly field: string;
  readonly rowIndex: number;
  readonly oldValue: unknown;
  readonly newValue: unknown;
}

// ── Grouping & aggregation ──────────────────────────────────────────────────────────────────

/** Built-in aggregator names, or a custom reducer over the group's rows. */
export type PixelDataGridAggregatorName = 'sum' | 'avg' | 'min' | 'max' | 'count';
export type PixelDataGridAggregator<T = any> =
  | PixelDataGridAggregatorName
  | ((rows: readonly T[]) => unknown);

/** A group header in the flattened render list. */
export interface PixelDataGridGroupRow {
  readonly kind: 'group';
  /** Stable path key (e.g. `region:EU/status:Open`). */
  readonly key: string;
  readonly field: string;
  readonly value: unknown;
  readonly label: string;
  /** Nesting depth (0 = top-level group). */
  readonly level: number;
  /** Number of leaf rows under this group. */
  readonly count: number;
  /** Per-column aggregate values for this group. */
  readonly aggregates: Record<string, unknown>;
  readonly expanded: boolean;
}

/** A data (leaf) row in the flattened render list. */
export interface PixelDataGridDataRow<T = any> {
  readonly kind: 'data';
  readonly row: T;
  /** Absolute index into the source (filtered + sorted) rows. */
  readonly index: number;
  readonly level: number;
}

/** A master-detail content row in the flattened render list. */
export interface PixelDataGridDetailRow<T = any> {
  readonly kind: 'detail';
  readonly row: T;
  readonly index: number;
}

export type PixelDataGridRenderRow<T = any> =
  | PixelDataGridGroupRow
  | PixelDataGridDataRow<T>
  | PixelDataGridDetailRow<T>;

/** Side a column is pinned/frozen to. */
export type PixelDataGridPinSide = 'left' | 'right';

/** Emitted when a row is activated (click / keyboard) while `clickableRows` is enabled. */
export interface PixelDataGridRowClickEvent<T = any> {
  readonly row: T;
  readonly index: number;
}

// ── Row quick actions (Gmail-style hover/focus pill) ─────────────────────────────────────────

/**
 * When the floating row quick-actions pill is shown.
 * - `hover` — pointer hover only (prefer `hover-focus` for keyboard access).
 * - `hover-focus` — hover or focus-within (default).
 * - `always` — always visible (also forced automatically for coarse pointers).
 */
export type PixelDataGridRowQuickActionsMode = 'hover' | 'hover-focus' | 'always';

/**
 * Declarative action for the floating row quick-actions pill.
 * Icon-only buttons require a non-empty `label` (maps to `aria-label` + tooltip).
 */
export interface PixelDataGridRowQuickAction<T = any> {
  /** Stable id emitted on `rowQuickAction`. */
  readonly id: string;
  /** Material Symbols ligature name. */
  readonly icon: string;
  /** Accessible name / tooltip. */
  readonly label: string;
  /** Styles the overflow menu item as destructive; icon buttons use `state="error"`. */
  readonly danger?: boolean;
  /** Static or per-row disabled. */
  readonly disabled?: boolean | ((row: T) => boolean);
  /** When false, the action is omitted for that row. */
  readonly visible?: (row: T) => boolean;
}

/** Emitted when a declarative row quick action is activated. */
export interface PixelDataGridRowQuickActionEvent<T = any> {
  readonly actionId: string;
  readonly row: T;
  readonly index: number;
  readonly originalEvent: Event;
}

// ── Selection ─────────────────────────────────────────────────────────────────────────────────

/** Row selection mode. */
export type PixelDataGridSelectionMode = 'none' | 'single' | 'multiple';

// ── Export ────────────────────────────────────────────────────────────────────────────────────

/** Supported export targets. `excel` emits a real `.xlsx` (OOXML); `clipboard` copies TSV. */
export type PixelDataGridExportFormat = 'csv' | 'json' | 'excel' | 'clipboard';

/** Which rows to include in an export. */
export type PixelDataGridExportScope = 'all' | 'selected' | 'page';

// ── Sorting ───────────────────────────────────────────────────────────────────────────────────

/** Sort direction; `null` clears the sort on a column. */
export type PixelDataGridSortDirection = 'asc' | 'desc' | null;

/** A single column's contribution to the (multi-column) sort model, in priority order. */
export interface PixelDataGridSortDescriptor {
  readonly field: string;
  readonly direction: 'asc' | 'desc';
}

/** Emitted when the sort model changes. The array is ordered by sort priority. */
export interface PixelDataGridSortEvent {
  readonly sort: readonly PixelDataGridSortDescriptor[];
}

// ── Filtering ─────────────────────────────────────────────────────────────────────────────────

/** Per-column filter control type. */
export type PixelDataGridFilterType = 'text' | 'number' | 'date' | 'select' | 'boolean';

/** Comparison operators offered by the filter popover. */
export type PixelDataGridFilterOperator =
  | 'contains'
  | 'equals'
  | 'notEquals'
  | 'startsWith'
  | 'endsWith'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'before'
  | 'after'
  | 'empty'
  | 'notEmpty';

/** Option for a `select` column filter. */
export interface PixelDataGridFilterOption {
  readonly value: unknown;
  readonly label: string;
}

/** Per-column filter configuration. */
export interface PixelDataGridColumnFilter {
  /** Control type rendered in the filter popover. */
  readonly type: PixelDataGridFilterType;
  /** Operators offered; sensible defaults are used per type when omitted. */
  readonly operators?: readonly PixelDataGridFilterOperator[];
  /** Options for `select` filters. */
  readonly options?: readonly PixelDataGridFilterOption[];
  /** Placeholder for the filter input. */
  readonly placeholder?: string;
}

/** Active filter value for a single column. */
export interface PixelDataGridFilterValue {
  readonly operator: PixelDataGridFilterOperator;
  readonly value: unknown;
}

/** Map of field → active filter. */
export type PixelDataGridFilterState = Record<string, PixelDataGridFilterValue>;

// ── Pagination & criteria ───────────────────────────────────────────────────────────────────

/** Emitted when the page index or size changes. */
export interface PixelDataGridPageEvent {
  readonly pageIndex: number;
  readonly pageSize: number;
}

/** Unified snapshot of sort + page + quick filter + column filters for server-side data sources. */
export interface PixelDataGridCriteria {
  readonly sort: readonly PixelDataGridSortDescriptor[];
  readonly page: PixelDataGridPageEvent;
  readonly quickFilter: string;
  readonly filters: PixelDataGridFilterState;
}

// ── DataSource abstraction ──────────────────────────────────────────────────────────────────

/** Rows + total count returned by a {@link PixelDataGridDataSource} for a given criteria. */
export interface PixelDataGridFetchResult<T = any> {
  readonly rows: readonly T[];
  readonly total: number;
}

/**
 * A pluggable data source. `fetch` receives the current criteria (sort/page/filters) and returns a
 * page of rows plus the total record count. It may return a synchronous result, a `Promise`, or an
 * `Observable`. Bind it via `[dataSource]`; the grid switches to server-driven mode, calls `fetch`
 * whenever criteria change, and manages loading automatically (`loadingMode` chooses spinner
 * overlay vs auto-sized in-body skeleton rows).
 */
export interface PixelDataGridDataSource<T = any> {
  fetch(
    criteria: PixelDataGridCriteria,
  ):
    | Observable<PixelDataGridFetchResult<T>>
    | Promise<PixelDataGridFetchResult<T>>
    | PixelDataGridFetchResult<T>;
}

// ── View state (column tooling + persistence) ─────────────────────────────────────────────────

/** Runtime view state for a single column. */
export interface PixelDataGridColumnState {
  readonly field: string;
  /** Resized width in px (omitted = auto / config width). */
  readonly width?: number;
  /** Visibility override (omitted = config default). */
  readonly hidden?: boolean;
  /** Pin override (`null` clears the config pin). */
  readonly pinned?: PixelDataGridPinSide | null;
}

/**
 * Portable snapshot of the grid's view state — column order/width/visibility/pinning plus the
 * active sort, filters, quick search, and page. Round-trip via `getState()` / `setState()` or the
 * JSON helpers to persist a user's layout.
 */
export interface PixelDataGridState {
  /** Columns in display order, each with its runtime overrides. */
  readonly columns: readonly PixelDataGridColumnState[];
  readonly sort: readonly PixelDataGridSortDescriptor[];
  readonly filters: PixelDataGridFilterState;
  readonly quickFilter: string;
  readonly page: PixelDataGridPageEvent;
}

/**
 * Overridable user-visible copy for `pixel-data-grid` chrome (toolbar, selection, column menu,
 * columns panel, filters, export). Pass a partial via the `labels` input; placeholders use
 * `{n}`, `{total}`, and `{col}` (see {@link formatLabel} in utils).
 *
 * Does not include `emptyMessage` — that remains a dedicated input.
 */
export interface PixelDataGridLabels {
  readonly columns: string;
  readonly manageColumns: string;
  readonly manageColumnsAria: string;
  readonly export: string;
  readonly exportDataAria: string;
  readonly exportAsCsv: string;
  readonly exportAsJson: string;
  readonly exportAsExcel: string;
  readonly copyToClipboard: string;
  /** Placeholder `{n}` = selected row count. */
  readonly onlySelected: string;
  readonly expandAll: string;
  readonly expandAllAria: string;
  readonly collapseAll: string;
  readonly collapseAllAria: string;
  /** Placeholder `{n}` = rows on the current page. */
  readonly allPageSelected: string;
  /** Placeholder `{total}` = total selectable rows. */
  readonly selectAllRows: string;
  /** Placeholder `{n}` = 1-based row index. */
  readonly selectRow: string;
  readonly selectAllPage: string;
  readonly select: string;
  readonly expand: string;
  readonly toggleRowDetails: string;
  readonly editValue: string;
  readonly dragToReorder: string;
  readonly dragToResize: string;
  /** Placeholder `{col}` = column header. */
  readonly unpinColumn: string;
  readonly unpinPinnedLeft: string;
  readonly unpinPinnedRight: string;
  /** Placeholder `{col}` = column header. */
  readonly filterColumn: string;
  readonly filterOperator: string;
  readonly filterValue: string;
  readonly filterClear: string;
  readonly filterAny: string;
  /** Placeholder `{col}` = column header. */
  readonly columnOptions: string;
  readonly sortAscending: string;
  readonly sortDescending: string;
  readonly clearSort: string;
  readonly pinLeft: string;
  readonly pinRight: string;
  readonly unpin: string;
  readonly hideColumn: string;
  readonly total: string;
  readonly loading: string;
  readonly gridPagination: string;
  readonly saveLayout: string;
  readonly restoreLayout: string;
  readonly clearLayout: string;
  readonly noColumnsAvailable: string;
  /** Placeholder `{col}` = column header. */
  readonly showColumn: string;
  /** Placeholder `{col}` = column header. */
  readonly pinColumnLeft: string;
  /** Placeholder `{col}` = column header. */
  readonly pinColumnRight: string;
  readonly booleanYes: string;
  readonly booleanNo: string;
  /** Accessible name for the floating row quick-actions group. */
  readonly rowActions: string;
  /** Accessible name / tooltip for the overflow ⋮ control. */
  readonly moreRowActions: string;
  /** Optional overrides for {@link PIXEL_DATA_GRID_OPERATOR_LABELS}. */
  readonly operators?: Partial<Record<PixelDataGridFilterOperator, string>>;
}
