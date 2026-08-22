import { Injectable, computed, inject, signal } from '@angular/core';
import type {
  PixelDataGridColumn,
  PixelDataGridColumnState,
  PixelDataGridCriteria,
  PixelDataGridDataRow,
  PixelDataGridDensity,
  PixelDataGridFilterState,
  PixelDataGridPinSide,
  PixelDataGridRenderRow,
  PixelDataGridRowId,
  PixelDataGridSortDescriptor,
} from './pixel-data-grid.types';
import {
  aggregateGridColumns,
  buildGroupedRenderRows,
  collectGridGroupKeys,
  filterGridRows,
  gridHasAggregates,
  paginateGridRows,
  sortGridRows,
} from './pixel-data-grid.utils';

const MIN_COLUMN_WIDTH = 56;
const DEFAULT_COLUMN_WIDTH = 160;

/**
 * Signal-backed view store for `pixel-data-grid`. Provided by the host component and injected by
 * (future) recursive child components. The host owns the user-facing two-way models and mirrors
 * them into the store; the store derives the render projection through a single
 * filter → sort → paginate pipeline and owns the column view state (order / width / visibility /
 * pinning) for Phase 2 column tooling.
 */
@Injectable()
export class PixelDataGridStore<T = any> {
  // ── Source state (mirrored from host inputs) ──────────────────────────────────────────────
  readonly columns = signal<readonly PixelDataGridColumn<T>[]>([]);
  readonly data = signal<readonly T[]>([]);
  readonly rowId = signal<PixelDataGridRowId<T>>((_row, index) => index);
  readonly density = signal<PixelDataGridDensity>('standard');

  readonly serverSide = signal(false);
  readonly totalRecords = signal<number | null>(null);

  // ── Pipeline state (mirrored from host two-way models) ───────────────────────────────────
  readonly sortModel = signal<readonly PixelDataGridSortDescriptor[]>([]);
  readonly filters = signal<PixelDataGridFilterState>({});
  readonly quickFilter = signal('');
  readonly paginated = signal(false);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  // ── Column view state (Phase 2) ───────────────────────────────────────────────────────────
  /** Field order; empty falls back to the config order. */
  readonly columnOrder = signal<readonly string[]>([]);
  /** Resized widths in px, keyed by field. */
  readonly columnWidths = signal<Readonly<Record<string, number>>>({});
  /** Visibility overrides (field → hidden?); wins over `column.hidden`. */
  readonly hiddenOverrides = signal<Readonly<Record<string, boolean>>>({});
  /** Pin overrides (field → side | null); wins over `column.pinned`. */
  readonly pinnedOverrides = signal<Readonly<Record<string, PixelDataGridPinSide | null>>>({});
  /** Width (px) reserved before the first column — e.g. a sticky selection checkbox column. */
  readonly leadingOffset = signal(0);
  /** Viewport-layout resolved widths (px), keyed by field; set by the host component. */
  readonly resolvedLayoutWidths = signal<Readonly<Record<string, number>> | null>(null);

  // ── Grouping & master-detail (Phase 5) ────────────────────────────────────────────────────
  /** Fields to group rows by, in order. */
  readonly groupBy = signal<readonly string[]>([]);
  /** Collapsed group keys (groups are expanded unless listed here). */
  readonly collapsedGroups = signal<ReadonlySet<string>>(new Set());
  /** Whether master-detail rows are enabled. */
  readonly detailEnabled = signal(false);
  /** Expanded master-detail keys (by `rowId`). */
  readonly expandedDetails = signal<ReadonlySet<string | number>>(new Set());

  // ── Column helpers ────────────────────────────────────────────────────────────────────────
  isColumnHidden(column: PixelDataGridColumn<T>): boolean {
    const override = this.hiddenOverrides()[column.field];
    return override !== undefined ? override : !!column.hidden;
  }

  columnPin(column: PixelDataGridColumn<T>): PixelDataGridPinSide | null {
    const override = this.pinnedOverrides()[column.field];
    return override !== undefined ? override : column.pinned ?? null;
  }

  /** Explicit width in px (resized or fixed config width), or `null` for auto/flexible. */
  columnWidthPx(column: PixelDataGridColumn<T>): number | null {
    return this.columnWidths()[column.field] ?? column.width ?? null;
  }

  /** Width in px to use for sticky-offset math (falls back to a default for unsized columns). */
  columnEffectiveWidthPx(column: PixelDataGridColumn<T>): number {
    const resolved = this.resolvedLayoutWidths()?.[column.field];
    if (resolved !== undefined) {
      return resolved;
    }
    return this.columnWidthPx(column) ?? DEFAULT_COLUMN_WIDTH;
  }

  /** Updates viewport-layout resolved widths used for render + pin offsets. */
  setResolvedLayoutWidths(widths: Readonly<Record<string, number>> | null): void {
    this.resolvedLayoutWidths.set(widths);
  }

  /** Field order to operate on: the override order (reconciled with config) or the config order. */
  currentOrder(): string[] {
    const fields: string[] = this.columns().map((column) => column.field);
    const order = this.columnOrder();
    if (order.length === 0) {
      return fields;
    }
    const merged = order.filter((field) => fields.includes(field));
    for (const field of fields) {
      if (!merged.includes(field)) {
        merged.push(field);
      }
    }
    return merged;
  }

  // ── Derived columns ───────────────────────────────────────────────────────────────────────
  readonly orderedColumns = computed<readonly PixelDataGridColumn<T>[]>(() => {
    const byField = new Map<string, PixelDataGridColumn<T>>(
      this.columns().map((column) => [column.field, column]),
    );
    return this.currentOrder()
      .map((field) => byField.get(field))
      .filter((column): column is PixelDataGridColumn<T> => column != null);
  });

  /**
   * Visible columns arranged left-pinned → unpinned → right-pinned. This is the render order for
   * both the header and the body, and the field set used by the quick filter.
   */
  readonly visibleColumns = computed<readonly PixelDataGridColumn<T>[]>(() => {
    const visible = this.orderedColumns().filter((column) => !this.isColumnHidden(column));
    const left = visible.filter((column) => this.columnPin(column) === 'left');
    const center = visible.filter((column) => this.columnPin(column) === null);
    const right = visible.filter((column) => this.columnPin(column) === 'right');
    return [...left, ...center, ...right];
  });

  /** Columns eligible for the column chooser (not locked visible). */
  readonly chooserColumns = computed(() =>
    this.orderedColumns().filter((column) => !column.lockVisible),
  );

  /** Sticky inset offsets (px) for pinned columns, keyed by field, plus the section edge fields. */
  readonly pinLayout = computed(() => {
    const arranged = this.visibleColumns();
    const left = arranged.filter((column) => this.columnPin(column) === 'left');
    const right = arranged.filter((column) => this.columnPin(column) === 'right');

    const leftOffset: Record<string, number> = {};
    let acc = this.leadingOffset();
    for (const column of left) {
      leftOffset[column.field] = acc;
      acc += this.columnEffectiveWidthPx(column);
    }

    const rightOffset: Record<string, number> = {};
    acc = 0;
    for (const column of [...right].reverse()) {
      rightOffset[column.field] = acc;
      acc += this.columnEffectiveWidthPx(column);
    }

    return {
      leftOffset,
      rightOffset,
      lastLeftField: left.length ? left[left.length - 1].field : null,
      firstRightField: right.length ? right[0].field : null,
    };
  });

  // ── Derivation pipeline ─────────────────────────────────────────────────────────────────
  readonly filteredRows = computed<readonly T[]>(() => {
    if (this.serverSide()) {
      return this.data();
    }
    return filterGridRows(this.data(), this.visibleColumns(), this.quickFilter(), this.filters());
  });

  readonly sortedRows = computed<readonly T[]>(() => {
    if (this.serverSide()) {
      return this.filteredRows();
    }
    return sortGridRows(this.filteredRows(), this.sortModel());
  });

  readonly effectiveTotal = computed(() => this.totalRecords() ?? this.filteredRows().length);

  readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.effectiveTotal() / Math.max(1, this.pageSize()))),
  );

  readonly displayRows = computed<readonly T[]>(() => {
    const rows = this.sortedRows();
    if (!this.paginated() || this.serverSide()) {
      return rows;
    }
    return paginateGridRows(rows, this.pageIndex(), this.pageSize());
  });

  readonly rowCount = computed(() => this.displayRows().length);

  readonly activeFilterCount = computed(() => Object.keys(this.filters()).length);

  readonly criteria = computed<PixelDataGridCriteria>(() => ({
    sort: this.sortModel(),
    page: { pageIndex: this.pageIndex(), pageSize: this.pageSize() },
    quickFilter: this.quickFilter(),
    filters: this.filters(),
  }));

  // ── Grouping / aggregation / detail derivation ───────────────────────────────────────────
  readonly isGrouped = computed(() => this.groupBy().length > 0);

  /** Whether the flattened render path (groups / detail) is active instead of plain rows. */
  readonly useFlatRender = computed(() => this.isGrouped() || this.detailEnabled());

  readonly hasAggregates = computed(() => gridHasAggregates(this.columns()));

  /** Grand-total aggregates over the full filtered set. */
  readonly grandTotals = computed(() => aggregateGridColumns(this.columns(), this.filteredRows()));

  /** Flattened render list: group headers + data rows (+ interleaved expanded detail rows). */
  readonly renderRows = computed<readonly PixelDataGridRenderRow<T>[]>(() => {
    const indexed: PixelDataGridDataRow<T>[] = this.sortedRows().map((row, index) => ({
      kind: 'data',
      row,
      index,
      level: 0,
    }));

    const base = this.isGrouped()
      ? buildGroupedRenderRows(indexed, this.groupBy(), this.columns(), this.collapsedGroups())
      : indexed;

    const expanded = this.expandedDetails();
    if (!this.detailEnabled() || expanded.size === 0) {
      return base;
    }
    const idFn = this.rowId();
    const out: PixelDataGridRenderRow<T>[] = [];
    for (const renderRow of base) {
      out.push(renderRow);
      if (renderRow.kind === 'data' && expanded.has(idFn(renderRow.row, renderRow.index))) {
        out.push({ kind: 'detail', row: renderRow.row, index: renderRow.index });
      }
    }
    return out;
  });

  toggleGroup(key: string): void {
    const next = new Set(this.collapsedGroups());
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this.collapsedGroups.set(next);
  }

  expandAllGroups(): void {
    this.collapsedGroups.set(new Set());
  }

  collapseAllGroups(): void {
    const indexed: PixelDataGridDataRow<T>[] = this.sortedRows().map((row, index) => ({
      kind: 'data',
      row,
      index,
      level: 0,
    }));
    this.collapsedGroups.set(new Set(collectGridGroupKeys(indexed, this.groupBy())));
  }

  toggleDetail(key: string | number): void {
    const next = new Set(this.expandedDetails());
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this.expandedDetails.set(next);
  }

  isDetailExpanded(key: string | number): boolean {
    return this.expandedDetails().has(key);
  }

  // ── Row / sort helpers ────────────────────────────────────────────────────────────────────
  keyFor(row: T, index: number): string | number {
    return this.rowId()(row, index);
  }

  sortDescriptorFor(field: string): PixelDataGridSortDescriptor | undefined {
    return this.sortModel().find((descriptor) => descriptor.field === field);
  }

  sortPriorityFor(field: string): number {
    const index = this.sortModel().findIndex((descriptor) => descriptor.field === field);
    return index < 0 ? 0 : index + 1;
  }

  // ── Column mutations (Phase 2) ────────────────────────────────────────────────────────────
  setColumnWidth(
    field: string,
    width: number,
    minWidth = MIN_COLUMN_WIDTH,
    maxWidth?: number,
  ): void {
    let next = Math.max(minWidth, Math.round(width));
    if (maxWidth != null) {
      next = Math.min(next, maxWidth);
    }
    this.columnWidths.set({
      ...this.columnWidths(),
      [field]: next,
    });
  }

  resetColumnWidth(field: string): void {
    const next = { ...this.columnWidths() };
    delete next[field];
    this.columnWidths.set(next);
  }

  /** Moves `field` to before/after `targetField` in the column order. */
  reorderColumn(field: string, targetField: string, placeAfter: boolean): void {
    if (field === targetField) {
      return;
    }
    const order = this.currentOrder().filter((value) => value !== field);
    let index = order.indexOf(targetField);
    if (index < 0) {
      return;
    }
    if (placeAfter) {
      index += 1;
    }
    order.splice(index, 0, field);
    this.columnOrder.set(order);
  }

  setColumnHidden(field: string, hidden: boolean): void {
    this.hiddenOverrides.set({ ...this.hiddenOverrides(), [field]: hidden });
  }

  toggleColumnHidden(column: PixelDataGridColumn<T>): void {
    this.setColumnHidden(column.field, !this.isColumnHidden(column));
  }

  setColumnPinned(field: string, side: PixelDataGridPinSide | null): void {
    this.pinnedOverrides.set({ ...this.pinnedOverrides(), [field]: side });
  }

  /** Clears all column overrides (order, widths, visibility, pinning). */
  resetColumns(): void {
    this.columnOrder.set([]);
    this.columnWidths.set({});
    this.hiddenOverrides.set({});
    this.pinnedOverrides.set({});
  }

  // ── View state ────────────────────────────────────────────────────────────────────────────
  /** Builds the column-state list in display order. */
  columnStates(): PixelDataGridColumnState[] {
    return this.orderedColumns().map((column) => {
      const state: { field: string; width?: number; hidden?: boolean; pinned?: PixelDataGridPinSide | null } = {
        field: column.field,
      };
      const width = this.columnWidths()[column.field];
      if (width !== undefined) {
        state.width = width;
      }
      const hiddenOverride = this.hiddenOverrides()[column.field];
      if (hiddenOverride !== undefined) {
        state.hidden = hiddenOverride;
      }
      const pinOverride = this.pinnedOverrides()[column.field];
      if (pinOverride !== undefined) {
        state.pinned = pinOverride;
      }
      return state;
    });
  }

  /** Applies a column-state list (order + width + visibility + pinning overrides). */
  applyColumnStates(states: readonly PixelDataGridColumnState[]): void {
    const order: string[] = [];
    const widths: Record<string, number> = {};
    const hidden: Record<string, boolean> = {};
    const pinned: Record<string, PixelDataGridPinSide | null> = {};
    for (const state of states) {
      order.push(state.field);
      if (state.width !== undefined) {
        widths[state.field] = state.width;
      }
      if (state.hidden !== undefined) {
        hidden[state.field] = state.hidden;
      }
      if (state.pinned !== undefined) {
        pinned[state.field] = state.pinned;
      }
    }
    this.columnOrder.set(order);
    this.columnWidths.set(widths);
    this.hiddenOverrides.set(hidden);
    this.pinnedOverrides.set(pinned);
  }
}

/** Convenience inject helper for child components. */
export function injectPixelDataGridStore<T = any>(): PixelDataGridStore<T> {
  return inject(PixelDataGridStore) as PixelDataGridStore<T>;
}
