import { Table, TableView } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import type { Editor } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
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
  { id: 'compact', label: 'Compact', value: '2rem' },
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

function applyDisplayWidth(table: HTMLTableElement, node: ProseMirrorNode): void {
  const width = node.attrs['displayWidth'] as string | null;
  if (width) {
    table.style.width = width;
    table.style.maxWidth = '100%';
  }
}

/** Live table NodeView: header color, table width handle, row height handles. */
class PixelEditorTableView extends TableView {
  private readonly editorView: EditorView | undefined;
  private readonly widthHandle: HTMLDivElement;
  private readonly rowHandleLayer: HTMLDivElement;
  private dragCleanup: (() => void) | null = null;

  constructor(
    node: ProseMirrorNode,
    cellMinWidth: number,
    view?: EditorView,
    HTMLAttributes: Record<string, unknown> = {},
  ) {
    super(node, cellMinWidth, view, HTMLAttributes);
    this.editorView = view;
    this.dom.style.position = 'relative';

    this.widthHandle = document.createElement('div');
    this.widthHandle.className = 'pixel-editor-table__table-resize';
    this.widthHandle.title = 'Resize table';
    this.widthHandle.setAttribute('aria-hidden', 'true');
    this.dom.appendChild(this.widthHandle);
    this.widthHandle.addEventListener('pointerdown', this.onTableWidthPointerDown);

    this.rowHandleLayer = document.createElement('div');
    this.rowHandleLayer.className = 'pixel-editor-table__row-handles';
    this.rowHandleLayer.setAttribute('aria-hidden', 'true');
    this.dom.appendChild(this.rowHandleLayer);

    applyHeaderColor(this.table, node);
    applyDisplayWidth(this.table, node);
    this.rebuildRowHandles();
  }

  override update(node: ProseMirrorNode): boolean {
    const ok = super.update(node);
    if (!ok) return false;
    applyHeaderColor(this.table, node);
    applyDisplayWidth(this.table, node);
    this.rebuildRowHandles();
    return true;
  }

  destroy(): void {
    this.dragCleanup?.();
    this.dragCleanup = null;
    this.widthHandle.removeEventListener('pointerdown', this.onTableWidthPointerDown);
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

  private commitTableAttrs(patch: Record<string, unknown>): void {
    const view = this.editorView;
    const pos = this.getTablePos();
    if (!view || pos == null) return;
    const node = view.state.doc.nodeAt(pos);
    if (!node) return;
    view.dispatch(
      view.state.tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        ...patch,
      }),
    );
  }

  private onTableWidthPointerDown = (event: PointerEvent): void => {
    if (!this.editorView || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startWidth = this.table.getBoundingClientRect().width;
    const maxWidth = this.dom.parentElement?.clientWidth ?? startWidth;

    const onMove = (ev: PointerEvent): void => {
      const next = Math.min(maxWidth, Math.max(160, startWidth + (ev.clientX - startX)));
      this.table.style.width = `${Math.round(next)}px`;
      this.table.style.maxWidth = '100%';
    };

    const onUp = (): void => {
      this.dragCleanup?.();
      this.dragCleanup = null;
      const width = Math.round(this.table.getBoundingClientRect().width);
      this.commitTableAttrs({ displayWidth: `${width}px` });
    };

    this.dragCleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  private rebuildRowHandles(): void {
    this.rowHandleLayer.replaceChildren();
    const rows = Array.from(this.table.querySelectorAll(':scope > tbody > tr'));
    rows.forEach((row, index) => {
      const handle = document.createElement('div');
      handle.className = 'pixel-editor-table__row-resize';
      handle.title = 'Resize row';
      handle.dataset['rowIndex'] = String(index);
      const place = (): void => {
        const tableRect = this.table.getBoundingClientRect();
        const rowRect = row.getBoundingClientRect();
        handle.style.top = `${rowRect.bottom - tableRect.top + this.table.offsetTop - 3}px`;
        handle.style.left = '0';
        handle.style.width = `${this.table.offsetWidth}px`;
      };
      place();
      handle.addEventListener('pointerdown', (event) => this.onRowHeightPointerDown(event, index, row));
      this.rowHandleLayer.appendChild(handle);
    });
  }

  private onRowHeightPointerDown = (
    event: PointerEvent,
    rowIndex: number,
    rowEl: Element,
  ): void => {
    if (!this.editorView || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const startY = event.clientY;
    const startHeight = (rowEl as HTMLElement).getBoundingClientRect().height;

    const onMove = (ev: PointerEvent): void => {
      const next = Math.max(28, startHeight + (ev.clientY - startY));
      (rowEl as HTMLElement).style.height = `${Math.round(next)}px`;
    };

    const onUp = (): void => {
      this.dragCleanup?.();
      this.dragCleanup = null;
      const height = Math.round((rowEl as HTMLElement).getBoundingClientRect().height);
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

    view.dispatch(
      view.state.tr.setNodeMarkup(rowPos, undefined, {
        ...rowNode.attrs,
        rowHeight: height,
      }),
    );
  }
}

/**
 * Table with header fill color + display width (whole-table resize).
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
          return {
            'data-display-width': attributes['displayWidth'] as string,
            style: `width: ${attributes['displayWidth'] as string}; max-width: 100%`,
          };
        },
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const result = this.parent?.({ node, HTMLAttributes });
    const headerColor = node.attrs['headerColor'] as string | null;
    const displayWidth = node.attrs['displayWidth'] as string | null;
    if ((!headerColor && !displayWidth) || !result) {
      return result ?? ['table', HTMLAttributes, 0];
    }

    const inject = (attrs: Record<string, unknown>): Record<string, unknown> => {
      let style = typeof attrs['style'] === 'string' ? attrs['style'] : '';
      const next = { ...attrs };
      if (headerColor) {
        next['data-header-color'] = headerColor;
        const varDecl = `--pixel-editor-table-header-bg: ${headerColor}`;
        style = style ? `${style}; ${varDecl}` : varDecl;
      }
      if (displayWidth) {
        next['data-display-width'] = displayWidth;
        const widthDecl = `width: ${displayWidth}; max-width: 100%`;
        style = style ? `${style}; ${widthDecl}` : widthDecl;
      }
      if (style) next['style'] = style;
      return next;
    };

    if (Array.isArray(result) && result[0] === 'table' && result[1] && typeof result[1] === 'object') {
      return [result[0], inject(result[1] as Record<string, unknown>), ...result.slice(2)];
    }
    if (
      Array.isArray(result) &&
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
      ];
    }
    return result;
  },
}).configure({
  resizable: true,
  handleWidth: 6,
  cellMinWidth: 48,
  lastColumnResizable: true,
  View: PixelEditorTableView,
  HTMLAttributes: { class: 'pixel-editor-table' },
});

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
  if (tr.docChanged) editor.view.dispatch(tr);
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
  if (tr.docChanged) editor.view.dispatch(tr);
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
 * Insert a table and seed Default column widths (+ fit width = cols × default).
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
  setTableDisplayWidth(editor, `${cols * PIXEL_EDITOR_DEFAULT_COLUMN_WIDTH_PX}px`);
  return true;
}
