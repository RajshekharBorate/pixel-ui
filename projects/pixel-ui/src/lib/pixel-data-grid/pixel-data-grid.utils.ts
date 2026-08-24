import type {
  PixelDataGridAggregator,
  PixelDataGridColumn,
  PixelDataGridDataRow,
  PixelDataGridFilterOperator,
  PixelDataGridFilterType,
  PixelDataGridFilterValue,
  PixelDataGridLabels,
  PixelDataGridRenderRow,
  PixelDataGridSortDescriptor,
  PixelDataGridState,
} from './pixel-data-grid.types';
import {
  copyTextToClipboard,
  formatExportDate,
  saveAs,
  serializeToDelimited,
  serializeToJson,
  type PixelExportColumn,
} from '../services/export/public-api';
import { parseLocalIsoDate } from '../shared/datetime/pixel-date-utils';
import {
  formatCalendarDateDisplayValue,
  type PixelDateFieldIoContext,
} from '../shared/datetime/pixel-date-field-io';

export { copyTextToClipboard };

/** Default English chrome copy for `pixel-data-grid` (override via `labels` input). */
export const DEFAULT_PIXEL_DATA_GRID_LABELS: PixelDataGridLabels = {
  columns: 'Columns',
  manageColumns: 'Manage columns',
  manageColumnsAria: 'Manage columns',
  export: 'Export',
  exportDataAria: 'Export data',
  exportAsCsv: 'Export as CSV',
  exportAsJson: 'Export as JSON',
  exportAsExcel: 'Export as Excel',
  copyToClipboard: 'Copy to clipboard',
  onlySelected: 'Only selected ({n})',
  expandAll: 'Expand all',
  expandAllAria: 'Expand all groups',
  collapseAll: 'Collapse all',
  collapseAllAria: 'Collapse all groups',
  allPageSelected: 'All {n} rows on this page are selected.',
  selectAllRows: 'Select all {total} rows',
  selectRow: 'Select row {n}',
  selectAllPage: 'Select all rows on this page',
  select: 'Select',
  expand: 'Expand',
  toggleRowDetails: 'Toggle row details',
  editValue: 'Edit value',
  dragToReorder: 'Drag to reorder',
  dragToResize: 'Drag to resize · double-click to reset',
  unpinColumn: 'Unpin {col}',
  unpinPinnedLeft: 'Unpin (pinned left)',
  unpinPinnedRight: 'Unpin (pinned right)',
  filterColumn: 'Filter {col}',
  filterOperator: 'Operator',
  filterValue: 'Value',
  filterClear: 'Clear',
  filterAny: 'Any',
  columnOptions: '{col} column options',
  sortAscending: 'Sort ascending',
  sortDescending: 'Sort descending',
  clearSort: 'Clear sort',
  pinLeft: 'Pin left',
  pinRight: 'Pin right',
  unpin: 'Unpin',
  hideColumn: 'Hide column',
  total: 'Total',
  loading: 'Loading',
  gridPagination: 'Grid pagination',
  saveLayout: 'Save layout',
  restoreLayout: 'Restore layout',
  clearLayout: 'Clear layout',
  noColumnsAvailable: 'No columns available.',
  showColumn: 'Show {col}',
  pinColumnLeft: 'Pin {col} left',
  pinColumnRight: 'Pin {col} right',
  booleanYes: 'Yes',
  booleanNo: 'No',
  rowActions: 'Row actions',
  moreRowActions: 'More actions',
};

/**
 * Replaces `{n}`, `{total}`, and `{col}` placeholders in a label template.
 */
export function formatLabel(
  tpl: string,
  vars: { n?: number | string; total?: number | string; col?: string } = {},
): string {
  return tpl
    .replaceAll('{n}', vars.n === undefined ? '' : String(vars.n))
    .replaceAll('{total}', vars.total === undefined ? '' : String(vars.total))
    .replaceAll('{col}', vars.col ?? '');
}

/** Merges a partial `labels` input with {@link DEFAULT_PIXEL_DATA_GRID_LABELS} (deep-merges `operators`). */
export function mergePixelDataGridLabels(
  partial: Partial<PixelDataGridLabels> = {},
): PixelDataGridLabels {
  const { operators, ...rest } = partial;
  return {
    ...DEFAULT_PIXEL_DATA_GRID_LABELS,
    ...rest,
    ...(operators
      ? { operators: { ...DEFAULT_PIXEL_DATA_GRID_LABELS.operators, ...operators } }
      : {}),
  };
}

/** Header label for a column, falling back to the raw field name. */
export function gridHeaderLabel<T>(column: PixelDataGridColumn<T>): string {
  return column.header ?? column.field;
}

/** Options for {@link formatGridCell}. */
export interface FormatGridCellOptions {
  readonly labels?: Pick<PixelDataGridLabels, 'booleanYes' | 'booleanNo'> | null;
  /** BCP-47 locale for `type: 'date'` cells. Falls back to browser Intl when omitted. */
  readonly dateLocale?: string;
  /** Adapter/formats context so grid display matches datepicker when custom formats are registered. */
  readonly dateFieldIo?: PixelDateFieldIoContext | null;
}

function resolveFormatGridCellOptions(
  options?: FormatGridCellOptions | Pick<PixelDataGridLabels, 'booleanYes' | 'booleanNo'> | null,
): FormatGridCellOptions {
  if (!options) {
    return {};
  }
  if ('dateLocale' in options || 'dateFieldIo' in options) {
    return options;
  }
  if ('labels' in options) {
    return options;
  }
  return { labels: options as Pick<PixelDataGridLabels, 'booleanYes' | 'booleanNo'> };
}

/**
 * Formats a raw cell value for display. A column `valueFormatter` wins; otherwise the built-in
 * `type` formatter is used. Empty values render as an em dash.
 */
export function formatGridCell<T>(
  row: T,
  column: PixelDataGridColumn<T>,
  options?: FormatGridCellOptions | Pick<PixelDataGridLabels, 'booleanYes' | 'booleanNo'> | null,
): string {
  const resolved = resolveFormatGridCellOptions(options);
  const labels = resolved.labels;
  const value = (row as Record<string, unknown>)[column.field];
  if (column.valueFormatter) {
    return column.valueFormatter(value, row);
  }
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  switch (column.type) {
    case 'number':
      return typeof value === 'number'
        ? value.toLocaleString(resolved.dateLocale)
        : String(value);
    case 'date': {
      const formatted = formatCalendarDateDisplayValue(
        value,
        resolved.dateLocale,
        resolved.dateFieldIo,
      );
      return formatted ?? String(value);
    }
    case 'boolean':
      return value ? (labels?.booleanYes ?? 'Yes') : (labels?.booleanNo ?? 'No');
    default:
      return String(value);
  }
}

/**
 * Natural comparison for two cell values. `null`/`undefined` sort first; numbers compare
 * numerically; everything else compares as locale-aware strings (numeric-aware). Returns the
 * ascending ordering — callers invert for descending.
 */
export function compareGridValues(a: unknown, b: unknown): number {
  if (a === b) {
    return 0;
  }
  if (a === null || a === undefined) {
    return -1;
  }
  if (b === null || b === undefined) {
    return 1;
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  // Date-like values: compare by local civil-day timestamp so sort matches display.
  if (isGridDateLike(a) || isGridDateLike(b)) {
    const ta = gridDateDayTime(a);
    const tb = gridDateDayTime(b);
    if (ta !== null && tb !== null) {
      return ta - tb;
    }
  }
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

// ── Sorting ───────────────────────────────────────────────────────────────────────────────────

/**
 * Cycles a column through none → asc → desc → none and returns the next multi-column sort model.
 * When `additive` (shift-click), the column is added to / updated within the existing model;
 * otherwise it replaces it. Model order is sort priority.
 */
export function cycleGridSort(
  model: readonly PixelDataGridSortDescriptor[],
  field: string,
  additive: boolean,
): PixelDataGridSortDescriptor[] {
  const existing = model.find((descriptor) => descriptor.field === field);

  if (!existing) {
    const next: PixelDataGridSortDescriptor = { field, direction: 'asc' };
    return additive ? [...model, next] : [next];
  }

  if (existing.direction === 'asc') {
    const next: PixelDataGridSortDescriptor = { field, direction: 'desc' };
    return additive ? model.map((d) => (d.field === field ? next : d)) : [next];
  }

  // Was 'desc' → clear this column.
  return additive ? model.filter((d) => d.field !== field) : [];
}

/** Stable multi-column sort. Returns a new array; the input is not mutated. */
export function sortGridRows<T>(
  rows: readonly T[],
  model: readonly PixelDataGridSortDescriptor[],
): T[] {
  if (model.length === 0) {
    return rows.slice();
  }
  return rows.slice().sort((a, b) => {
    for (const { field, direction } of model) {
      const cmp =
        compareGridValues(
          (a as Record<string, unknown>)[field],
          (b as Record<string, unknown>)[field],
        ) * (direction === 'asc' ? 1 : -1);
      if (cmp !== 0) {
        return cmp;
      }
    }
    return 0;
  });
}

// ── Filtering ─────────────────────────────────────────────────────────────────────────────────

/** Default operators offered per filter type when a column does not specify its own. */
export const PIXEL_DATA_GRID_DEFAULT_OPERATORS: Record<
  PixelDataGridFilterType,
  PixelDataGridFilterOperator[]
> = {
  text: ['contains', 'equals', 'startsWith', 'endsWith', 'notEmpty', 'empty'],
  number: ['equals', 'notEquals', 'gt', 'gte', 'lt', 'lte'],
  date: ['equals', 'before', 'after'],
  select: ['equals', 'notEquals'],
  boolean: ['equals'],
};

/** Human-readable labels for each filter operator. */
export const PIXEL_DATA_GRID_OPERATOR_LABELS: Record<PixelDataGridFilterOperator, string> = {
  contains: 'Contains',
  equals: 'Equals',
  notEquals: 'Not equals',
  startsWith: 'Starts with',
  endsWith: 'Ends with',
  gt: 'Greater than',
  gte: 'Greater or equal',
  lt: 'Less than',
  lte: 'Less or equal',
  before: 'Before',
  after: 'After',
  empty: 'Is empty',
  notEmpty: 'Is not empty',
};

/** Operators available for a column's filter (explicit list or per-type defaults). */
export function gridOperatorsFor(
  filter: { type: PixelDataGridFilterType; operators?: readonly PixelDataGridFilterOperator[] },
): readonly PixelDataGridFilterOperator[] {
  return filter.operators ?? PIXEL_DATA_GRID_DEFAULT_OPERATORS[filter.type];
}

/** Operators that need no value input. */
export function isValuelessGridOperator(operator: PixelDataGridFilterOperator): boolean {
  return operator === 'empty' || operator === 'notEmpty';
}

function looseEquals(a: unknown, b: unknown): boolean {
  if (typeof a === 'boolean' || b === 'true' || b === 'false') {
    return Boolean(a) === (b === true || b === 'true');
  }
  if (typeof a === 'number') {
    return a === Number(b);
  }
  return String(a).toLowerCase() === String(b).toLowerCase();
}

/**
 * Parses a cell / filter value into a `Date`. Date-only ISO strings (`YYYY-MM-DD`) are interpreted
 * as local calendar days (avoids UTC midnight shifting the day in western timezones).
 */
export function parseGridDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
    if (match) {
      const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }
  const date = new Date(value as string | number);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Local calendar-day timestamp for day-granularity date compares. */
export function gridDateDayTime(value: unknown): number | null {
  const date = parseGridDate(value);
  if (!date) {
    return null;
  }
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function isGridDateLike(value: unknown): boolean {
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value.trim());
}

/** Day-equality when either side looks like a date; otherwise falls back to `looseEquals`. */
function dateAwareEquals(raw: unknown, value: unknown): boolean {
  if (isGridDateLike(raw) || isGridDateLike(value)) {
    const a = gridDateDayTime(raw);
    const b = gridDateDayTime(value);
    return a !== null && b !== null && a === b;
  }
  return looseEquals(raw, value);
}

/** Tests a single raw cell value against one column filter. */
export function matchesGridFilter(raw: unknown, filter: PixelDataGridFilterValue): boolean {
  const { operator, value } = filter;
  if (operator === 'empty') {
    return raw === null || raw === undefined || raw === '';
  }
  if (operator === 'notEmpty') {
    return !(raw === null || raw === undefined || raw === '');
  }
  if (raw === null || raw === undefined) {
    return false;
  }

  switch (operator) {
    case 'contains':
      return String(raw).toLowerCase().includes(String(value).toLowerCase());
    case 'startsWith':
      return String(raw).toLowerCase().startsWith(String(value).toLowerCase());
    case 'endsWith':
      return String(raw).toLowerCase().endsWith(String(value).toLowerCase());
    case 'equals':
      return dateAwareEquals(raw, value);
    case 'notEquals':
      return !dateAwareEquals(raw, value);
    case 'gt':
      return Number(raw) > Number(value);
    case 'gte':
      return Number(raw) >= Number(value);
    case 'lt':
      return Number(raw) < Number(value);
    case 'lte':
      return Number(raw) <= Number(value);
    case 'before': {
      const a = gridDateDayTime(raw);
      const b = gridDateDayTime(value);
      return a !== null && b !== null && a < b;
    }
    case 'after': {
      const a = gridDateDayTime(raw);
      const b = gridDateDayTime(value);
      return a !== null && b !== null && a > b;
    }
    default:
      return true;
  }
}

/**
 * Applies the global quick filter (across `quickColumns`) and active per-column filters. Returns a
 * filtered copy; the input is not mutated.
 */
export function filterGridRows<T>(
  rows: readonly T[],
  quickColumns: readonly PixelDataGridColumn<T>[],
  quickFilter: string,
  filters: Record<string, PixelDataGridFilterValue>,
): T[] {
  const term = quickFilter.trim().toLowerCase();
  const active = Object.entries(filters);
  if (!term && active.length === 0) {
    return rows.slice();
  }
  return rows.filter((row) => {
    const record = row as Record<string, unknown>;
    if (
      term &&
      !quickColumns.some((column) =>
        String(record[column.field] ?? '').toLowerCase().includes(term),
      )
    ) {
      return false;
    }
    for (const [field, filter] of active) {
      if (!matchesGridFilter(record[field], filter)) {
        return false;
      }
    }
    return true;
  });
}

// ── Pagination ────────────────────────────────────────────────────────────────────────────────

/** Returns the slice of rows for the given zero-based page. */
export function paginateGridRows<T>(
  rows: readonly T[],
  pageIndex: number,
  pageSize: number,
): T[] {
  const start = pageIndex * pageSize;
  return rows.slice(start, start + pageSize);
}

/** Builds a "1–10 of 42" style range label for the pagination footer. */
export function gridRangeLabel(pageIndex: number, pageSize: number, total: number): string {
  if (total === 0) {
    return '0 of 0';
  }
  const start = pageIndex * pageSize + 1;
  const end = Math.min(start + pageSize - 1, total);
  return `${start}–${end} of ${total}`;
}

// ── Columns: view state ─────────────────────────────────────────────────────────────────────
export function gridStateToJson(state: PixelDataGridState, pretty = false): string {
  return JSON.stringify(state, null, pretty ? 2 : undefined);
}

/** Parses grid view-state JSON. Returns `null` when the payload is malformed. */
export function parseGridState(json: string): PixelDataGridState | null {
  try {
    const parsed = JSON.parse(json) as Partial<PixelDataGridState>;
    if (!parsed || !Array.isArray(parsed.columns)) {
      return null;
    }
    return {
      columns: parsed.columns,
      sort: Array.isArray(parsed.sort) ? parsed.sort : [],
      filters: parsed.filters ?? {},
      quickFilter: typeof parsed.quickFilter === 'string' ? parsed.quickFilter : '',
      page: parsed.page ?? { pageIndex: 0, pageSize: 10 },
    };
  } catch {
    return null;
  }
}

// ── Layout persistence (localStorage) ────────────────────────────────────────────────────────

const GRID_LAYOUT_STORAGE_PREFIX = 'pixel-data-grid.layout.';

/** Persists a serialized view state under `key`. A no-op outside the browser or if storage fails. */
export function writeGridLayout(key: string, json: string): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(GRID_LAYOUT_STORAGE_PREFIX + key, json);
  } catch {
    // Quota exceeded or storage disabled — persistence is best-effort.
  }
}

/** Reads a previously persisted view state for `key`, or `null` if unset/unavailable. */
export function readGridLayout(key: string): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  try {
    return localStorage.getItem(GRID_LAYOUT_STORAGE_PREFIX + key);
  } catch {
    return null;
  }
}

/** Removes a persisted view state for `key`. A no-op outside the browser or if storage fails. */
export function clearGridLayout(key: string): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.removeItem(GRID_LAYOUT_STORAGE_PREFIX + key);
  } catch {
    // ignore
  }
}

// ── Export ────────────────────────────────────────────────────────────────────────────────────

/** Maps grid columns to the shared {@link PixelExportColumn} shape. */
export function toGridExportColumns<T>(
  columns: readonly PixelDataGridColumn<T>[],
  labels?: Pick<PixelDataGridLabels, 'booleanYes' | 'booleanNo'> | null,
): PixelExportColumn[] {
  const yes = labels?.booleanYes ?? 'Yes';
  const no = labels?.booleanNo ?? 'No';
  return columns.map((column) => ({
    key: column.field,
    header: gridHeaderLabel(column),
    type: column.type,
    value: (row: unknown) => {
      const value = (row as Record<string, unknown>)[column.field];
      if (value === null || value === undefined || value === '') {
        return '';
      }
      switch (column.type) {
        case 'date':
          return formatExportDate(value);
        case 'boolean':
          return value ? yes : no;
        default:
          return value instanceof Date ? formatExportDate(value) : value;
      }
    },
  }));
}

/**
 * Builds a delimited (CSV/TSV) document from rows + export columns.
 * @deprecated Prefer `serializeToCsv` / `serializeToTsv` from the shared export service package.
 */
export function gridRowsToDelimited<T>(
  rows: readonly T[],
  columns: readonly PixelDataGridColumn<T>[],
  delimiter = ',',
): string {
  return serializeToDelimited(rows, toGridExportColumns(columns), delimiter);
}

/**
 * Builds a JSON document keyed by header label.
 * @deprecated Prefer `serializeToJson` from the shared export service package.
 */
export function gridRowsToJson<T>(
  rows: readonly T[],
  columns: readonly PixelDataGridColumn<T>[],
  pretty = true,
): string {
  return serializeToJson(rows, toGridExportColumns(columns), { prettyJson: pretty });
}

/**
 * Triggers a browser download of `content` as `fileName`.
 * @deprecated Prefer `saveAs` from the shared export service package.
 */
export function triggerGridDownload(content: string, fileName: string, mime: string): void {
  saveAs(content, fileName, mime);
}

// ── Grouping & aggregation ──────────────────────────────────────────────────────────────────

/** Computes one column's aggregate over a set of rows. */
export function computeGridAggregate<T>(
  aggregator: PixelDataGridAggregator<T>,
  rows: readonly T[],
  field: string,
): unknown {
  if (typeof aggregator === 'function') {
    return aggregator(rows);
  }
  if (aggregator === 'count') {
    return rows.length;
  }
  const numbers = rows
    .map((row) => Number((row as Record<string, unknown>)[field]))
    .filter((value) => Number.isFinite(value));
  if (numbers.length === 0) {
    return null;
  }
  switch (aggregator) {
    case 'sum':
      return numbers.reduce((total, value) => total + value, 0);
    case 'avg':
      return numbers.reduce((total, value) => total + value, 0) / numbers.length;
    case 'min':
      return Math.min(...numbers);
    case 'max':
      return Math.max(...numbers);
    default:
      return null;
  }
}

/** Computes aggregates for every column that declares one, over the given rows. */
export function aggregateGridColumns<T>(
  columns: readonly PixelDataGridColumn<T>[],
  rows: readonly T[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const column of columns) {
    if (column.aggregate !== undefined) {
      result[column.field] = computeGridAggregate(column.aggregate, rows, column.field);
    }
  }
  return result;
}

/** Whether any column declares an aggregate (drives the grand-total footer). */
export function gridHasAggregates<T>(columns: readonly PixelDataGridColumn<T>[]): boolean {
  return columns.some((column) => column.aggregate !== undefined);
}

/** Stable key for one render row, used for tracking. */
export function gridRenderRowKey<T>(renderRow: PixelDataGridRenderRow<T>): string {
  if (renderRow.kind === 'group') {
    return `g:${renderRow.key}`;
  }
  if (renderRow.kind === 'detail') {
    return `x:${renderRow.index}`;
  }
  return `r:${renderRow.index}`;
}

/**
 * Flattens rows into a render list grouped by `groupBy` fields (in order), with per-group
 * aggregates and expand/collapse state. Groups are expanded unless their key is in
 * `collapsedKeys`. Leaf data rows carry their original index (for selection / detail).
 */
export function buildGroupedRenderRows<T>(
  indexedRows: readonly PixelDataGridDataRow<T>[],
  groupBy: readonly string[],
  columns: readonly PixelDataGridColumn<T>[],
  collapsedKeys: ReadonlySet<string>,
  labelFor?: (field: string, value: unknown) => string,
): PixelDataGridRenderRow<T>[] {
  const build = (
    rows: readonly PixelDataGridDataRow<T>[],
    fields: readonly string[],
    level: number,
    parentKey: string,
  ): PixelDataGridRenderRow<T>[] => {
    if (fields.length === 0) {
      return rows.map((dataRow) => ({ ...dataRow, level }));
    }
    const [field, ...rest] = fields;
    const buckets = new Map<unknown, PixelDataGridDataRow<T>[]>();
    for (const dataRow of rows) {
      const value = (dataRow.row as Record<string, unknown>)[field];
      const existing = buckets.get(value);
      if (existing) {
        existing.push(dataRow);
      } else {
        buckets.set(value, [dataRow]);
      }
    }

    const out: PixelDataGridRenderRow<T>[] = [];
    for (const [value, bucketRows] of buckets) {
      const key = `${parentKey}${field}:${String(value)}/`;
      const expanded = !collapsedKeys.has(key);
      out.push({
        kind: 'group',
        key,
        field,
        value,
        label: labelFor ? labelFor(field, value) : String(value ?? '—'),
        level,
        count: bucketRows.length,
        aggregates: aggregateGridColumns(columns, bucketRows.map((dataRow) => dataRow.row)),
        expanded,
      });
      if (expanded) {
        out.push(...build(bucketRows, rest, level + 1, key));
      }
    }
    return out;
  };

  return build(indexedRows, groupBy, 0, '');
}

/** Collects every group key produced for a set of rows (for collapse-all). */
export function collectGridGroupKeys<T>(
  indexedRows: readonly PixelDataGridDataRow<T>[],
  groupBy: readonly string[],
): string[] {
  const keys: string[] = [];
  const walk = (rows: readonly PixelDataGridDataRow<T>[], fields: readonly string[], parentKey: string): void => {
    if (fields.length === 0) {
      return;
    }
    const [field, ...rest] = fields;
    const buckets = new Map<unknown, PixelDataGridDataRow<T>[]>();
    for (const dataRow of rows) {
      const value = (dataRow.row as Record<string, unknown>)[field];
      const existing = buckets.get(value);
      if (existing) {
        existing.push(dataRow);
      } else {
        buckets.set(value, [dataRow]);
      }
    }
    for (const [value, bucketRows] of buckets) {
      const key = `${parentKey}${field}:${String(value)}/`;
      keys.push(key);
      walk(bucketRows, rest, key);
    }
  };
  walk(indexedRows, groupBy, '');
  return keys;
}
