import { Extension } from '@tiptap/core';

/**
 * Strip dangerous / non-schema paste artifacts before TipTap parses HTML.
 * Schema still governs what nodes survive; this is a first-pass allowlist-style cleanup.
 */
export function sanitizePastedHtml(html: string): string {
  let clean = html;
  // Scripts / iframes / objects
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  clean = clean.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  clean = clean.replace(/<embed\b[^>]*>/gi, '');
  clean = clean.replace(/<link\b[^>]*>/gi, '');
  clean = clean.replace(/<meta\b[^>]*>/gi, '');
  // Inline event handlers
  clean = clean.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  // javascript: URLs
  clean = clean.replace(
    /\b(href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]*)/gi,
    '$1="#"',
  );
  // Office / Word noise
  clean = clean.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '');
  clean = clean.replace(/<\/?o:[^>]*>/gi, '');
  clean = clean.replace(/<\/?w:[^>]*>/gi, '');
  clean = clean.replace(/<\/?m:[^>]*>/gi, '');
  return clean;
}

/**
 * TipTap extension that applies {@link sanitizePastedHtml} on paste.
 */
export const PixelEditorPasteSanitize = Extension.create({
  name: 'pixelEditorPasteSanitize',
  priority: 110,
  transformPastedHTML(html) {
    return sanitizePastedHtml(html);
  },
});
