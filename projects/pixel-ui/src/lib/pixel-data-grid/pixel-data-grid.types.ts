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

/** Visual row density. */
export type PixelDataGridDensity = 'comfortable' | 'standard' | 'compact';

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
  /** Fixed/min width, e.g. `'12rem'` or `'160px'`. */
  width?: string;
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
  /** Minimum width in px when resizing (default 56). */
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
 * whenever criteria change, and manages the loading overlay automatically.
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
