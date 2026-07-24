/**
 * Canonical document value — ProseMirror / TipTap JSON.
 * Compatible with TipTap `JSONContent` (`type: 'doc'`).
 */
export type PixelEditorDoc = {
  type: 'doc';
  content?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

/** Visual density for the editor chrome. */
export type PixelEditorSize = 'sm' | 'md' | 'lg';

/** Status-bar save indicator. */
export type PixelEditorSaveState = 'idle' | 'saving' | 'saved' | 'error';

/** Block kind shown in the status-bar breadcrumb (Phase 6 expands). */
export type PixelEditorBlockKind = 'paragraph' | 'heading' | 'list' | 'code' | 'table' | 'panel' | 'unknown';

/**
 * Declarative toolbar visibility. Omitted keys default to `true` (full UX mock).
 * Phase 2 consumes this fully; Phase 0 uses it to hide groups in the shell.
 */
export type PixelEditorToolbarConfig = {
  readonly textStyle?: boolean;
  readonly marks?: boolean;
  readonly color?: boolean;
  readonly more?: boolean;
  readonly alignment?: boolean;
  readonly lists?: boolean;
  readonly insert?: boolean;
  readonly history?: boolean;
  readonly fullscreen?: boolean;
};
