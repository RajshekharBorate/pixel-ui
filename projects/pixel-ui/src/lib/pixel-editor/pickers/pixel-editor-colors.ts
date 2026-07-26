/**
 * Theme-aware editor ink / highlight swatches.
 *
 * Values are CSS custom properties that resolve under both light and dark Pixel
 * themes. Prefer these over raw hex so saved documents stay readable when the
 * user switches scheme. Legacy hex colors from older docs are remapped in
 * `pixel-editor-content-styles.ts` for dark mode.
 */

export type PixelEditorColorSwatch = {
  readonly label: string;
  /** CSS color value, or `null` to clear the mark. */
  readonly value: string | null;
};

export const PIXEL_EDITOR_TEXT_COLORS: readonly PixelEditorColorSwatch[] = [
  { label: 'Default', value: null },
  { label: 'On surface', value: 'var(--pixel-editor-ink-on-surface)' },
  { label: 'Primary', value: 'var(--pixel-editor-ink-primary)' },
  { label: 'Info', value: 'var(--pixel-editor-ink-info)' },
  { label: 'Success', value: 'var(--pixel-editor-ink-success)' },
  { label: 'Warning', value: 'var(--pixel-editor-ink-warning)' },
  { label: 'Error', value: 'var(--pixel-editor-ink-error)' },
  { label: 'Teal', value: 'var(--pixel-editor-ink-teal)' },
  { label: 'Purple', value: 'var(--pixel-editor-ink-purple)' },
  { label: 'Pink', value: 'var(--pixel-editor-ink-pink)' },
  { label: 'Orange', value: 'var(--pixel-editor-ink-orange)' },
  { label: 'Brown', value: 'var(--pixel-editor-ink-brown)' },
  { label: 'Muted', value: 'var(--pixel-editor-ink-muted)' },
];

export const PIXEL_EDITOR_HIGHLIGHT_COLORS: readonly PixelEditorColorSwatch[] = [
  { label: 'None', value: null },
  { label: 'Yellow', value: 'var(--pixel-editor-mark-yellow)' },
  { label: 'Green', value: 'var(--pixel-editor-mark-green)' },
  { label: 'Cyan', value: 'var(--pixel-editor-mark-cyan)' },
  { label: 'Blue', value: 'var(--pixel-editor-mark-blue)' },
  { label: 'Purple', value: 'var(--pixel-editor-mark-purple)' },
  { label: 'Pink', value: 'var(--pixel-editor-mark-pink)' },
  { label: 'Orange', value: 'var(--pixel-editor-mark-orange)' },
  { label: 'Red', value: 'var(--pixel-editor-mark-red)' },
  { label: 'Gray', value: 'var(--pixel-editor-mark-gray)' },
];

/** CSS custom-property block shared by the editor surface and color pickers. */
export const PIXEL_EDITOR_COLOR_TOKENS_CSS = `
  --pixel-editor-ink-on-surface: var(--pixel-sys-on-surface, #1a1b1f);
  --pixel-editor-ink-primary: var(--pixel-sys-primary, #2962ff);
  --pixel-editor-ink-info: var(--pixel-sys-info, #0288d1);
  --pixel-editor-ink-success: var(--pixel-sys-success, #2e7d32);
  --pixel-editor-ink-warning: var(--pixel-sys-warning, #ed6c02);
  --pixel-editor-ink-error: var(--pixel-sys-error, #b3261e);
  --pixel-editor-ink-muted: var(--pixel-sys-outline, #74777f);
  --pixel-editor-ink-teal: #00897b;
  --pixel-editor-ink-purple: #7b1fa2;
  --pixel-editor-ink-pink: #c2185b;
  --pixel-editor-ink-orange: #ef6c00;
  --pixel-editor-ink-brown: #6d4c41;

  --pixel-editor-mark-yellow: var(--pixel-sys-warning-container, #fff59d);
  --pixel-editor-mark-green: var(--pixel-sys-success-container, #c8e6c9);
  --pixel-editor-mark-cyan: var(--pixel-sys-info-container, #b2ebf2);
  --pixel-editor-mark-blue: var(--pixel-sys-secondary-container, #bbdefb);
  --pixel-editor-mark-purple: #e1bee7;
  --pixel-editor-mark-pink: #f8bbd0;
  --pixel-editor-mark-orange: #ffe0b2;
  --pixel-editor-mark-red: var(--pixel-sys-error-container, #ffcdd2);
  --pixel-editor-mark-gray: var(--pixel-sys-surface-container, #e8e8e8);
  --pixel-editor-mark-ink: var(--pixel-sys-on-surface, #1a1b1f);

  --pixel-editor-link: var(--pixel-sys-primary, #2962ff);
  --pixel-editor-link-visited: color-mix(in srgb, var(--pixel-sys-primary, #2962ff) 78%, var(--pixel-sys-on-surface, #1a1b1f));
`;

/** Dark-scheme overrides for hues that are not system tokens. */
export const PIXEL_EDITOR_COLOR_TOKENS_DARK_CSS = `
  --pixel-editor-ink-teal: #4db6a5;
  --pixel-editor-ink-purple: #ce93d8;
  --pixel-editor-ink-pink: #f48fb1;
  --pixel-editor-ink-orange: #ffb74d;
  --pixel-editor-ink-brown: #bcaaa4;

  --pixel-editor-mark-purple: #4a148c;
  --pixel-editor-mark-pink: #880e4f;
  --pixel-editor-mark-orange: #e65100;
  --pixel-editor-mark-ink: var(--pixel-sys-on-surface, #e2e8f3);
`;

/**
 * Remap pre-token hex colors (light-theme palette) so older documents remain
 * readable under dark scheme. Selectors match TipTap inline `style` attributes.
 */
export function buildLegacyColorRemapCss(scope: string): string {
  const ink: ReadonlyArray<readonly [string, string]> = [
    ['#1a1b1f', 'var(--pixel-editor-ink-on-surface)'],
    ['#5b5b7a', 'var(--pixel-editor-ink-muted)'],
    ['#8b8d98', 'var(--pixel-editor-ink-muted)'],
    ['#2962ff', 'var(--pixel-editor-ink-primary)'],
    ['#1a73e8', 'var(--pixel-editor-ink-info)'],
    ['#0d9488', 'var(--pixel-editor-ink-teal)'],
    ['#0891b2', 'var(--pixel-editor-ink-info)'],
    ['#146c2e', 'var(--pixel-editor-ink-success)'],
    ['#4d7c0f', 'var(--pixel-editor-ink-success)'],
    ['#b54708', 'var(--pixel-editor-ink-warning)'],
    ['#c2410c', 'var(--pixel-editor-ink-orange)'],
    ['#ef6c00', 'var(--pixel-editor-ink-orange)'],
    ['#b3261e', 'var(--pixel-editor-ink-error)'],
    ['#c2185b', 'var(--pixel-editor-ink-pink)'],
    ['#7b1fa2', 'var(--pixel-editor-ink-purple)'],
    ['#6d4c41', 'var(--pixel-editor-ink-brown)'],
    ['#00897b', 'var(--pixel-editor-ink-teal)'],
  ];

  const marks: ReadonlyArray<readonly [string, string]> = [
    ['#fff59d', 'var(--pixel-editor-mark-yellow)'],
    ['#e6ee9c', 'var(--pixel-editor-mark-green)'],
    ['#c8e6c9', 'var(--pixel-editor-mark-green)'],
    ['#b2dfdb', 'var(--pixel-editor-mark-cyan)'],
    ['#b2ebf2', 'var(--pixel-editor-mark-cyan)'],
    ['#bbdefb', 'var(--pixel-editor-mark-blue)'],
    ['#c5cae9', 'var(--pixel-editor-mark-purple)'],
    ['#e1bee7', 'var(--pixel-editor-mark-purple)'],
    ['#f8bbd0', 'var(--pixel-editor-mark-pink)'],
    ['#ffcdd2', 'var(--pixel-editor-mark-red)'],
    ['#ffe0b2', 'var(--pixel-editor-mark-orange)'],
    ['#e0e0e0', 'var(--pixel-editor-mark-gray)'],
    ['#e8e8e8', 'var(--pixel-editor-mark-gray)'],
  ];

  const dark = `:is([data-color-scheme='dark'], [data-theme='enterprise-dark']) ${scope}`;
  const lines: string[] = [];

  for (const [hex, token] of ink) {
    const lower = hex.toLowerCase();
    lines.push(
      `${dark} [style*="color: ${lower}"], ${dark} [style*="color:${lower}"], ` +
        `${dark} [style*="color: ${hex}"], ${dark} [style*="color:${hex}"] { color: ${token} !important; }`,
    );
  }

  for (const [hex, token] of marks) {
    const lower = hex.toLowerCase();
    lines.push(
      `${dark} [style*="background-color: ${lower}"], ${dark} [style*="background-color:${lower}"], ` +
        `${dark} [style*="background-color: ${hex}"], ${dark} [style*="background-color:${hex}"], ` +
        `${dark} [style*="background: ${lower}"], ${dark} [style*="background:${lower}"] { ` +
        `background-color: ${token} !important; color: var(--pixel-editor-mark-ink) !important; }`,
    );
  }

  return lines.join('\n');
}
