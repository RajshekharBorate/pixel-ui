/**
 * Public surface for `pixel-ui/editor` (secondary entry).
 * Keep TipTap-backed symbols here — not on the main `pixel-ui` barrel.
 */

export { default as PixelEditorComponent } from './pixel-editor';
export { default as PixelEditorToolbarComponent } from './pixel-editor-toolbar';
export { default as PixelEditorStatusBarComponent } from './pixel-editor-status-bar';
export type {
  PixelEditorBlockKind,
  PixelEditorDoc,
  PixelEditorSaveState,
  PixelEditorSize,
  PixelEditorToolbarConfig,
} from './pixel-editor.types';
export type {
  PixelEditorInsertAction,
} from './pixel-editor-toolbar';
export type {
  PixelEditorPanelVariant,
  PixelEditorTextAlign,
  PixelEditorTextStyle,
} from './pixel-editor.service';
export type {
  PixelEditorImageRequest,
} from './pickers/pixel-editor-picker.types';
export type {
  PixelEditorMentionItem,
  PixelEditorMentionQuery,
} from './pickers/pixel-editor-insert-data';
export { PIXEL_EDITOR_EMOJI, PIXEL_EDITOR_SPECIAL_CHARS } from './pickers/pixel-editor-insert-data';
export { PixelEditorPanel } from './extensions/pixel-editor-panel';
export { PixelEditorDateChip } from './extensions/pixel-editor-date-chip';
export { PIXEL_EDITOR_CODE_LANGUAGES } from './extensions/pixel-editor-lowlight';
export { PixelEditorPasteSanitize, sanitizePastedHtml } from './extensions/pixel-editor-paste-sanitize';
export { collectEditorText, isEditorDocEmpty } from './pixel-editor-doc.util';
