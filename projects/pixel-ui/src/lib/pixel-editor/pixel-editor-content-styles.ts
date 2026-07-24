/**
 * TipTap mutates the editable DOM outside Angular's emulated encapsulation.
 * Inject once into document.head so panel / task / image layout always applies.
 */
const STYLE_ID = 'pixel-editor-content-styles';

export function ensurePixelEditorContentStyles(): void {
  if (typeof document === 'undefined') return;
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = `
.pixel-editor__surface.ProseMirror ul[data-type='taskList'],
.pixel-editor__prose.ProseMirror ul[data-type='taskList'] {
  padding-inline-start: 0 !important;
  list-style: none !important;
}
.pixel-editor__surface.ProseMirror ul[data-type='taskList'] li,
.pixel-editor__prose.ProseMirror ul[data-type='taskList'] li {
  display: flex !important;
  flex-direction: row !important;
  align-items: flex-start !important;
  gap: 0.35rem;
  list-style: none !important;
  overflow: visible !important;
}
.pixel-editor__surface.ProseMirror ul[data-type='taskList'] li::marker,
.pixel-editor__prose.ProseMirror ul[data-type='taskList'] li::marker {
  content: none !important;
}
.pixel-editor__surface.ProseMirror ul[data-type='taskList'] li > label,
.pixel-editor__prose.ProseMirror ul[data-type='taskList'] li > label {
  position: relative;
  display: inline-flex !important;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  min-inline-size: 1.5rem;
  min-block-size: 1.5rem;
  margin-block-start: 0.2em;
  margin-inline: 0;
  padding: 0;
  overflow: visible !important;
  cursor: pointer;
}
.pixel-editor__surface.ProseMirror ul[data-type='taskList'] li > div,
.pixel-editor__prose.ProseMirror ul[data-type='taskList'] li > div {
  flex: 1 1 auto !important;
  min-inline-size: 0 !important;
}
.pixel-editor__surface.ProseMirror ul[data-type='taskList'] li > div > p,
.pixel-editor__prose.ProseMirror ul[data-type='taskList'] li > div > p {
  margin-block: 0.2em;
}
.pixel-editor__surface.ProseMirror ul[data-type='taskList'] input[type='checkbox'],
.pixel-editor__prose.ProseMirror ul[data-type='taskList'] input[type='checkbox'] {
  --pixel-editor-task-check-size: 1.25rem;
  appearance: none;
  display: inline-grid;
  place-content: center;
  inline-size: var(--pixel-editor-task-check-size);
  block-size: var(--pixel-editor-task-check-size);
  margin: 0;
  border: 1.5px solid var(--pixel-sys-outline, #6b7280);
  border-radius: calc(var(--pixel-sys-shape-corner-small, 0.625rem) * 0.55);
  background: var(--pixel-sys-surface, #fdfbff);
  color: var(--pixel-sys-on-primary, #ffffff);
  box-shadow: 0 0 0 0 transparent;
  cursor: pointer;
  transition:
    border-color var(--pixel-sys-motion-duration-short4, 220ms) ease,
    background-color var(--pixel-sys-motion-duration-short4, 220ms) ease,
    box-shadow var(--pixel-sys-motion-duration-short4, 220ms) ease;
}
.pixel-editor__surface.ProseMirror ul[data-type='taskList'] input[type='checkbox']:hover,
.pixel-editor__prose.ProseMirror ul[data-type='taskList'] input[type='checkbox']:hover {
  border-color: var(--pixel-sys-primary, #2962ff);
  background: var(--pixel-sys-surface-container, #e9f0ff);
}
/* Match pixel-checkbox: primary border + focus ring on focus/active (not keyboard-only). */
.pixel-editor__surface.ProseMirror ul[data-type='taskList'] li > label:focus-within input[type='checkbox'],
.pixel-editor__prose.ProseMirror ul[data-type='taskList'] li > label:focus-within input[type='checkbox'],
.pixel-editor__surface.ProseMirror ul[data-type='taskList'] li > label:active input[type='checkbox'],
.pixel-editor__prose.ProseMirror ul[data-type='taskList'] li > label:active input[type='checkbox'],
.pixel-editor__surface.ProseMirror ul[data-type='taskList'] input[type='checkbox']:focus,
.pixel-editor__prose.ProseMirror ul[data-type='taskList'] input[type='checkbox']:focus,
.pixel-editor__surface.ProseMirror ul[data-type='taskList'] input[type='checkbox']:focus-visible,
.pixel-editor__prose.ProseMirror ul[data-type='taskList'] input[type='checkbox']:focus-visible,
.pixel-editor__surface.ProseMirror ul[data-type='taskList'] input[type='checkbox']:active,
.pixel-editor__prose.ProseMirror ul[data-type='taskList'] input[type='checkbox']:active,
.pixel-editor__surface.ProseMirror ul[data-type='taskList'] input[type='checkbox']:checked:focus,
.pixel-editor__prose.ProseMirror ul[data-type='taskList'] input[type='checkbox']:checked:focus,
.pixel-editor__surface.ProseMirror ul[data-type='taskList'] input[type='checkbox']:checked:focus-visible,
.pixel-editor__prose.ProseMirror ul[data-type='taskList'] input[type='checkbox']:checked:focus-visible,
.pixel-editor__surface.ProseMirror ul[data-type='taskList'] input[type='checkbox']:checked:active,
.pixel-editor__prose.ProseMirror ul[data-type='taskList'] input[type='checkbox']:checked:active {
  outline: none !important;
  border-color: var(--pixel-sys-primary, #2962ff) !important;
  box-shadow: 0 0 0 0.1875rem color-mix(in srgb, var(--pixel-sys-primary, #2962ff) 32%, transparent) !important;
}
.pixel-editor__surface.ProseMirror ul[data-type='taskList'] input[type='checkbox']:checked,
.pixel-editor__prose.ProseMirror ul[data-type='taskList'] input[type='checkbox']:checked {
  border-color: var(--pixel-sys-primary, #2962ff);
  background: var(--pixel-sys-primary, #2962ff);
}
.pixel-editor__surface.ProseMirror ul[data-type='taskList'] input[type='checkbox']:checked::after,
.pixel-editor__prose.ProseMirror ul[data-type='taskList'] input[type='checkbox']:checked::after {
  content: '';
  inline-size: 0.5em;
  block-size: 0.85em;
  margin-block-start: -0.15em;
  border-inline-end: 0.18em solid currentColor;
  border-block-end: 0.18em solid currentColor;
  transform: rotate(45deg);
}
.pixel-editor__surface.ProseMirror ul[data-type='taskList'] li[data-checked='true'] > div,
.pixel-editor__prose.ProseMirror ul[data-type='taskList'] li[data-checked='true'] > div {
  color: var(--pixel-sys-on-surface-variant, #44474f);
  text-decoration: line-through;
}
.pixel-editor__surface.ProseMirror .pixel-editor-panel,
.pixel-editor__prose.ProseMirror .pixel-editor-panel {
  display: flex !important;
  flex-direction: row !important;
  align-items: flex-start !important;
  gap: var(--pixel-sys-space-sm, 0.5rem);
  margin-block: 0.75em;
  padding: var(--pixel-sys-space-md, 0.75rem);
  border-radius: var(--pixel-sys-shape-corner-small, 0.5rem);
  border-inline-start: 3px solid var(--pixel-editor-panel-accent, var(--pixel-sys-info, #2962ff));
  background: var(
    --pixel-editor-panel-bg,
    color-mix(in srgb, var(--pixel-sys-info, #2962ff) 12%, var(--pixel-sys-surface, #fffbff))
  );
}
.pixel-editor__surface.ProseMirror .pixel-editor-panel__icon,
.pixel-editor__prose.ProseMirror .pixel-editor-panel__icon {
  flex: 0 0 auto;
  font-size: 1.25rem;
  line-height: 1.4;
  color: var(--pixel-editor-panel-accent, var(--pixel-sys-info, #2962ff));
}
.pixel-editor__surface.ProseMirror .pixel-editor-panel__body,
.pixel-editor__prose.ProseMirror .pixel-editor-panel__body {
  flex: 1 1 auto !important;
  min-inline-size: 0 !important;
}
.pixel-editor__surface.ProseMirror .pixel-editor-panel__body > :first-child,
.pixel-editor__prose.ProseMirror .pixel-editor-panel__body > :first-child {
  margin-block-start: 0;
}
.pixel-editor__surface.ProseMirror .pixel-editor-panel__body > :last-child,
.pixel-editor__prose.ProseMirror .pixel-editor-panel__body > :last-child {
  margin-block-end: 0;
}
.pixel-editor__surface.ProseMirror .pixel-editor-panel--info,
.pixel-editor__prose.ProseMirror .pixel-editor-panel--info {
  --pixel-editor-panel-accent: var(--pixel-sys-info, #2962ff);
  --pixel-editor-panel-bg: color-mix(
    in srgb,
    var(--pixel-sys-info, #2962ff) 12%,
    var(--pixel-sys-surface, #fffbff)
  );
}
.pixel-editor__surface.ProseMirror .pixel-editor-panel--note,
.pixel-editor__prose.ProseMirror .pixel-editor-panel--note {
  --pixel-editor-panel-accent: var(--pixel-sys-secondary, #5b5b7a);
  --pixel-editor-panel-bg: color-mix(
    in srgb,
    var(--pixel-sys-secondary, #5b5b7a) 12%,
    var(--pixel-sys-surface, #fffbff)
  );
}
.pixel-editor__surface.ProseMirror .pixel-editor-panel--success,
.pixel-editor__prose.ProseMirror .pixel-editor-panel--success {
  --pixel-editor-panel-accent: var(--pixel-sys-success, #146c2e);
  --pixel-editor-panel-bg: color-mix(
    in srgb,
    var(--pixel-sys-success, #146c2e) 12%,
    var(--pixel-sys-surface, #fffbff)
  );
}
.pixel-editor__surface.ProseMirror .pixel-editor-panel--warning,
.pixel-editor__prose.ProseMirror .pixel-editor-panel--warning {
  --pixel-editor-panel-accent: var(--pixel-sys-warning, #b54708);
  --pixel-editor-panel-bg: color-mix(
    in srgb,
    var(--pixel-sys-warning, #b54708) 12%,
    var(--pixel-sys-surface, #fffbff)
  );
}
.pixel-editor__surface.ProseMirror .pixel-editor-panel--error,
.pixel-editor__prose.ProseMirror .pixel-editor-panel--error {
  --pixel-editor-panel-accent: var(--pixel-sys-error, #b3261e);
  --pixel-editor-panel-bg: color-mix(
    in srgb,
    var(--pixel-sys-error, #b3261e) 12%,
    var(--pixel-sys-surface, #fffbff)
  );
}
.pixel-editor__surface.ProseMirror .pixel-editor-image,
.pixel-editor__prose.ProseMirror .pixel-editor-image {
  position: relative;
  display: block;
  max-inline-size: 100%;
  margin-block: 0.75em;
  line-height: 0;
}
.pixel-editor__surface.ProseMirror .pixel-editor-image[data-align='center'],
.pixel-editor__prose.ProseMirror .pixel-editor-image[data-align='center'] {
  margin-inline: auto;
}
.pixel-editor__surface.ProseMirror .pixel-editor-image[data-align='end'],
.pixel-editor__prose.ProseMirror .pixel-editor-image[data-align='end'] {
  margin-inline-start: auto;
  margin-inline-end: 0;
}
.pixel-editor__surface.ProseMirror .pixel-editor-image[data-float='start'],
.pixel-editor__prose.ProseMirror .pixel-editor-image[data-float='start'] {
  float: inline-start;
  margin-inline-end: 1rem;
  margin-block-end: 0.5rem;
}
.pixel-editor__surface.ProseMirror .pixel-editor-image[data-float='end'],
.pixel-editor__prose.ProseMirror .pixel-editor-image[data-float='end'] {
  float: inline-end;
  margin-inline-start: 1rem;
  margin-block-end: 0.5rem;
}
.pixel-editor__surface.ProseMirror .pixel-editor-image img,
.pixel-editor__prose.ProseMirror .pixel-editor-image img {
  display: block;
  inline-size: 100%;
  block-size: auto;
  border-radius: 0;
}
.pixel-editor__surface.ProseMirror .pixel-editor-image--selected,
.pixel-editor__prose.ProseMirror .pixel-editor-image--selected {
  outline: 2px solid var(--pixel-sys-primary, #2962ff);
  outline-offset: 2px;
}
.pixel-editor__surface.ProseMirror .pixel-editor-figure,
.pixel-editor__prose.ProseMirror .pixel-editor-figure {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.35rem;
  margin-block: 0.75em;
  line-height: normal;
  inline-size: fit-content;
  max-inline-size: 100%;
}
.pixel-editor__surface.ProseMirror .pixel-editor-figure:has(.pixel-editor-image[data-align='center']),
.pixel-editor__prose.ProseMirror .pixel-editor-figure:has(.pixel-editor-image[data-align='center']) {
  margin-inline: auto;
}
.pixel-editor__surface.ProseMirror .pixel-editor-figure:has(.pixel-editor-image[data-align='end']),
.pixel-editor__prose.ProseMirror .pixel-editor-figure:has(.pixel-editor-image[data-align='end']) {
  margin-inline-start: auto;
  margin-inline-end: 0;
}
.pixel-editor__surface.ProseMirror .pixel-editor-figure:has(.pixel-editor-image[data-float='start']),
.pixel-editor__prose.ProseMirror .pixel-editor-figure:has(.pixel-editor-image[data-float='start']) {
  float: inline-start;
  margin-inline-end: 1rem;
  margin-block-end: 0.5rem;
}
.pixel-editor__surface.ProseMirror .pixel-editor-figure:has(.pixel-editor-image[data-float='end']),
.pixel-editor__prose.ProseMirror .pixel-editor-figure:has(.pixel-editor-image[data-float='end']) {
  float: inline-end;
  margin-inline-start: 1rem;
  margin-block-end: 0.5rem;
}
.pixel-editor__surface.ProseMirror .pixel-editor-figure > .pixel-editor-image,
.pixel-editor__prose.ProseMirror .pixel-editor-figure > .pixel-editor-image {
  margin-block: 0;
  /* Width is on the image; figure shrinks to it so caption centers under the image */
  float: none;
}
.pixel-editor__surface.ProseMirror .pixel-editor-figure__caption,
.pixel-editor__prose.ProseMirror .pixel-editor-figure__caption {
  display: block;
  margin-block: 0;
  padding-block: 0.25rem;
  padding-inline: 0.15rem;
  min-block-size: 1.5em;
  color: var(--pixel-sys-on-surface-variant, #44474f);
  font-size: 0.875em;
  line-height: 1.4;
  text-align: center;
  outline: none;
}
.pixel-editor__surface.ProseMirror .pixel-editor-figure__caption:empty::before,
.pixel-editor__prose.ProseMirror .pixel-editor-figure__caption:empty::before {
  content: 'Add a caption…';
  color: var(--pixel-sys-on-surface-variant, #44474f);
  opacity: 0.65;
  pointer-events: none;
}
.pixel-editor__surface.ProseMirror blockquote,
.pixel-editor__prose.ProseMirror blockquote {
  margin-inline: 0;
  margin-block: 0.75em;
  padding-inline-start: 0.75rem;
  border-inline-start: 3px solid var(--pixel-sys-primary, #2962ff);
  color: var(--pixel-sys-on-surface-variant, #44474f);
}
.pixel-editor__surface.ProseMirror .pixel-editor-table,
.pixel-editor__prose.ProseMirror .pixel-editor-table,
.pixel-editor__surface.ProseMirror table,
.pixel-editor__prose.ProseMirror table {
  inline-size: 100%;
  margin-block: 0.75em;
  border-collapse: collapse;
  table-layout: fixed;
  overflow: visible;
}
.pixel-editor__surface.ProseMirror td,
.pixel-editor__prose.ProseMirror td,
.pixel-editor__surface.ProseMirror th,
.pixel-editor__prose.ProseMirror th {
  position: relative;
  min-inline-size: 1em;
  padding-block: 0.4rem;
  padding-inline: 0.6rem;
  /* Dashed guide lines so empty tables still read as a grid while editing */
  border: 1px dashed var(--pixel-sys-outline-variant, #c4c6d0);
  vertical-align: top;
  box-sizing: border-box;
}
.pixel-editor__surface.ProseMirror th,
.pixel-editor__prose.ProseMirror th {
  background: var(--pixel-sys-surface-container-high, #e8e7ec);
  font-weight: 600;
  text-align: start;
}
.pixel-editor__surface.ProseMirror .selectedCell::after,
.pixel-editor__prose.ProseMirror .selectedCell::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: color-mix(in srgb, var(--pixel-sys-primary, #2962ff) 12%, transparent);
  z-index: 1;
}
`;
}
