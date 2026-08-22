import type { PixelDataGridColumn, PixelDataGridDensity, PixelDataGridPinSide } from './pixel-data-grid.types';
import { MIN_LAYOUT_COLUMN_PX } from './pixel-data-grid-column-layout';

/** Horizontal gap between header flex items (`0.25rem` at 16px root). */
const HEADER_GAP_PX = 4;

/** Compact header icon button (`1.5rem`). */
const ICON_BTN_PX = 24;

/** Sort direction icon (`1.125rem`). */
const SORT_ICON_PX = 18;

/** Multi-sort priority badge minimum inline size. */
const SORT_PRIORITY_PX = 16;

/** Drag handle ligature width estimate. */
const DRAG_HANDLE_PX = 17;

/** Horizontal cell padding (inline × 2) per density — mirrors SCSS tokens. */
const CELL_PADDING_INLINE_PX: Record<PixelDataGridDensity, number> = {
  standard: 16,
  comfortable: 18,
  compact: 12,
};

/** Per-column inputs for header minimum width estimation. */
export interface PixelDataGridHeaderMinWidthContext {
  readonly headerLabel: string;
  readonly density: PixelDataGridDensity;
  readonly sortable: boolean;
  readonly sortPriority: number;
  readonly showSortPriority: boolean;
  readonly pinned: PixelDataGridPinSide | null;
  readonly hasFilter: boolean;
  readonly reorderable: boolean;
  readonly showColumnMenu: boolean;
}

let measureCanvas: CanvasRenderingContext2D | null = null;

/** Measures text width in px using an offscreen canvas (fallback: char count × 7). */
export function measureTextWidthPx(text: string, font = '600 13px sans-serif'): number {
  const value = text.trim();
  if (!value) {
    return 0;
  }
  if (typeof document === 'undefined') {
    return value.length * 7;
  }
  if (!measureCanvas) {
    const canvas = document.createElement('canvas');
    measureCanvas = canvas.getContext('2d');
  }
  if (!measureCanvas) {
    return value.length * 7;
  }
  measureCanvas.font = font;
  return measureCanvas.measureText(value).width;
}

/** Header label font — matches `.pixel-data-grid__cell--header` (label-sm, weight 600). */
export function headerLabelFont(): string {
  return '600 13px var(--pixel-sys-label-font-family, sans-serif)';
}

/**
 * Estimates the minimum column width (px) required to show the full header row without clipping.
 * Includes cell padding, label text, and visible header chrome (sort, filter, pin, drag, menu).
 */
export function estimateHeaderMinWidthPx(
  _column: PixelDataGridColumn,
  context: PixelDataGridHeaderMinWidthContext,
): number {
  const labelWidth = measureTextWidthPx(context.headerLabel, headerLabelFont());
  const padding = CELL_PADDING_INLINE_PX[context.density] * 2;

  let chromeWidth = 0;
  let flexItems = 0;

  if (context.reorderable && !context.pinned) {
    flexItems++;
    chromeWidth += DRAG_HANDLE_PX;
  }

  if (context.sortable) {
    flexItems++;
    chromeWidth += SORT_ICON_PX;
    if (context.showSortPriority && context.sortPriority > 0) {
      chromeWidth += SORT_PRIORITY_PX + HEADER_GAP_PX;
    }
  } else {
    flexItems++;
  }

  if (context.pinned) {
    flexItems++;
    chromeWidth += ICON_BTN_PX;
  }
  if (context.hasFilter) {
    flexItems++;
    chromeWidth += ICON_BTN_PX;
  }
  if (context.showColumnMenu) {
    flexItems++;
    chromeWidth += ICON_BTN_PX;
  }

  const gaps = Math.max(0, flexItems - 1) * HEADER_GAP_PX;
  return Math.ceil(padding + labelWidth + chromeWidth + gaps);
}

/**
 * Resolves the effective minimum width for layout and resize.
 * Explicit `column.minWidth` wins; otherwise uses the header estimate floored at 56px.
 */
export function effectiveColumnMinWidthPx(
  column: PixelDataGridColumn,
  headerMinPx: number,
): number {
  if (column.minWidth !== undefined) {
    return column.minWidth;
  }
  return Math.max(MIN_LAYOUT_COLUMN_PX, Math.round(headerMinPx));
}

/** Reads intrinsic header content width from a rendered `<th>` (ignores stretched cell width). */
export function measureHeaderMinWidthFromElement(th: HTMLElement): number {
  const inner = th.querySelector('.pixel-data-grid__header-inner');
  if (!(inner instanceof HTMLElement)) {
    return 0;
  }
  const style = getComputedStyle(th);
  const paddingInline =
    Number.parseFloat(style.paddingInlineStart || style.paddingLeft || '0') +
    Number.parseFloat(style.paddingInlineEnd || style.paddingRight || '0');

  if (typeof document === 'undefined') {
    return 0;
  }

  const clone = inner.cloneNode(true) as HTMLElement;
  clone.style.cssText =
    'position:fixed;inset-inline-start:-9999px;inset-block-start:0;' +
    'inline-size:max-content;max-inline-size:none;visibility:hidden;pointer-events:none;';
  document.body.appendChild(clone);
  const contentWidth = Math.ceil(clone.getBoundingClientRect().width);
  clone.remove();
  return contentWidth + paddingInline;
}
