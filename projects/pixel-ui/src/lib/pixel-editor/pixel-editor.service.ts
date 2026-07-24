import { Injectable, signal } from '@angular/core';
import type { Editor, JSONContent } from '@tiptap/core';
import type { PixelEditorPanelVariant } from './extensions/pixel-editor-panel';
import {
  buildFindDecorations,
  collectFindMatches,
  dispatchFindDecorations,
  type PixelEditorFindMatch,
} from './extensions/pixel-editor-find';
import type { PixelEditorDoc } from './pixel-editor.types';

export type PixelEditorTextStyle = 'paragraph' | 'heading1' | 'heading2' | 'heading3';
export type PixelEditorTextAlign = 'left' | 'center' | 'right' | 'justify';
export type { PixelEditorPanelVariant };

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

  insertTable(rows = 3, cols = 3, withHeaderRow = true): boolean {
    return (
      this._editor()
        ?.chain()
        .focus()
        .insertTable({ rows, cols, withHeaderRow })
        .run() ?? false
    );
  }

  addRowAfter(): boolean {
    return this._editor()?.chain().focus().addRowAfter().run() ?? false;
  }

  addColumnAfter(): boolean {
    return this._editor()?.chain().focus().addColumnAfter().run() ?? false;
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

  updateImageAttrs(attrs: {
    align?: 'start' | 'center' | 'end' | null;
    displayWidth?: string | null;
    float?: 'none' | 'start' | 'end' | null;
    alt?: string | null;
    src?: string | null;
  }): boolean {
    return this._editor()?.chain().focus().setImageAttrs(attrs).run() ?? false;
  }

  removeImage(): boolean {
    return this._editor()?.chain().focus().removeImage().run() ?? false;
  }

  addImageCaption(): boolean {
    return this._editor()?.chain().focus().addImageCaption().run() ?? false;
  }

  removeImageCaption(): boolean {
    return this._editor()?.chain().focus().removeImageCaption().run() ?? false;
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
  ): { matches: PixelEditorFindMatch[]; activeIndex: number } {
    const editor = this._editor();
    if (!editor) return { matches: [], activeIndex: 0 };
    const matches = collectFindMatches(editor.state.doc, query.trim());
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

  selectFindMatch(from: number, to: number): boolean {
    return (
      this._editor()
        ?.chain()
        .focus()
        .setTextSelection({ from, to })
        .run() ?? false
    );
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

  replaceAllOccurrences(query: string, replacement: string): number {
    const editor = this._editor();
    if (!editor || !query) return 0;
    const matches = collectFindMatches(editor.state.doc, query);
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
