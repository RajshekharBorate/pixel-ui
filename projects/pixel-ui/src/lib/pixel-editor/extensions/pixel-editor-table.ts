import { Table, TableView } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import type { Editor } from '@tiptap/core';
import type { DOMOutputSpec, Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Plugin } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import { cellAround, findTable, TableMap } from '@tiptap/pm/tables';

/** Default column width (px) — matches the “Default” column preset. */
export const PIXEL_EDITOR_DEFAULT_COLUMN_WIDTH_PX = 120;

/** Preset column widths (px) for the floating table toolbar. */
export const PIXEL_EDITOR_TABLE_COLUMN_WIDTHS = [
  { id: 'narrow', label: 'Narrow', value: 80 },
  { id: 'default', label: 'Default', value: PIXEL_EDITOR_DEFAULT_COLUMN_WIDTH_PX },
  { id: 'wide', label: 'Wide', value: 180 },
  { id: 'extraWide', label: 'Extra wide', value: 240 },
] as const;

/** Preset row heights for the floating table toolbar. */
export const PIXEL_EDITOR_TABLE_ROW_HEIGHTS = [
  { id: 'compact', label: 'Compact', value: '1.75rem' },
  { id: 'default', label: 'Default', value: null },
  { id: 'comfortable', label: 'Comfortable', value: '3.5rem' },
  { id: 'tall', label: 'Tall', value: '5rem' },
] as const;

/** Whole-table width presets (CSS width). */
export const PIXEL_EDITOR_TABLE_WIDTHS = [
  { id: 'fit', label: 'Fit content', value: null },
  { id: '25', label: '25%', value: '25%' },
  { id: '50', label: '50%', value: '50%' },
  { id: '75', label: '75%', value: '75%' },
  { id: '100', label: '100%', value: '100%' },
] as const;

export type PixelEditorTableColumnWidthId =
  (typeof PIXEL_EDITOR_TABLE_COLUMN_WIDTHS)[number]['id'];
export type PixelEditorTableRowHeightId =
  (typeof PIXEL_EDITOR_TABLE_ROW_HEIGHTS)[number]['id'];
export type PixelEditorTableWidthId = (typeof PIXEL_EDITOR_TABLE_WIDTHS)[number]['id'];
export type PixelEditorTableCellAlign = 'left' | 'center' | 'right';
export type PixelEditorTableBorderStyle = 'dashed' | 'solid' | 'none';

/** Border style presets for the floating table toolbar. */
export const PIXEL_EDITOR_TABLE_BORDER_STYLES = [
  { id: 'dashed', label: 'Dashed', value: 'dashed' as const, icon: 'border_clear' },
  { id: 'solid', label: 'Solid', value: 'solid' as const, icon: 'border_all' },
  { id: 'none', label: 'None', value: 'none' as const, icon: 'border_style' },
] as const;

/** Percent widths are layout presets; pixel widths are owned by TipTap colwidths. */
function isPercentDisplayWidth(width: string | null | undefined): width is string {
  return typeof width === 'string' && /%\s*$/.test(width.trim());
}

function applyHeaderColor(table: HTMLTableElement, node: ProseMirrorNode): void {
  const color = node.attrs['headerColor'] as string | null;
  if (color) {
    table.setAttribute('data-header-color', color);
    table.style.setProperty('--pixel-editor-table-header-bg', color);
  } else {
    table.removeAttribute('data-header-color');
    table.style.removeProperty('--pixel-editor-table-header-bg');
  }
}

/**
 * Apply table width presets. Only percentage `displayWidth` overrides TipTap’s
 * colgroup-driven width — never re-apply px locks (they fight column resize).
 */
function applyDisplayWidth(table: HTMLTableElement, node: ProseMirrorNode): void {
  const width = node.attrs['displayWidth'] as string | null;
  if (isPercentDisplayWidth(width)) {
    table.setAttribute('data-display-width', width);
    table.style.width = width;
    table.style.maxWidth = '100%';
    return;
  }
  table.removeAttribute('data-display-width');
  // Leave table.style.width / minWidth to TipTap updateColumns.
}

function applyBorderStyle(table: HTMLTableElement, node: ProseMirrorNode): void {
  const style = (node.attrs['borderStyle'] as PixelEditorTableBorderStyle | null) ?? 'dashed';
  table.setAttribute('data-border-style', style);
}

function readColumnWidthsPx(tableNode: ProseMirrorNode, cellMinWidth: number): number[] {
  const row = tableNode.firstChild;
  if (!row) return [];
  const widths: number[] = [];
  for (let i = 0; i < row.childCount; i++) {
    const cell = row.child(i);
    const colspan = (cell.attrs['colspan'] as number) ?? 1;
    const colwidth = cell.attrs['colwidth'] as number[] | null;
    for (let j = 0; j < colspan; j++) {
      widths.push(colwidth?.[j] ?? cellMinWidth);
    }
  }
  return widths;
}

function paintColWidths(
  colgroup: HTMLTableColElement,
  table: HTMLTableElement,
  widths: number[],
): void {
  let total = 0;
  let colEl = colgroup.firstElementChild as HTMLElement | null;
  for (let i = 0; i < widths.length; i++) {
    const w = Math.max(1, Math.round(widths[i]!));
    total += w;
    if (!colEl) {
      colEl = document.createElement('col');
      colgroup.appendChild(colEl);
    }
    colEl.style.width = `${w}px`;
    colEl.style.minWidth = `${w}px`;
    colEl = colEl.nextElementSibling as HTMLElement | null;
  }
  while (colEl) {
    const next = colEl.nextElementSibling as HTMLElement | null;
    colEl.remove();
    colEl = next;
  }
  table.style.width = `${total}px`;
  table.style.minWidth = '';
  table.style.height = '';
}

function commitColumnWidths(
  view: EditorView,
  tablePos: number,
  widths: number[],
  clearPercentWidth: boolean,
): void {
  const table = view.state.doc.nodeAt(tablePos);
  if (!table) return;
  const map = TableMap.get(table);
  if (widths.length !== map.width) return;

  let tr = view.state.tr;
  const tableStart = tablePos + 1;
  for (let row = 0; row < map.height; row++) {
    for (let col = 0; col < map.width; ) {
      const cellOffset = map.map[row * map.width + col]!;
      const cellPos = tableStart + cellOffset;
      const cell = tr.doc.nodeAt(cellPos);
      if (!cell) {
        col += 1;
        continue;
      }
      const colspan = (cell.attrs['colspan'] as number) ?? 1;
      const colwidth = widths.slice(col, col + colspan).map((w) => Math.max(1, Math.round(w)));
      tr = tr.setNodeMarkup(cellPos, undefined, {
        ...cell.attrs,
        colwidth,
      });
      col += colspan;
    }
  }

  const latest = tr.doc.nodeAt(tablePos);
  if (latest) {
    const nextAttrs: Record<string, unknown> = {
      ...latest.attrs,
      displayHeight: null,
    };
    if (clearPercentWidth || isPercentDisplayWidth(latest.attrs['displayWidth'] as string | null)) {
      nextAttrs['displayWidth'] = null;
    }
    tr = tr.setNodeMarkup(tablePos, undefined, nextAttrs);
  }
  view.dispatch(tr);
}

/**
 * Live table NodeView resize model:
 * - Columns: TipTap `columnResizing` (colwidth) — do not fight with px displayWidth
 * - Rows: one edge handle near row bottoms → `rowHeight` on `tableRow`
 * - Corner: scale all column widths (X) + last-row height (Y); only while selected
 */
class PixelEditorTableView extends TableView {
  private readonly editorView: EditorView | undefined;
  private readonly cornerHandle: HTMLDivElement;
  private readonly rowHandle: HTMLDivElement;
  private dragCleanup: (() => void) | null = null;
  private placeHandlesRaf = 0;
  private activeRowIndex: number | null = null;

  constructor(
    node: ProseMirrorNode,
    cellMinWidth: number,
    view?: EditorView,
    HTMLAttributes: Record<string, unknown> = {},
  ) {
    super(node, cellMinWidth, view, HTMLAttributes);
    this.editorView = view;
    this.dom.classList.add('pixel-editor-table-wrapper');
    this.dom.style.position = 'relative';

    this.cornerHandle = document.createElement('div');
    this.cornerHandle.className = 'pixel-editor-table__table-resize';
    this.cornerHandle.title = 'Resize table';
    this.cornerHandle.setAttribute('aria-hidden', 'true');
    this.cornerHandle.hidden = true;
    this.dom.appendChild(this.cornerHandle);
    this.cornerHandle.addEventListener('pointerdown', this.onCornerPointerDown);

    this.rowHandle = document.createElement('div');
    this.rowHandle.className = 'row-resize-handle';
    this.rowHandle.title = 'Resize row';
    this.rowHandle.setAttribute('aria-hidden', 'true');
    this.rowHandle.hidden = true;
    this.dom.appendChild(this.rowHandle);
    this.rowHandle.addEventListener('pointerdown', this.onRowHandlePointerDown);

    this.dom.addEventListener('pointermove', this.onWrapperPointerMove);
    this.dom.addEventListener('pointerleave', this.onWrapperPointerLeave);

    this.syncChrome(node);
    this.schedulePlaceHandles();
  }

  override update(node: ProseMirrorNode): boolean {
    const ok = super.update(node);
    if (!ok) return false;
    // Re-apply percent width / row heights after TipTap updateColumns.
    this.syncChrome(node);
    this.schedulePlaceHandles();
    return true;
  }

  destroy(): void {
    this.dragCleanup?.();
    this.dragCleanup = null;
    if (this.placeHandlesRaf) cancelAnimationFrame(this.placeHandlesRaf);
    this.cornerHandle.removeEventListener('pointerdown', this.onCornerPointerDown);
    this.rowHandle.removeEventListener('pointerdown', this.onRowHandlePointerDown);
    this.dom.removeEventListener('pointermove', this.onWrapperPointerMove);
    this.dom.removeEventListener('pointerleave', this.onWrapperPointerLeave);
  }

  private syncChrome(node: ProseMirrorNode): void {
    applyHeaderColor(this.table, node);
    applyDisplayWidth(this.table, node);
    // Never keep a stale table-level height — rows own height.
    this.table.style.height = '';
    this.table.removeAttribute('data-display-height');
    applyBorderStyle(this.table, node);
    this.syncRowHeights(node);
    this.refreshActiveState();
  }

  private syncRowHeights(node: ProseMirrorNode): void {
    const rows = Array.from(this.contentDOM.children) as HTMLElement[];
    node.forEach((rowNode, _offset, index) => {
      const el = rows[index];
      if (!el) return;
      const height = rowNode.attrs['rowHeight'] as string | null;
      if (height) {
        el.style.height = height;
        el.style.minHeight = height;
        el.setAttribute('data-row-height', height);
        for (const cell of Array.from(el.children) as HTMLElement[]) {
          cell.style.minHeight = height;
        }
      } else {
        el.style.height = '';
        el.style.minHeight = '';
        el.removeAttribute('data-row-height');
        for (const cell of Array.from(el.children) as HTMLElement[]) {
          cell.style.minHeight = '';
        }
      }
    });
  }

  private isSelectionInThisTable(): boolean {
    if (!this.editorView) return false;
    const tablePos = this.getTablePos();
    if (tablePos == null) return false;
    const table = this.editorView.state.doc.nodeAt(tablePos);
    if (!table) return false;
    const { from, to } = this.editorView.state.selection;
    const end = tablePos + table.nodeSize;
    return from >= tablePos && to <= end;
  }

  refreshActiveState(): void {
    const active = this.isSelectionInThisTable();
    this.dom.classList.toggle('pixel-editor-table-wrapper--active', active);
    this.cornerHandle.hidden = !active;
    if (!active) {
      this.hideRowHandle();
    } else {
      this.placeCornerHandle();
    }
  }

  private schedulePlaceHandles(): void {
    if (this.placeHandlesRaf) cancelAnimationFrame(this.placeHandlesRaf);
    this.placeHandlesRaf = requestAnimationFrame(() => {
      this.placeHandlesRaf = 0;
      this.refreshActiveState();
      this.placeCornerHandle();
      if (this.activeRowIndex != null) this.placeRowHandle(this.activeRowIndex);
    });
  }

  private placeCornerHandle(): void {
    if (this.cornerHandle.hidden) return;
    const wrapperRect = this.dom.getBoundingClientRect();
    const tableRect = this.table.getBoundingClientRect();
    this.cornerHandle.style.left = `${Math.max(0, tableRect.right - wrapperRect.left - 5)}px`;
    this.cornerHandle.style.top = `${Math.max(0, tableRect.bottom - wrapperRect.top - 5)}px`;
  }

  private hideRowHandle(): void {
    this.activeRowIndex = null;
    this.rowHandle.hidden = true;
    this.dom.classList.remove('pixel-editor-table-wrapper--row-resize');
  }

  private placeRowHandle(rowIndex: number): void {
    const rows = Array.from(this.contentDOM.children) as HTMLElement[];
    const row = rows[rowIndex];
    if (!row || this.cornerHandle.hidden) {
      this.hideRowHandle();
      return;
    }
    this.activeRowIndex = rowIndex;
    this.rowHandle.hidden = false;
    this.dom.classList.add('pixel-editor-table-wrapper--row-resize');
    const wrapperRect = this.dom.getBoundingClientRect();
    const tableRect = this.table.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    this.rowHandle.style.left = `${tableRect.left - wrapperRect.left}px`;
    this.rowHandle.style.width = `${tableRect.width}px`;
    this.rowHandle.style.top = `${rowRect.bottom - wrapperRect.top - 4}px`;
  }

  private onWrapperPointerMove = (event: PointerEvent): void => {
    if (this.dragCleanup || this.cornerHandle.hidden) return;
    if (event.target === this.cornerHandle || event.target === this.rowHandle) return;
    if (this.editorView?.dom.classList.contains('resize-cursor')) {
      this.hideRowHandle();
      return;
    }

    const tableRect = this.table.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    if (this.isNearColumnEdge(x, y, tableRect)) {
      this.hideRowHandle();
      return;
    }

    const rowIndex = this.findRowEdgeIndex(x, y, tableRect);
    if (rowIndex == null) {
      this.hideRowHandle();
      return;
    }
    this.placeRowHandle(rowIndex);
  };

  private onWrapperPointerLeave = (event: PointerEvent): void => {
    if (this.dragCleanup) return;
    const next = event.relatedTarget as Node | null;
    if (next && this.dom.contains(next)) return;
    this.hideRowHandle();
  };

  private isNearColumnEdge(clientX: number, clientY: number, tableRect: DOMRect): boolean {
    if (
      clientX < tableRect.left - 6 ||
      clientX > tableRect.right + 6 ||
      clientY < tableRect.top - 6 ||
      clientY > tableRect.bottom + 6
    ) {
      return false;
    }
    const cells = Array.from(this.table.querySelectorAll('td, th')) as HTMLElement[];
    const EDGE = 6;
    for (const cell of cells) {
      const r = cell.getBoundingClientRect();
      if (clientY < r.top || clientY > r.bottom) continue;
      // Skip the table’s outer right edge — corner handle owns that.
      if (Math.abs(clientX - r.right) <= EDGE && Math.abs(clientX - tableRect.right) > EDGE) {
        return true;
      }
      if (Math.abs(clientX - r.right) <= EDGE && Math.abs(clientX - tableRect.right) <= EDGE) {
        // Rightmost column edge: TipTap still owns vertical resize unless on corner.
        return clientY < tableRect.bottom - 12;
      }
    }
    return false;
  }

  private findRowEdgeIndex(
    clientX: number,
    clientY: number,
    tableRect: DOMRect,
  ): number | null {
    if (clientX < tableRect.left || clientX > tableRect.right) return null;
    if (clientY < tableRect.top - 6 || clientY > tableRect.bottom + 6) return null;
    // Keep the SE corner free for the table handle.
    if (
      clientX > tableRect.right - 12 &&
      clientY > tableRect.bottom - 12
    ) {
      return null;
    }
    const rows = Array.from(this.contentDOM.children) as HTMLElement[];
    const EDGE = 6;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]!.getBoundingClientRect();
      if (Math.abs(clientY - r.bottom) <= EDGE) return i;
    }
    return null;
  }

  private getTablePos(): number | null {
    if (!this.editorView) return null;
    try {
      const pos = this.editorView.posAtDOM(this.table, 0);
      const info = findTable(this.editorView.state.doc.resolve(pos));
      return info?.pos ?? null;
    } catch {
      return null;
    }
  }

  private onCornerPointerDown = (event: PointerEvent): void => {
    if (!this.editorView || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    this.hideRowHandle();

    const tablePos = this.getTablePos();
    const tableNode = tablePos != null ? this.editorView.state.doc.nodeAt(tablePos) : null;
    if (tablePos == null || !tableNode) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const startWidths = readColumnWidthsPx(tableNode, this.cellMinWidth);
    const startTotal = startWidths.reduce((a, b) => a + b, 0) || startWidths.length * this.cellMinWidth;
    const rows = Array.from(this.contentDOM.children) as HTMLElement[];
    const lastRow = rows[rows.length - 1];
    const startLastRowH = lastRow?.getBoundingClientRect().height ?? 28;
    const host = this.dom.parentElement;
    const maxWidth = host?.clientWidth ?? startTotal;
    const minTotal = this.cellMinWidth * startWidths.length;

    this.cornerHandle.setPointerCapture?.(event.pointerId);

    const onMove = (ev: PointerEvent): void => {
      const nextTotal = Math.min(
        maxWidth,
        Math.max(minTotal, Math.round(startTotal + (ev.clientX - startX))),
      );
      const scale = nextTotal / startTotal;
      const nextWidths = startWidths.map((w) => Math.max(this.cellMinWidth, Math.round(w * scale)));
      // Fix rounding so sum matches nextTotal.
      const sum = nextWidths.reduce((a, b) => a + b, 0);
      if (nextWidths.length) {
        nextWidths[nextWidths.length - 1]! += nextTotal - sum;
      }
      paintColWidths(this.colgroup, this.table, nextWidths);

      if (lastRow) {
        const nextH = Math.max(24, Math.round(startLastRowH + (ev.clientY - startY)));
        lastRow.style.height = `${nextH}px`;
        lastRow.style.minHeight = `${nextH}px`;
        for (const cell of Array.from(lastRow.children) as HTMLElement[]) {
          cell.style.minHeight = `${nextH}px`;
        }
      }
      this.placeCornerHandle();
    };

    const onUp = (ev: PointerEvent): void => {
      this.cornerHandle.releasePointerCapture?.(ev.pointerId);
      this.dragCleanup?.();
      this.dragCleanup = null;

      const nextTotal = Math.min(
        maxWidth,
        Math.max(minTotal, Math.round(startTotal + (ev.clientX - startX))),
      );
      const scale = nextTotal / startTotal;
      const nextWidths = startWidths.map((w) => Math.max(this.cellMinWidth, Math.round(w * scale)));
      const sum = nextWidths.reduce((a, b) => a + b, 0);
      if (nextWidths.length) {
        nextWidths[nextWidths.length - 1]! += nextTotal - sum;
      }
      commitColumnWidths(this.editorView!, tablePos, nextWidths, true);

      if (lastRow) {
        const nextH = Math.max(24, Math.round(startLastRowH + (ev.clientY - startY)));
        this.commitRowHeight(rows.length - 1, `${nextH}px`);
      }
    };

    this.dragCleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  private onRowHandlePointerDown = (event: PointerEvent): void => {
    if (this.activeRowIndex == null) return;
    const rows = Array.from(this.contentDOM.children) as HTMLElement[];
    const rowEl = rows[this.activeRowIndex];
    if (!rowEl) return;
    this.onRowHeightPointerDown(event, this.activeRowIndex, rowEl);
  };

  private onRowHeightPointerDown = (
    event: PointerEvent,
    rowIndex: number,
    rowEl: HTMLElement,
  ): void => {
    if (!this.editorView || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const startY = event.clientY;
    const startHeight = rowEl.getBoundingClientRect().height;
    this.dom.classList.add('resize-cursor-row');
    this.rowHandle.setPointerCapture?.(event.pointerId);

    const onMove = (ev: PointerEvent): void => {
      const next = Math.max(24, Math.round(startHeight + (ev.clientY - startY)));
      rowEl.style.height = `${next}px`;
      rowEl.style.minHeight = `${next}px`;
      for (const cell of Array.from(rowEl.children) as HTMLElement[]) {
        cell.style.minHeight = `${next}px`;
      }
      this.table.style.height = '';
      this.placeRowHandle(rowIndex);
      this.placeCornerHandle();
    };

    const onUp = (ev: PointerEvent): void => {
      this.rowHandle.releasePointerCapture?.(ev.pointerId);
      this.dom.classList.remove('resize-cursor-row');
      this.dragCleanup?.();
      this.dragCleanup = null;
      const height = Math.max(24, Math.round(startHeight + (ev.clientY - startY)));
      this.commitRowHeight(rowIndex, `${height}px`);
    };

    this.dragCleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  private commitRowHeight(rowIndex: number, height: string): void {
    const view = this.editorView;
    const tablePos = this.getTablePos();
    if (!view || tablePos == null) return;
    const table = view.state.doc.nodeAt(tablePos);
    if (!table) return;

    let rowPos = tablePos + 1;
    for (let i = 0; i < rowIndex; i++) {
      rowPos += table.child(i).nodeSize;
    }
    const rowNode = view.state.doc.nodeAt(rowPos);
    if (!rowNode || rowNode.type.name !== 'tableRow') return;

    let tr = view.state.tr.setNodeMarkup(rowPos, undefined, {
      ...rowNode.attrs,
      rowHeight: height,
    });
    // Drop legacy table-level height if present.
    const latestTable = tr.doc.nodeAt(tablePos);
    if (latestTable?.attrs['displayHeight']) {
      tr = tr.setNodeMarkup(tablePos, undefined, {
        ...latestTable.attrs,
        displayHeight: null,
      });
    }
    view.dispatch(tr);
  }
}

/**
 * Table with header fill, display size, and border style.
 */
export const PixelEditorTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      headerColor: {
        default: null as string | null,
        parseHTML: (element) => element.getAttribute('data-header-color'),
        renderHTML: (attributes) => {
          if (!attributes['headerColor']) return {};
          return { 'data-header-color': attributes['headerColor'] as string };
        },
      },
      displayWidth: {
        default: null as string | null,
        parseHTML: (element) =>
          element.getAttribute('data-display-width') ||
          (element as HTMLElement).style.width ||
          null,
        renderHTML: (attributes) => {
          if (!attributes['displayWidth']) return {};
          return { 'data-display-width': attributes['displayWidth'] as string };
        },
      },
      displayHeight: {
        default: null as string | null,
        parseHTML: (element) =>
          element.getAttribute('data-display-height') ||
          (element as HTMLElement).style.height ||
          null,
        renderHTML: (attributes) => {
          if (!attributes['displayHeight']) return {};
          return { 'data-display-height': attributes['displayHeight'] as string };
        },
      },
      borderStyle: {
        default: 'dashed' as PixelEditorTableBorderStyle,
        parseHTML: (element) => {
          const v = element.getAttribute('data-border-style');
          return v === 'solid' || v === 'none' || v === 'dashed' ? v : 'dashed';
        },
        renderHTML: (attributes) => {
          const style = (attributes['borderStyle'] as PixelEditorTableBorderStyle) || 'dashed';
          return { 'data-border-style': style };
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [...(this.parent?.() ?? []), createTableSelectionChromePlugin()];
  },

  renderHTML({ node, HTMLAttributes }): DOMOutputSpec {
    const result = this.parent?.({ node, HTMLAttributes });
    const headerColor = node.attrs['headerColor'] as string | null;
    const displayWidth = node.attrs['displayWidth'] as string | null;
    const displayHeight = node.attrs['displayHeight'] as string | null;
    const borderStyle =
      (node.attrs['borderStyle'] as PixelEditorTableBorderStyle | null) ?? 'dashed';
    if (!result) {
      return ['table', HTMLAttributes, ['tbody', 0]];
    }
    return injectTableAttrs(result, {
      headerColor,
      displayWidth,
      displayHeight,
      borderStyle,
    });
  },
}).configure({
  resizable: true,
  handleWidth: 6,
  cellMinWidth: 48,
  lastColumnResizable: true,
  View: PixelEditorTableView,
  HTMLAttributes: { class: 'pixel-editor-table' },
});

/** Keep corner/row chrome visible only for the table that owns the selection. */
function createTableSelectionChromePlugin() {
  return new Plugin({
    view(editorView) {
      const sync = (): void => {
        const info = findTable(editorView.state.selection.$from);
        editorView.dom.querySelectorAll('.pixel-editor-table-wrapper').forEach((el) => {
          const table = el.querySelector('table') as HTMLTableElement | null;
          let active = false;
          if (info && table) {
            try {
              const pos = editorView.posAtDOM(table, 0);
              const found = findTable(editorView.state.doc.resolve(pos));
              active = !!found && found.pos === info.pos;
            } catch {
              active = false;
            }
          }
          el.classList.toggle('pixel-editor-table-wrapper--active', active);
          const corner = el.querySelector(
            '.pixel-editor-table__table-resize',
          ) as HTMLElement | null;
          if (corner) {
            corner.hidden = !active;
            if (active && table) {
              const wrapperRect = el.getBoundingClientRect();
              const tableRect = table.getBoundingClientRect();
              corner.style.left = `${Math.max(0, tableRect.right - wrapperRect.left - 5)}px`;
              corner.style.top = `${Math.max(0, tableRect.bottom - wrapperRect.top - 5)}px`;
            }
          }
          if (!active) {
            const row = el.querySelector('.row-resize-handle') as HTMLElement | null;
            if (row) {
              row.hidden = true;
              el.classList.remove('pixel-editor-table-wrapper--row-resize');
            }
          }
        });
      };
      return { update: sync };
    },
  });
}

function injectTableAttrs(
  result: DOMOutputSpec,
  opts: {
    headerColor: string | null;
    displayWidth: string | null;
    displayHeight: string | null;
    borderStyle: PixelEditorTableBorderStyle;
  },
): DOMOutputSpec {
  const { headerColor, displayWidth, displayHeight, borderStyle } = opts;
  const inject = (attrs: Record<string, unknown>): Record<string, unknown> => {
    let style = typeof attrs['style'] === 'string' ? attrs['style'] : '';
    const next: Record<string, unknown> = {
      ...attrs,
      'data-border-style': borderStyle,
    };
    if (headerColor) {
      next['data-header-color'] = headerColor;
      const varDecl = `--pixel-editor-table-header-bg: ${headerColor}`;
      style = style ? `${style}; ${varDecl}` : varDecl;
    }
    if (displayWidth) {
      next['data-display-width'] = displayWidth;
      // Only bake percent widths into HTML style; px sizing comes from colgroup/colwidth.
      if (isPercentDisplayWidth(displayWidth)) {
        const widthDecl = `width: ${displayWidth}; max-width: 100%`;
        style = style ? `${style}; ${widthDecl}` : widthDecl;
      }
    }
    if (displayHeight) {
      next['data-display-height'] = displayHeight;
    }
    if (style) next['style'] = style;
    return next;
  };

  if (!Array.isArray(result)) return result;
  if (result[0] === 'table' && result[1] && typeof result[1] === 'object') {
    return [result[0], inject(result[1] as Record<string, unknown>), ...result.slice(2)] as DOMOutputSpec;
  }
  if (
    result[0] === 'div' &&
    Array.isArray(result[2]) &&
    result[2][0] === 'table' &&
    result[2][1] &&
    typeof result[2][1] === 'object'
  ) {
    const tableSpec = result[2] as unknown[];
    return [
      result[0],
      result[1],
      [tableSpec[0], inject(tableSpec[1] as Record<string, unknown>), ...tableSpec.slice(2)],
    ] as DOMOutputSpec;
  }
  return result;
}
export const PixelEditorTableRow = TableRow.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      rowHeight: {
        default: null as string | null,
        parseHTML: (element) => element.getAttribute('data-row-height'),
        renderHTML: (attributes) => {
          if (!attributes['rowHeight']) return {};
          return {
            'data-row-height': attributes['rowHeight'] as string,
            style: `height: ${attributes['rowHeight'] as string}`,
          };
        },
      },
    };
  },
});

function createCellBackgroundAttribute() {
  return {
    default: null as string | null,
    parseHTML: (element: HTMLElement) =>
      element.getAttribute('data-bg') || element.style.backgroundColor || null,
    renderHTML: (attributes: Record<string, unknown>) => {
      if (!attributes['backgroundColor']) return {};
      return {
        'data-bg': attributes['backgroundColor'] as string,
        style: `background-color: ${attributes['backgroundColor'] as string}`,
      };
    },
  };
}

export const PixelEditorTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: createCellBackgroundAttribute(),
    };
  },
});

export const PixelEditorTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: createCellBackgroundAttribute(),
    };
  },
});

/** Set `colwidth` for every cell in the current column. */
export function setTableColumnWidth(editor: Editor, widthPx: number | null): boolean {
  const { state } = editor;
  const $cell = cellAround(state.selection.$from);
  const tableInfo = findTable(state.selection.$from);
  if (!$cell || !tableInfo) return false;

  const map = TableMap.get(tableInfo.node);
  const relative = $cell.pos - tableInfo.start;
  const rect = map.findCell(relative);
  const cellOffsets = map.cellsInRect({
    left: rect.left,
    right: rect.left + 1,
    top: 0,
    bottom: map.height,
  });

  let tr = state.tr;
  for (const offset of cellOffsets) {
    const cellPos = tableInfo.start + offset;
    const cell = tr.doc.nodeAt(cellPos);
    if (!cell) continue;
    const colspan = (cell.attrs['colspan'] as number) ?? 1;
    const colwidth =
      widthPx == null ? null : Array.from({ length: colspan }, () => widthPx);
    tr = tr.setNodeMarkup(cellPos, undefined, {
      ...cell.attrs,
      colwidth,
    });
  }
  if (tr.docChanged) {
    const latest = tr.doc.nodeAt(tableInfo.pos);
    if (latest && latest.attrs['displayWidth'] != null) {
      tr = tr.setNodeMarkup(tableInfo.pos, undefined, {
        ...latest.attrs,
        displayWidth: null,
      });
    }
    editor.view.dispatch(tr);
  }
  return true;
}

/** Apply the same column width to every column in the active table. */
export function applyAllColumnWidths(editor: Editor, widthPx: number): boolean {
  const tableInfo = findTable(editor.state.selection.$from);
  if (!tableInfo) return false;

  const map = TableMap.get(tableInfo.node);
  const cellOffsets = map.cellsInRect({
    left: 0,
    right: map.width,
    top: 0,
    bottom: map.height,
  });

  let tr = editor.state.tr;
  for (const offset of cellOffsets) {
    const cellPos = tableInfo.start + offset;
    const cell = tr.doc.nodeAt(cellPos);
    if (!cell) continue;
    const colspan = (cell.attrs['colspan'] as number) ?? 1;
    tr = tr.setNodeMarkup(cellPos, undefined, {
      ...cell.attrs,
      colwidth: Array.from({ length: colspan }, () => widthPx),
    });
  }
  if (tr.docChanged) {
    const latest = tr.doc.nodeAt(tableInfo.pos);
    if (latest && latest.attrs['displayWidth'] != null) {
      tr = tr.setNodeMarkup(tableInfo.pos, undefined, {
        ...latest.attrs,
        displayWidth: null,
      });
    }
    editor.view.dispatch(tr);
  }
  return true;
}

/** Clear all column widths so columns share space evenly. */
export function equalizeTableColumns(editor: Editor): boolean {
  const { state } = editor;
  const tableInfo = findTable(state.selection.$from);
  if (!tableInfo) return false;

  const map = TableMap.get(tableInfo.node);
  const cellOffsets = map.cellsInRect({
    left: 0,
    right: map.width,
    top: 0,
    bottom: map.height,
  });

  let tr = state.tr;
  for (const offset of cellOffsets) {
    const cellPos = tableInfo.start + offset;
    const cell = tr.doc.nodeAt(cellPos);
    if (!cell || cell.attrs['colwidth'] == null) continue;
    tr = tr.setNodeMarkup(cellPos, undefined, {
      ...cell.attrs,
      colwidth: null,
    });
  }
  if (tr.docChanged) editor.view.dispatch(tr);
  return true;
}

/** Set height on the current table row. */
export function setTableRowHeight(editor: Editor, height: string | null): boolean {
  const { state } = editor;
  const $cell = cellAround(state.selection.$from);
  const tableInfo = findTable(state.selection.$from);
  if (!$cell || !tableInfo) return false;

  const map = TableMap.get(tableInfo.node);
  const relative = $cell.pos - tableInfo.start;
  const rect = map.findCell(relative);

  let rowPos = tableInfo.start;
  for (let i = 0; i < rect.top; i++) {
    rowPos += tableInfo.node.child(i).nodeSize;
  }
  const rowNode = state.doc.nodeAt(rowPos);
  if (!rowNode || rowNode.type.name !== 'tableRow') return false;

  return editor
    .chain()
    .focus()
    .command(({ tr, dispatch }) => {
      if (dispatch) {
        tr.setNodeMarkup(rowPos, undefined, {
          ...rowNode.attrs,
          rowHeight: height,
        });
      }
      return true;
    })
    .run();
}

export function setTableDisplayWidth(editor: Editor, width: string | null): boolean {
  const tableInfo = findTable(editor.state.selection.$from);
  if (!tableInfo) return false;
  return editor
    .chain()
    .focus()
    .command(({ tr, dispatch }) => {
      if (dispatch) {
        tr.setNodeMarkup(tableInfo.pos, undefined, {
          ...tableInfo.node.attrs,
          displayWidth: width,
        });
      }
      return true;
    })
    .run();
}

export function getTableDisplayWidth(editor: Editor): string | null {
  const tableInfo = findTable(editor.state.selection.$from);
  if (!tableInfo) return null;
  const width = tableInfo.node.attrs['displayWidth'];
  return typeof width === 'string' ? width : null;
}

export function setTableBorderStyle(
  editor: Editor,
  borderStyle: PixelEditorTableBorderStyle,
): boolean {
  const tableInfo = findTable(editor.state.selection.$from);
  if (!tableInfo) return false;
  return editor
    .chain()
    .focus()
    .command(({ tr, dispatch }) => {
      if (dispatch) {
        tr.setNodeMarkup(tableInfo.pos, undefined, {
          ...tableInfo.node.attrs,
          borderStyle,
        });
      }
      return true;
    })
    .run();
}

export function getTableBorderStyle(editor: Editor): PixelEditorTableBorderStyle {
  const tableInfo = findTable(editor.state.selection.$from);
  const style = tableInfo?.node.attrs['borderStyle'];
  return style === 'solid' || style === 'none' || style === 'dashed' ? style : 'dashed';
}

/** Persist header fill color on the table node. */
export function setTableHeaderColor(editor: Editor, color: string | null): boolean {
  const tableInfo = findTable(editor.state.selection.$from);
  if (!tableInfo) return false;

  return editor
    .chain()
    .focus()
    .command(({ tr, dispatch }) => {
      if (dispatch) {
        tr.setNodeMarkup(tableInfo.pos, undefined, {
          ...tableInfo.node.attrs,
          headerColor: color,
        });
      }
      return true;
    })
    .run();
}

export function getTableHeaderColor(editor: Editor): string | null {
  const tableInfo = findTable(editor.state.selection.$from);
  if (!tableInfo) return null;
  const color = tableInfo.node.attrs['headerColor'];
  return typeof color === 'string' ? color : null;
}

export function setTableCellBackground(editor: Editor, color: string | null): boolean {
  return (
    editor.chain().focus().setCellAttribute('backgroundColor', color).run()
  );
}

export function setTableCellAlign(editor: Editor, align: PixelEditorTableCellAlign): boolean {
  return editor.chain().focus().setCellAttribute('align', align).run();
}

/**
 * Insert a table and seed Default column widths (TipTap colgroup owns table width).
 */
export function insertTableWithDefaults(
  editor: Editor,
  rows = 2,
  cols = 2,
  withHeaderRow = true,
): boolean {
  const ok = editor
    .chain()
    .focus()
    .insertTable({ rows, cols, withHeaderRow })
    .run();
  if (!ok) return false;
  applyAllColumnWidths(editor, PIXEL_EDITOR_DEFAULT_COLUMN_WIDTH_PX);
  return true;
}
