/** Curated text colors (hex) for the color picker — token-aligned primaries + neutrals. */
export const PIXEL_EDITOR_TEXT_COLORS: readonly { readonly label: string; readonly value: string | null }[] = [
  { label: 'Default', value: null },
  { label: 'Primary', value: '#2962ff' },
  { label: 'On surface', value: '#1a1b1f' },
  { label: 'Secondary', value: '#5b5b7a' },
  { label: 'Success', value: '#146c2e' },
  { label: 'Warning', value: '#b54708' },
  { label: 'Error', value: '#b3261e' },
  { label: 'Info', value: '#1a73e8' },
];

/** Highlight / background swatches. */
export const PIXEL_EDITOR_HIGHLIGHT_COLORS: readonly { readonly label: string; readonly value: string | null }[] = [
  { label: 'None', value: null },
  { label: 'Yellow', value: '#fff59d' },
  { label: 'Green', value: '#c8e6c9' },
  { label: 'Blue', value: '#bbdefb' },
  { label: 'Pink', value: '#f8bbd0' },
  { label: 'Orange', value: '#ffe0b2' },
  { label: 'Purple', value: '#e1bee7' },
];

export type PixelEditorImageRequest = {
  readonly file?: File;
  readonly src?: string;
  readonly alt?: string;
  readonly source: 'upload' | 'url';
};
