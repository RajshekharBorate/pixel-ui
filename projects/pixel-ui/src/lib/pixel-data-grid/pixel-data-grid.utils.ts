import type {
  PixelDataGridAggregator,
  PixelDataGridColumn,
  PixelDataGridDataRow,
  PixelDataGridFilterOperator,
  PixelDataGridFilterType,
  PixelDataGridFilterValue,
  PixelDataGridRenderRow,
  PixelDataGridSortDescriptor,
  PixelDataGridState,
} from './pixel-data-grid.types';
import {
  copyTextToClipboard,
  saveAs,
  serializeToDelimited,
  serializeToJson,
  serializeToSpreadsheetXml,
  type PixelExportColumn,
} from '../services/export/public-api';

export { copyTextToClipboard };

/** Header label for a column, falling back to the raw field name. */
export function gridHeaderLabel<T>(column: PixelDataGridColumn<T>): string {
  return column.header ?? column.field;
}

/**
 * Formats a raw cell value for display. A column `valueFormatter` wins; otherwise the built-in
 * `type` formatter is used. Empty values render as an em dash.
 */
export function formatGridCell<T>(row: T, column: PixelDataGridColumn<T>): string {
  const value = (row as Record<string, unknown>)[column.field];
  if (column.valueFormatter) {
    return column.valueFormatter(value, row);
  }
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  switch (column.type) {
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : String(value);
    case 'date': {
      const date = value instanceof Date ? value : new Date(value as string);
      return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
    }
    case 'boolean':
      return value ? 'Yes' : 'No';
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
      return looseEquals(raw, value);
    case 'notEquals':
      return !looseEquals(raw, value);
    case 'gt':
      return Number(raw) > Number(value);
    case 'gte':
      return Number(raw) >= Number(value);
    case 'lt':
      return Number(raw) < Number(value);
    case 'lte':
      return Number(raw) <= Number(value);
    case 'before':
      return new Date(raw as string).getTime() < new Date(value as string).getTime();
    case 'after':
      return new Date(raw as string).getTime() > new Date(value as string).getTime();
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

// ── Columns: widths & view state ─────────────────────────────────────────────────────────────

/** Parses a column `width` string (`'160px'`, `'12rem'`, `'160'`) to px, or `null` if not fixed. */
export function parseGridColumnWidth(width?: string): number | null {
  if (!width) {
    return null;
  }
  const trimmed = width.trim();
  const remMatch = /^(-?\d*\.?\d+)rem$/.exec(trimmed);
  if (remMatch) {
    return parseFloat(remMatch[1]) * 16;
  }
  const pxMatch = /^(-?\d*\.?\d+)(px)?$/.exec(trimmed);
  if (pxMatch) {
    return parseFloat(pxMatch[1]);
  }
  return null;
}

/** Serializes a grid view state to JSON. */
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
): PixelExportColumn[] {
  return columns.map((column) => ({
    key: column.field,
    header: gridHeaderLabel(column),
    value: (row: unknown) => {
      const value = (row as Record<string, unknown>)[column.field];
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value ?? '';
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
 * Builds a SpreadsheetML 2003 workbook (`.xls`) — opens natively in Excel, no dependency.
 * @deprecated Prefer `serializeToSpreadsheetXml` from the shared export service package.
 */
export function gridRowsToSpreadsheetXml<T>(
  rows: readonly T[],
  columns: readonly PixelDataGridColumn<T>[],
  sheetName = 'Sheet1',
): string {
  return serializeToSpreadsheetXml(rows, toGridExportColumns(columns), { sheetName });
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
