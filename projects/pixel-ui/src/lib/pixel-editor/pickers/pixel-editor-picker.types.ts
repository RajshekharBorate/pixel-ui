/** Curated text colors (hex) for the color picker — Docs/Jira-like set + neutrals. */
export const PIXEL_EDITOR_TEXT_COLORS: readonly { readonly label: string; readonly value: string | null }[] = [
  { label: 'Default', value: null },
  { label: 'On surface', value: '#1a1b1f' },
  { label: 'Secondary', value: '#5b5b7a' },
  { label: 'Muted', value: '#8b8d98' },
  { label: 'Primary', value: '#2962ff' },
  { label: 'Info', value: '#1a73e8' },
  { label: 'Teal', value: '#0d9488' },
  { label: 'Cyan', value: '#0891b2' },
  { label: 'Success', value: '#146c2e' },
  { label: 'Lime', value: '#4d7c0f' },
  { label: 'Warning', value: '#b54708' },
  { label: 'Orange', value: '#c2410c' },
  { label: 'Error', value: '#b3261e' },
  { label: 'Pink', value: '#c2185b' },
  { label: 'Purple', value: '#7b1fa2' },
  { label: 'Brown', value: '#6d4c41' },
];

/** Highlight / background swatches. */
export const PIXEL_EDITOR_HIGHLIGHT_COLORS: readonly { readonly label: string; readonly value: string | null }[] = [
  { label: 'None', value: null },
  { label: 'Yellow', value: '#fff59d' },
  { label: 'Lime', value: '#e6ee9c' },
  { label: 'Green', value: '#c8e6c9' },
  { label: 'Teal', value: '#b2dfdb' },
  { label: 'Cyan', value: '#b2ebf2' },
  { label: 'Blue', value: '#bbdefb' },
  { label: 'Indigo', value: '#c5cae9' },
  { label: 'Purple', value: '#e1bee7' },
  { label: 'Pink', value: '#f8bbd0' },
  { label: 'Red', value: '#ffcdd2' },
  { label: 'Orange', value: '#ffe0b2' },
  { label: 'Gray', value: '#e0e0e0' },
];

export type PixelEditorImageRequest = {
  readonly file?: File;
  readonly src?: string;
  readonly alt?: string;
  readonly source: 'upload' | 'url' | 'crop';
};
