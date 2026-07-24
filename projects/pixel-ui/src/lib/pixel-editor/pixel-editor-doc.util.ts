import type { PixelEditorDoc } from './pixel-editor.types';

/** Collect plain text from a TipTap/ProseMirror JSON tree. */
export function collectEditorText(node: Record<string, unknown> | PixelEditorDoc | null | undefined): string {
  if (!node) return '';
  const record = node as Record<string, unknown>;
  const chunks: string[] = [];
  if (typeof record['text'] === 'string') {
    chunks.push(record['text']);
  }
  const content = record['content'];
  if (Array.isArray(content)) {
    for (const child of content) {
      if (child && typeof child === 'object') {
        chunks.push(collectEditorText(child as Record<string, unknown>));
      }
    }
  }
  return chunks.join(' ');
}

/** True when the document has no meaningful text (empty paragraphs / blank nodes). */
export function isEditorDocEmpty(doc: PixelEditorDoc | null | undefined): boolean {
  return collectEditorText(doc).trim().length === 0;
}
