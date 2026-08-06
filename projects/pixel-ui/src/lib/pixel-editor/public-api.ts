/**
 * Public surface for `pixel-ui/editor` (secondary entry).
 * Keep TipTap-backed symbols here — not on the main `pixel-ui` barrel.
 */

export { default as PixelEditorComponent } from './pixel-editor';
export { default as PixelEditorToolbarComponent } from './pixel-editor-toolbar';
export { default as PixelEditorStatusBarComponent } from './pixel-editor-status-bar';
export type {
  PixelEditorBlockKind,
  PixelEditorCountMode,
  PixelEditorDoc,
  PixelEditorFontSize,
  PixelEditorSaveState,
  PixelEditorSize,
  PixelEditorToolbarConfig,
  PixelEditorToolbarPosition,
  PixelEditorValidationMessages,
} from './pixel-editor.types';
export type { PixelEditorLabels } from './pixel-editor-labels';
export {
  DEFAULT_PIXEL_EDITOR_LABELS,
  PIXEL_EDITOR_LABEL_KEY_COUNT,
  pixelEditorFormatLabel,
} from './pixel-editor-labels';
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
export { PixelEditorImage } from './extensions/pixel-editor-image';
export type { PixelEditorImageAlign, PixelEditorImageFloat } from './extensions/pixel-editor-image';
export { PixelEditorFigure, PixelEditorCaption } from './extensions/pixel-editor-figure';
export { PIXEL_EDITOR_CODE_LANGUAGES } from './extensions/pixel-editor-lowlight';
export { PixelEditorPasteSanitize, sanitizePastedHtml } from './extensions/pixel-editor-paste-sanitize';
export {
  PixelEditorSlashCommands,
  PIXEL_EDITOR_SLASH_COMMANDS,
  filterSlashCommandItems,
  resolveSlashCommands,
  isSlashAllowed,
} from './extensions/pixel-editor-slash-suggestion';
export type {
  PixelEditorSlashCommandId,
  PixelEditorSlashItem,
  PixelEditorSlashCommandsOptions,
} from './extensions/pixel-editor-slash-suggestion';
export { PixelEditorFindHighlight, collectFindMatches } from './extensions/pixel-editor-find';
export type { PixelEditorFindMatch } from './extensions/pixel-editor-find';
export { collectEditorText, isEditorDocEmpty } from './pixel-editor-doc.util';
export { editorDocToMarkdown } from './pixel-editor-markdown.util';
export { toLocalIsoDate } from './pixel-editor-date.util';
export { cropImageToBlob } from './pixel-editor-image-crop.util';
export {
  PIXEL_EDITOR_TEXT_COLORS,
  PIXEL_EDITOR_HIGHLIGHT_COLORS,
  PIXEL_EDITOR_COLOR_TOKENS_CSS,
  PIXEL_EDITOR_COLOR_TOKENS_DARK_CSS,
  buildLegacyColorRemapCss,
} from './pickers/pixel-editor-colors';
export type { PixelEditorColorSwatch } from './pickers/pixel-editor-colors';
export { default as PixelEditorImageToolbarComponent } from './pixel-editor-image-toolbar';
export { default as PixelEditorTableToolbarComponent } from './pixel-editor-table-toolbar';
export { default as PixelEditorFindBarComponent } from './pixel-editor-find-bar';
export {
  PixelEditorTable,
  PixelEditorTableRow,
  PixelEditorTableCell,
  PixelEditorTableHeader,
  PIXEL_EDITOR_TABLE_COLUMN_WIDTHS,
  PIXEL_EDITOR_TABLE_ROW_HEIGHTS,
  PIXEL_EDITOR_TABLE_WIDTHS,
  PIXEL_EDITOR_TABLE_BORDER_STYLES,
  PIXEL_EDITOR_DEFAULT_COLUMN_WIDTH_PX,
} from './extensions/pixel-editor-table';
export type {
  PixelEditorTableColumnWidthId,
  PixelEditorTableRowHeightId,
  PixelEditorTableWidthId,
  PixelEditorTableBorderStyle,
  PixelEditorTableCellAlign,
} from './extensions/pixel-editor-table';
