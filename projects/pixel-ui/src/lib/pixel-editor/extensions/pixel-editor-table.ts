import { Table, TableView } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import type { Editor } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { EditorView } from '@tiptap/pm/view';
import { cellAround, findTable, TableMap } from '@tiptap/pm/tables';

/** Preset column widths (px) for the floating table toolbar. */
export const PIXEL_EDITOR_TABLE_COLUMN_WIDTHS = [
  { id: 'narrow', label: 'Narrow', value: 80 },
  { id: 'default', label: 'Default', value: 120 },
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

export type PixelEditorTableColumnWidthId =
  (typeof PIXEL_EDITOR_TABLE_COLUMN_WIDTHS)[number]['id'];
export type PixelEditorTableRowHeightId =
  (typeof PIXEL_EDITOR_TABLE_ROW_HEIGHTS)[number]['id'];

/** Applies `headerColor` onto the live TableView DOM (resizable tables skip renderHTML). */
class PixelEditorTableView extends TableView {
  constructor(
    node: ProseMirrorNode,
    cellMinWidth: number,
    view?: EditorView,
    HTMLAttributes: Record<string, unknown> = {},
  ) {
    super(node, cellMinWidth, view, HTMLAttributes);
    this.syncHeaderColor(node);
  }

  override update(node: ProseMirrorNode): boolean {
    const ok = super.update(node);
    if (ok) this.syncHeaderColor(node);
    return ok;
  }

  private syncHeaderColor(node: ProseMirrorNode): void {
    const color = node.attrs['headerColor'] as string | null;
    if (color) {
      this.table.setAttribute('data-header-color', color);
      this.table.style.setProperty('--pixel-editor-table-header-bg', color);
    } else {
      this.table.removeAttribute('data-header-color');
      this.table.style.removeProperty('--pixel-editor-table-header-bg');
    }
  }
}

/**
 * Table with optional header fill color (CSS variable on the table element).
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
          return {
            'data-header-color': attributes['headerColor'] as string,
          };
        },
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const result = this.parent?.({ node, HTMLAttributes });
    const headerColor = node.attrs['headerColor'] as string | null;
    if (!headerColor || !result) return result ?? ['table', HTMLAttributes, 0];

    const injectStyle = (attrs: Record<string, unknown>): Record<string, unknown> => {
      const prev = typeof attrs['style'] === 'string' ? attrs['style'] : '';
      const varDecl = `--pixel-editor-table-header-bg: ${headerColor}`;
      return {
        ...attrs,
        'data-header-color': headerColor,
        style: prev ? `${prev}; ${varDecl}` : varDecl,
      };
    };

    if (Array.isArray(result) && result[0] === 'table' && result[1] && typeof result[1] === 'object') {
      return [result[0], injectStyle(result[1] as Record<string, unknown>), ...result.slice(2)];
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
        [tableSpec[0], injectStyle(tableSpec[1] as Record<string, unknown>), ...tableSpec.slice(2)],
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

/**
 * Table row with optional explicit height for toolbar resize presets.
 */
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

export const PixelEditorTableCell = TableCell;
export const PixelEditorTableHeader = TableHeader;

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
