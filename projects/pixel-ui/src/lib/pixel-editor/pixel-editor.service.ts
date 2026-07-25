import { Injectable, signal } from '@angular/core';
import type { Editor, JSONContent } from '@tiptap/core';
import type { PixelEditorPanelVariant } from './extensions/pixel-editor-panel';
import {
  applyImageCaptionWrap,
  resolveImagePosForCaption,
} from './extensions/pixel-editor-figure';
import {
  buildFindDecorations,
  collectFindMatches,
  dispatchFindDecorations,
  type PixelEditorFindMatch,
  type PixelEditorFindOptions,
} from './extensions/pixel-editor-find';
import {
  applyAllColumnWidths,
  equalizeTableColumns,
  getTableBorderStyle,
  getTableDisplayWidth,
  getTableHeaderColor,
  insertTableWithDefaults,
  setTableBorderStyle,
  setTableCellAlign,
  setTableCellBackground,
  setTableColumnWidth,
  setTableDisplayWidth,
  setTableHeaderColor,
  setTableRowHeight,
  type PixelEditorTableBorderStyle,
  type PixelEditorTableCellAlign,
} from './extensions/pixel-editor-table';
import type { PixelEditorDoc } from './pixel-editor.types';

export type PixelEditorTextStyle = 'paragraph' | 'heading1' | 'heading2' | 'heading3';
export type PixelEditorTextAlign = 'left' | 'center' | 'right' | 'justify';
export type { PixelEditorPanelVariant, PixelEditorTableBorderStyle, PixelEditorTableCellAlign };

/**
 * Thin TipTap facade provided on `pixel-editor`. Toolbar / pickers inject this
 * to run commands without holding the Editor instance themselves.
 */
@Injectable()
export class PixelEditorEngine {
  private readonly _editor = signal<Editor | null>(null);

  /** Live TipTap instance (null before mount / after destroy). */
  readonly editor = this._editor.asReadonly();

  /** Bumps when selection or doc changes so chrome can re-read `isActive`. */
  readonly version = signal(0);

  attach(editor: Editor): void {
    this._editor.set(editor);
    this.version.update((v) => v + 1);
  }

  detach(): void {
    this._editor.set(null);
  }

  bump(): void {
    this.version.update((v) => v + 1);
  }

  getJSON(): PixelEditorDoc {
    const json = this._editor()?.getJSON() as JSONContent | undefined;
    if (!json || json.type !== 'doc') {
      return { type: 'doc', content: [] };
    }
    return json as PixelEditorDoc;
  }

  getHTML(): string {
    return this._editor()?.getHTML() ?? '';
  }

  setContent(doc: PixelEditorDoc | null, emitUpdate = false): void {
    const editor = this._editor();
    if (!editor) return;
    const content = (doc ?? { type: 'doc', content: [{ type: 'paragraph' }] }) as Parameters<
      Editor['commands']['setContent']
    >[0];
    editor.commands.setContent(content, { emitUpdate });
  }

  setEditable(editable: boolean): void {
    this._editor()?.setEditable(editable);
  }

  focus(): void {
    this._editor()?.commands.focus();
  }

  undo(): boolean {
    return this._editor()?.chain().focus().undo().run() ?? false;
  }

  redo(): boolean {
    return this._editor()?.chain().focus().redo().run() ?? false;
  }

  toggleBold(): boolean {
    return this._editor()?.chain().focus().toggleBold().run() ?? false;
  }

  toggleItalic(): boolean {
    return this._editor()?.chain().focus().toggleItalic().run() ?? false;
  }

  toggleUnderline(): boolean {
    return this._editor()?.chain().focus().toggleUnderline().run() ?? false;
  }

  toggleStrike(): boolean {
    return this._editor()?.chain().focus().toggleStrike().run() ?? false;
  }

  toggleCode(): boolean {
    return this._editor()?.chain().focus().toggleCode().run() ?? false;
  }

  clearFormatting(): boolean {
    return this._editor()?.chain().focus().unsetAllMarks().clearNodes().run() ?? false;
  }

  setFontSize(size: string | null): boolean {
    const editor = this._editor();
    if (!editor) return false;
    if (!size) {
      return editor.chain().focus().unsetFontSize().run();
    }
    return editor.chain().focus().setFontSize(size).run();
  }

  activeFontSize(): string | null {
    const editor = this._editor();
    if (!editor) return null;
    const attrs = editor.getAttributes('textStyle') as { fontSize?: string | null };
    return attrs.fontSize ?? null;
  }

  toggleBulletList(): boolean {
    return this._editor()?.chain().focus().toggleBulletList().run() ?? false;
  }

  toggleOrderedList(): boolean {
    return this._editor()?.chain().focus().toggleOrderedList().run() ?? false;
  }

  toggleTaskList(): boolean {
    return this._editor()?.chain().focus().toggleTaskList().run() ?? false;
  }

  toggleBlockquote(): boolean {
    return this._editor()?.chain().focus().toggleBlockquote().run() ?? false;
  }

  toggleCodeBlock(): boolean {
    return this._editor()?.chain().focus().toggleCodeBlock().run() ?? false;
  }

  /** Insert or convert to a code block, optionally setting a language for lowlight. */
  insertCodeBlock(language = ''): boolean {
    const editor = this._editor();
    if (!editor) return false;
    const chain = editor.chain().focus();
    if (language) {
      return chain.toggleCodeBlock({ language }).run();
    }
    return chain.toggleCodeBlock().run();
  }

  setCodeBlockLanguage(language: string): boolean {
    return (
      this._editor()
        ?.chain()
        .focus()
        .updateAttributes('codeBlock', { language: language || null })
        .run() ?? false
    );
  }

  insertTable(rows = 2, cols = 2, withHeaderRow = true): boolean {
    const editor = this._editor();
    if (!editor) return false;
    return insertTableWithDefaults(editor, rows, cols, withHeaderRow);
  }

  addRowAfter(): boolean {
    return this._editor()?.chain().focus().addRowAfter().run() ?? false;
  }

  addRowBefore(): boolean {
    return this._editor()?.chain().focus().addRowBefore().run() ?? false;
  }

  addColumnAfter(): boolean {
    return this._editor()?.chain().focus().addColumnAfter().run() ?? false;
  }

  addColumnBefore(): boolean {
    return this._editor()?.chain().focus().addColumnBefore().run() ?? false;
  }

  deleteRow(): boolean {
    return this._editor()?.chain().focus().deleteRow().run() ?? false;
  }

  deleteColumn(): boolean {
    return this._editor()?.chain().focus().deleteColumn().run() ?? false;
  }

  deleteTable(): boolean {
    return this._editor()?.chain().focus().deleteTable().run() ?? false;
  }

  toggleHeaderRow(): boolean {
    return this._editor()?.chain().focus().toggleHeaderRow().run() ?? false;
  }

  toggleHeaderColumn(): boolean {
    return this._editor()?.chain().focus().toggleHeaderColumn().run() ?? false;
  }

  mergeCells(): boolean {
    return this._editor()?.chain().focus().mergeCells().run() ?? false;
  }

  splitCell(): boolean {
    return this._editor()?.chain().focus().splitCell().run() ?? false;
  }

  setTableHeaderColor(color: string | null): boolean {
    const editor = this._editor();
    if (!editor) return false;
    return setTableHeaderColor(editor, color);
  }

  getTableHeaderColor(): string | null {
    const editor = this._editor();
    if (!editor) return null;
    return getTableHeaderColor(editor);
  }

  setTableColumnWidth(widthPx: number | null): boolean {
    const editor = this._editor();
    if (!editor) return false;
    return setTableColumnWidth(editor, widthPx);
  }

  applyAllColumnWidths(widthPx: number): boolean {
    const editor = this._editor();
    if (!editor) return false;
    return applyAllColumnWidths(editor, widthPx);
  }

  equalizeTableColumns(): boolean {
    const editor = this._editor();
    if (!editor) return false;
    return equalizeTableColumns(editor);
  }

  setTableRowHeight(height: string | null): boolean {
    const editor = this._editor();
    if (!editor) return false;
    return setTableRowHeight(editor, height);
  }

  setTableDisplayWidth(width: string | null): boolean {
    const editor = this._editor();
    if (!editor) return false;
    return setTableDisplayWidth(editor, width);
  }

  getTableDisplayWidth(): string | null {
    const editor = this._editor();
    if (!editor) return null;
    return getTableDisplayWidth(editor);
  }

  setTableBorderStyle(borderStyle: PixelEditorTableBorderStyle): boolean {
    const editor = this._editor();
    if (!editor) return false;
    return setTableBorderStyle(editor, borderStyle);
  }

  getTableBorderStyle(): PixelEditorTableBorderStyle {
    const editor = this._editor();
    if (!editor) return 'solid';
    return getTableBorderStyle(editor);
  }

  setTableCellBackground(color: string | null): boolean {
    const editor = this._editor();
    if (!editor) return false;
    return setTableCellBackground(editor, color);
  }

  setTableCellAlign(align: PixelEditorTableCellAlign): boolean {
    const editor = this._editor();
    if (!editor) return false;
    return setTableCellAlign(editor, align);
  }

  setHorizontalRule(): boolean {
    return this._editor()?.chain().focus().setHorizontalRule().run() ?? false;
  }

  setParagraph(): boolean {
    return this._editor()?.chain().focus().setParagraph().run() ?? false;
  }

  setHeading(level: 1 | 2 | 3): boolean {
    return this._editor()?.chain().focus().setHeading({ level }).run() ?? false;
  }

  setTextStyle(style: PixelEditorTextStyle): boolean {
    switch (style) {
      case 'heading1':
        return this.setHeading(1);
      case 'heading2':
        return this.setHeading(2);
      case 'heading3':
        return this.setHeading(3);
      default:
        return this.setParagraph();
    }
  }

  setTextAlign(align: PixelEditorTextAlign): boolean {
    return this._editor()?.chain().focus().setTextAlign(align).run() ?? false;
  }

  insertPanel(variant: PixelEditorPanelVariant = 'info'): boolean {
    return this._editor()?.chain().focus().setPanel(variant).run() ?? false;
  }

  updatePanelVariant(variant: PixelEditorPanelVariant): boolean {
    return this._editor()?.chain().focus().updatePanelVariant(variant).run() ?? false;
  }

  setColor(color: string | null): boolean {
    const editor = this._editor();
    if (!editor) return false;
    if (!color) {
      return editor.chain().focus().unsetColor().run();
    }
    return editor.chain().focus().setColor(color).run();
  }

  setHighlight(color: string | null): boolean {
    const editor = this._editor();
    if (!editor) return false;
    if (!color) {
      return editor.chain().focus().unsetHighlight().run();
    }
    return editor.chain().focus().toggleHighlight({ color }).run();
  }

  setImage(
    src: string,
    alt = '',
    opts?: {
      align?: 'start' | 'center' | 'end';
      displayWidth?: string | null;
      float?: 'none' | 'start' | 'end';
    },
  ): boolean {
    if (!src.trim()) return false;
    return (
      this._editor()
        ?.chain()
        .focus()
        .insertContent({
          type: 'image',
          attrs: {
            src: src.trim(),
            alt: alt.trim() || null,
            align: opts?.align ?? 'start',
            displayWidth: opts?.displayWidth ?? null,
            float: opts?.float ?? 'none',
          },
        })
        .run() ?? false
    );
  }

  private lastImagePos: number | null = null;

  /** Remember last selected image position (toolbar clicks clear NodeSelection). */
  rememberImageSelection(pos: number | null): void {
    this.lastImagePos = pos;
  }

  updateImageAttrs(attrs: {
    align?: 'start' | 'center' | 'end' | null;
    displayWidth?: string | null;
    float?: 'none' | 'start' | 'end' | null;
    alt?: string | null;
    src?: string | null;
  }): boolean {
    const editor = this._editor();
    if (!editor) return false;
    const { state } = editor;
    let pos: number | null = null;
    const sel = state.selection as { node?: { type: { name: string } }; from: number };
    if (sel.node?.type.name === 'image') {
      pos = sel.from;
    } else if (this.lastImagePos != null) {
      pos = this.lastImagePos;
    }
    if (pos == null) {
      return editor.chain().setImageAttrs(attrs).run();
    }
    const node = state.doc.nodeAt(pos);
    if (!node || node.type.name !== 'image') {
      return editor.chain().setImageAttrs(attrs).run();
    }
    const tr = state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrs });
    editor.view.dispatch(tr);
    this.lastImagePos = pos;
    try {
      editor.commands.setNodeSelection(pos);
    } catch {
      // Selection may be invalid mid-update; attrs still applied.
    }
    return true;
  }

  removeImage(): boolean {
    const editor = this._editor();
    if (!editor) return false;
    if (this.lastImagePos != null) {
      const node = editor.state.doc.nodeAt(this.lastImagePos);
      if (node?.type.name === 'image') {
        // Delete surrounding figure when captioned.
        const $pos = editor.state.doc.resolve(this.lastImagePos);
        for (let depth = $pos.depth; depth > 0; depth--) {
          if ($pos.node(depth).type.name === 'figure') {
            const from = $pos.before(depth);
            const figure = $pos.node(depth);
            return (
              editor
                .chain()
                .focus()
                .deleteRange({ from, to: from + figure.nodeSize })
                .run() ?? false
            );
          }
        }
        return (
          editor
            .chain()
            .focus()
            .deleteRange({ from: this.lastImagePos, to: this.lastImagePos + node.nodeSize })
            .run() ?? false
        );
      }
    }
    return editor.chain().focus().deleteSelection().run();
  }

  addImageCaption(): boolean {
    const editor = this._editor();
    if (!editor) return false;
    const { state } = editor;
    const imagePos = resolveImagePosForCaption(state, this.lastImagePos);
    if (imagePos == null) return false;
    this.lastImagePos = imagePos;
    const ok = applyImageCaptionWrap(state, imagePos, (tr) => {
      editor.view.dispatch(tr);
    });
    if (!ok) return false;
    // After wrap, figure occupies `imagePos`; image is child 0, caption is child 1.
    const figureNode = editor.state.doc.nodeAt(imagePos);
    if (figureNode?.type.name === 'figure' && figureNode.childCount > 1) {
      const captionPos = imagePos + 1 + figureNode.child(0).nodeSize + 1;
      this.lastImagePos = imagePos + 1;
      try {
        editor.chain().setTextSelection(captionPos).focus().run();
      } catch {
        // Caption focus is best-effort.
      }
    }
    return true;
  }

  removeImageCaption(): boolean {
    const editor = this._editor();
    if (!editor) return false;
    const imagePos = resolveImagePosForCaption(editor.state, this.lastImagePos);
    if (imagePos == null) return false;
    try {
      editor.commands.setNodeSelection(imagePos);
    } catch {
      // Ignore selection restore failures.
    }
    return editor.chain().removeImageCaption().run();
  }

  getImageAttrs(): {
    src: string;
    alt: string;
    align: string;
    displayWidth: string | null;
    float: string;
  } | null {
    const editor = this._editor();
    if (!editor?.isActive('image') && !editor?.isActive('figure')) return null;
    const attrs = editor.getAttributes('image') as {
      src?: string;
      alt?: string;
      align?: string;
      displayWidth?: string | null;
      float?: string;
    };
    if (!attrs.src) return null;
    return {
      src: attrs.src,
      alt: attrs.alt ?? '',
      align: attrs.align ?? 'start',
      displayWidth: attrs.displayWidth ?? null,
      float: attrs.float ?? 'none',
    };
  }

  getLinkHref(): string {
    const editor = this._editor();
    if (!editor) return '';
    const attrs = editor.getAttributes('link') as { href?: string };
    return attrs.href ?? '';
  }

  /** Best-effort link set (Phase 4 popover also uses this). */
  setLink(href: string): boolean {
    if (!href.trim()) {
      return this._editor()?.chain().focus().unsetLink().run() ?? false;
    }
    return (
      this._editor()
        ?.chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: href.trim() })
        .run() ?? false
    );
  }

  unsetLink(): boolean {
    return this._editor()?.chain().focus().unsetLink().run() ?? false;
  }

  insertText(text: string): boolean {
    if (!text) return false;
    return this._editor()?.chain().focus().insertContent(text).run() ?? false;
  }

  insertMention(id: string, label: string): boolean {
    return (
      this._editor()
        ?.chain()
        .focus()
        .insertContent({
          type: 'mention',
          attrs: { id, label },
        })
        .insertContent(' ')
        .run() ?? false
    );
  }

  insertDateChip(isoDate: string): boolean {
    if (!isoDate.trim()) return false;
    return this._editor()?.chain().focus().insertDateChip(isoDate.trim()).run() ?? false;
  }

  isActive(name: string, attrs?: Record<string, unknown>): boolean {
    return this._editor()?.isActive(name, attrs) ?? false;
  }

  /** Status-bar breadcrumb from the current selection. */
  activeBlockKind(): import('./pixel-editor.types').PixelEditorBlockKind {
    this.version();
    const editor = this._editor();
    if (!editor) return 'paragraph';
    if (editor.isActive('codeBlock')) return 'code';
    if (editor.isActive('table')) return 'table';
    if (editor.isActive('panel')) return 'panel';
    if (editor.isActive('heading')) return 'heading';
    if (
      editor.isActive('bulletList') ||
      editor.isActive('orderedList') ||
      editor.isActive('taskList')
    ) {
      return 'list';
    }
    return 'paragraph';
  }

  activeTextStyle(): PixelEditorTextStyle {
    this.version();
    if (this.isActive('heading', { level: 1 })) return 'heading1';
    if (this.isActive('heading', { level: 2 })) return 'heading2';
    if (this.isActive('heading', { level: 3 })) return 'heading3';
    return 'paragraph';
  }

  activeTextAlign(): PixelEditorTextAlign {
    this.version();
    const editor = this._editor();
    if (!editor) return 'left';
    if (editor.isActive({ textAlign: 'center' })) return 'center';
    if (editor.isActive({ textAlign: 'right' })) return 'right';
    if (editor.isActive({ textAlign: 'justify' })) return 'justify';
    return 'left';
  }

  /**
   * Recompute find decorations for `query`. Returns matches and clamped active index.
   */
  syncFindHighlights(
    query: string,
    activeIndex = 0,
    options: PixelEditorFindOptions = {},
  ): { matches: PixelEditorFindMatch[]; activeIndex: number } {
    const editor = this._editor();
    if (!editor) return { matches: [], activeIndex: 0 };
    const matches = collectFindMatches(editor.state.doc, query.trim(), options);
    const idx =
      matches.length === 0 ? 0 : ((activeIndex % matches.length) + matches.length) % matches.length;
    dispatchFindDecorations(editor, buildFindDecorations(editor.state.doc, matches, idx));
    return { matches, activeIndex: matches.length ? idx : 0 };
  }

  clearFindHighlights(): void {
    const editor = this._editor();
    if (!editor) return;
    dispatchFindDecorations(editor, buildFindDecorations(editor.state.doc, [], 0));
  }

  selectFindMatch(from: number, to: number, options?: { focus?: boolean }): boolean {
    const editor = this._editor();
    if (!editor) return false;
    let chain = editor.chain().setTextSelection({ from, to }).scrollIntoView();
    if (options?.focus !== false) {
      chain = chain.focus();
    }
    return chain.run();
  }

  replaceRange(from: number, to: number, text: string): boolean {
    return (
      this._editor()
        ?.chain()
        .focus()
        .insertContentAt({ from, to }, text)
        .run() ?? false
    );
  }

  replaceAllOccurrences(
    query: string,
    replacement: string,
    options: PixelEditorFindOptions = {},
  ): number {
    const editor = this._editor();
    if (!editor || !query) return 0;
    const matches = collectFindMatches(editor.state.doc, query, options);
    if (matches.length === 0) return 0;
    let chain = editor.chain().focus();
    for (let i = matches.length - 1; i >= 0; i--) {
      const m = matches[i]!;
      chain = chain.insertContentAt({ from: m.from, to: m.to }, replacement);
    }
    chain.run();
    return matches.length;
  }

  canUndo(): boolean {
    return this._editor()?.can().undo() ?? false;
  }

  canRedo(): boolean {
    return this._editor()?.can().redo() ?? false;
  }
}
