export type {
  PixelEditorColorSwatch,
} from './pixel-editor-colors';
export {
  PIXEL_EDITOR_TEXT_COLORS,
  PIXEL_EDITOR_HIGHLIGHT_COLORS,
  PIXEL_EDITOR_COLOR_TOKENS_CSS,
  PIXEL_EDITOR_COLOR_TOKENS_DARK_CSS,
  buildLegacyColorRemapCss,
} from './pixel-editor-colors';

export type PixelEditorImageRequest = {
  readonly file?: File;
  readonly src?: string;
  readonly alt?: string;
  readonly source: 'upload' | 'url' | 'crop';
};
