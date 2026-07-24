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

/** Placement of the formatting toolbar relative to the canvas. */
export type PixelEditorToolbarPosition = 'top' | 'bottom';

/** Status-bar save indicator. */
export type PixelEditorSaveState = 'idle' | 'saving' | 'saved' | 'error';

/** Block kind shown in the status-bar breadcrumb. */
export type PixelEditorBlockKind =
  | 'paragraph'
  | 'heading'
  | 'list'
  | 'code'
  | 'table'
  | 'panel'
  | 'unknown';

/** Map of `ValidationErrors` keys to user-facing messages (same pattern as `pixel-input`). */
export type PixelEditorValidationMessages = {
  readonly required?: string;
  readonly minlength?: string;
  readonly [key: string]: string | undefined;
};

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
