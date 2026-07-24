import { Extension, type Editor } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export type PixelEditorFindMatch = { readonly from: number; readonly to: number };

export type PixelEditorFindOptions = {
  readonly matchCase?: boolean;
  readonly matchWholeWord?: boolean;
};

export type PixelEditorFindState = {
  readonly query: string;
  readonly matches: readonly PixelEditorFindMatch[];
  readonly activeIndex: number;
};

export const PixelEditorFindPluginKey = new PluginKey<DecorationSet>('pixelEditorFind');

const FIND_META = 'pixelEditorFindDecorations';

const STYLE_ID = 'pixel-editor-find-styles';

function ensureFindStyles(): void {
  if (typeof document === 'undefined') return;
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = `
.pixel-editor-find-match {
  background: color-mix(in srgb, var(--pixel-sys-warning, #f9a825) 45%, transparent);
  border-radius: 0.1rem;
}
.pixel-editor-find-match--active {
  background: color-mix(in srgb, var(--pixel-sys-primary, #2962ff) 40%, transparent);
  outline: 1px solid var(--pixel-sys-primary, #2962ff);
}
`;
}

function isWordChar(ch: string | undefined): boolean {
  if (!ch) return false;
  return /[0-9A-Za-z\u00C0-\u024F_]/.test(ch);
}

function isWholeWordAt(text: string, index: number, length: number): boolean {
  const before = index > 0 ? text[index - 1] : undefined;
  const after = index + length < text.length ? text[index + length] : undefined;
  return !isWordChar(before) && !isWordChar(after);
}

export function collectFindMatches(
  doc: ProseMirrorNode,
  query: string,
  options: PixelEditorFindOptions = {},
): PixelEditorFindMatch[] {
  const q = query;
  if (!q) return [];
  const matchCase = options.matchCase === true;
  const matchWholeWord = options.matchWholeWord === true;
  const matches: PixelEditorFindMatch[] = [];
  const needle = matchCase ? q : q.toLowerCase();
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    const text = node.text;
    const haystack = matchCase ? text : text.toLowerCase();
    let start = 0;
    while (start < haystack.length) {
      const idx = haystack.indexOf(needle, start);
      if (idx === -1) break;
      if (!matchWholeWord || isWholeWordAt(text, idx, q.length)) {
        matches.push({ from: pos + idx, to: pos + idx + q.length });
      }
      start = idx + Math.max(q.length, 1);
    }
  });
  return matches;
}

export function buildFindDecorations(
  doc: ProseMirrorNode,
  matches: readonly PixelEditorFindMatch[],
  activeIndex: number,
): DecorationSet {
  ensureFindStyles();
  if (matches.length === 0) return DecorationSet.empty;
  const decos = matches.map((m, i) =>
    Decoration.inline(m.from, m.to, {
      class:
        i === activeIndex
          ? 'pixel-editor-find-match pixel-editor-find-match--active'
          : 'pixel-editor-find-match',
    }),
  );
  return DecorationSet.create(doc, decos);
}

/**
 * Decorations-only extension for find highlights. Engine dispatches updates via meta.
 */
export const PixelEditorFindHighlight = Extension.create({
  name: 'pixelEditorFindHighlight',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: PixelEditorFindPluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, old) {
            const meta = tr.getMeta(FIND_META) as DecorationSet | undefined;
            if (meta) return meta;
            if (tr.docChanged) return old.map(tr.mapping, tr.doc);
            return old;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});

export function dispatchFindDecorations(editor: Editor, decorations: DecorationSet): void {
  const tr = editor.state.tr.setMeta(FIND_META, decorations);
  editor.view.dispatch(tr);
}
