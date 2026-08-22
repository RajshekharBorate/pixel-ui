import { effectiveColumnMinWidthPx } from './pixel-data-grid-header-min-width';
import type { PixelDataGridColumn } from './pixel-data-grid.types';
import { parseGridColumnWidth } from './pixel-data-grid.utils';

/** How the grid distributes column widths relative to the scroll viewport. */
export type PixelDataGridColumnLayout = 'viewport' | 'content';

/** Default flex grow for unsized columns in `viewport` layout. */
export const DEFAULT_COLUMN_FLEX = 1;

/** Fallback base width (px) used before flex distribution. */
export const DEFAULT_UNSIZED_COLUMN_PX = 160;

/** Minimum column width (px) in layout math. */
export const MIN_LAYOUT_COLUMN_PX = 56;

export interface ResolveViewportColumnWidthsInput<T = unknown> {
  readonly columns: readonly PixelDataGridColumn<T>[];
  readonly viewportWidthPx: number;
  readonly leadingWidthPx: number;
  readonly userWidths: Readonly<Record<string, number>>;
  /** Per-field header minimum widths (estimate or DOM-measured). */
  readonly headerMinWidths: Readonly<Record<string, number>>;
}

interface FlexSlot {
  readonly field: string;
  readonly grow: number;
  readonly min: number;
  readonly max: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function minWidthFor(
  column: PixelDataGridColumn,
  headerMinWidths: Readonly<Record<string, number>>,
): number {
  const headerPx = headerMinWidths[column.field] ?? MIN_LAYOUT_COLUMN_PX;
  return effectiveColumnMinWidthPx(column, headerPx);
}

function maxWidthFor(column: PixelDataGridColumn): number {
  return column.maxWidth ?? Number.POSITIVE_INFINITY;
}

function hasFlex(column: PixelDataGridColumn): boolean {
  return column.flex != null && column.flex > 0;
}

function flexGrowFor(column: PixelDataGridColumn): number {
  return column.flex != null && column.flex > 0 ? column.flex : DEFAULT_COLUMN_FLEX;
}

function clampColumnWidth(
  column: PixelDataGridColumn,
  widthPx: number,
  headerMinWidths: Readonly<Record<string, number>>,
): number {
  return clamp(Math.round(widthPx), minWidthFor(column, headerMinWidths), maxWidthFor(column));
}

/**
 * Resolves explicit/flex column widths for `columnLayout="viewport"`.
 *
 * Priority per column: user-resized px → fixed `width` (when no `flex`) → flex share of remainder.
 * Unsized columns without `flex` participate as `flex: 1`.
 */
export function resolveViewportColumnWidths<T>(
  input: ResolveViewportColumnWidthsInput<T>,
): Readonly<Record<string, number>> {
  const { columns, viewportWidthPx, leadingWidthPx, userWidths, headerMinWidths } = input;
  if (columns.length === 0 || viewportWidthPx <= 0) {
    return {};
  }

  const available = Math.max(
    viewportWidthPx - leadingWidthPx,
    columns.reduce((sum, column) => sum + minWidthFor(column, headerMinWidths), 0),
  );

  const result: Record<string, number> = {};
  const flexSlots: FlexSlot[] = [];
  let fixedTotal = 0;

  for (const column of columns) {
    const userWidth = userWidths[column.field];
    if (userWidth !== undefined) {
      const width = clampColumnWidth(column, userWidth, headerMinWidths);
      result[column.field] = width;
      fixedTotal += width;
      continue;
    }

    if (hasFlex(column)) {
      flexSlots.push({
        field: column.field,
        grow: flexGrowFor(column),
        min: minWidthFor(column, headerMinWidths),
        max: maxWidthFor(column),
      });
      continue;
    }

    const parsed = parseGridColumnWidth(column.width);
    if (parsed != null) {
      const width = clampColumnWidth(column, parsed, headerMinWidths);
      result[column.field] = width;
      fixedTotal += width;
      continue;
    }

    flexSlots.push({
      field: column.field,
      grow: flexGrowFor(column),
      min: minWidthFor(column, headerMinWidths),
      max: maxWidthFor(column),
    });
  }

  if (flexSlots.length === 0) {
    return result;
  }

  let remaining = available - fixedTotal;
  if (remaining <= 0) {
    for (const slot of flexSlots) {
      result[slot.field] = slot.min;
    }
    return result;
  }

  const totalGrow = flexSlots.reduce((sum, slot) => sum + slot.grow, 0);
  let assigned = 0;

  for (let index = 0; index < flexSlots.length; index++) {
    const slot = flexSlots[index];
    const isLast = index === flexSlots.length - 1;
    const raw = isLast ? remaining - assigned : (remaining * slot.grow) / totalGrow;
    const width = clampColumnWidth(
      columns.find((column) => column.field === slot.field)!,
      raw,
      headerMinWidths,
    );
    result[slot.field] = width;
    assigned += width;
  }

  return result;
}
