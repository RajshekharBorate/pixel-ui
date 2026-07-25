import { copyPixelThemeContext } from '../../theme/pixel-theme';

/**
 * Shared caret-anchored suggestion panel for slash (`/`) and mention (`@`).
 *
 * TipTap suggestions render outside Angular’s tree, so we mirror `pixel-select`
 * panel + option chrome (tokens, shadow, option layout) and reposition on scroll
 * like the shared connected-overlay `reposition` strategy.
 */

export const PIXEL_EDITOR_SUGGEST_STYLE_ID = 'pixel-editor-suggest-styles';

export type PixelEditorSuggestListItem = {
  readonly id: string;
  readonly label: string;
  readonly subtitle?: string;
  readonly icon?: string;
};

const GAP_PX = 6;
const VIEWPORT_MARGIN_PX = 8;

export function ensurePixelEditorSuggestStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(PIXEL_EDITOR_SUGGEST_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = PIXEL_EDITOR_SUGGEST_STYLE_ID;
  // Visual language matches `.pixel-select__panel` / `.pixel-select__option`.
  style.textContent = `
.pixel-editor-suggest {
  box-sizing: border-box;
  position: fixed;
  z-index: 1200;
  display: flex;
  flex-direction: column;
  min-inline-size: 14rem;
  max-inline-size: 22rem;
  max-block-size: 18rem;
  overflow: hidden;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: calc(0.75rem - 0.125rem);
  background: var(--pixel-sys-surface, #fffbff);
  color: var(--pixel-sys-on-surface, #1a1b1f);
  box-shadow: 0 0.5rem 1.75rem color-mix(in srgb, var(--pixel-sys-on-surface, #1a1b1f) 18%, transparent);
  font-family: inherit;
  font-size: 0.875rem;
  line-height: 1.35;
  pointer-events: auto;
}
.pixel-editor-suggest__options {
  flex: 0 1 auto;
  min-block-size: 0;
  overflow-block: auto;
  overflow-inline: hidden;
  overscroll-behavior: contain;
  padding-block: 0.25rem;
  padding-inline: 0;
}
.pixel-editor-suggest__empty {
  padding: 0.5rem 0.75rem;
  color: var(--pixel-sys-on-surface-variant, #44474f);
}
.pixel-editor-suggest__option {
  inline-size: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;
  margin: 0;
  padding: 0.5rem 0.75rem;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: inherit;
  text-align: start;
  cursor: pointer;
  font: inherit;
  font-size: inherit;
  line-height: inherit;
  transition: background-color 120ms ease;
}
.pixel-editor-suggest__option:hover,
.pixel-editor-suggest__option--active {
  background: color-mix(in srgb, var(--pixel-sys-primary, #2962ff) 10%, transparent);
}
.pixel-editor-suggest__option:focus,
.pixel-editor-suggest__option:focus-visible {
  outline: none;
}
.pixel-editor-suggest__option-icon {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  line-height: 1;
  color: var(--pixel-sys-on-surface-variant, #44474f);
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  user-select: none;
}
.pixel-editor-suggest__option-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.05rem;
  min-inline-size: 0;
}
.pixel-editor-suggest__option-label {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-inline-size: 100%;
}
.pixel-editor-suggest__option-subtitle {
  font-size: var(--pixel-sys-label-sm-size, 0.75rem);
  font-weight: 400;
  line-height: var(--pixel-sys-label-sm-line-height, 1.25);
  color: var(--pixel-sys-on-surface-variant, #44474f);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-inline-size: 100%;
}
@media (prefers-reduced-motion: reduce) {
  .pixel-editor-suggest {
    box-shadow: 0 0.25rem 0.75rem color-mix(in srgb, var(--pixel-sys-on-surface, #1a1b1f) 12%, transparent);
  }
  .pixel-editor-suggest__option {
    transition: none;
  }
}
`;
  document.head.appendChild(style);
}

export function createPixelEditorSuggestRoot(
  ariaLabel: string,
  themeAnchor?: HTMLElement | null,
): HTMLDivElement {
  ensurePixelEditorSuggestStyles();
  const root = document.createElement('div');
  root.className = 'pixel-editor-suggest';
  root.setAttribute('role', 'listbox');
  root.setAttribute('aria-label', ariaLabel);
  const options = document.createElement('div');
  options.className = 'pixel-editor-suggest__options';
  root.appendChild(options);
  copyPixelThemeContext(root, themeAnchor ?? document.body);
  document.body.appendChild(root);
  return root;
}

function suggestOptionsEl(root: HTMLElement): HTMLElement {
  return (
    (root.querySelector('.pixel-editor-suggest__options') as HTMLElement | null) ?? root
  );
}

/**
 * Place the panel under (or above) the caret using viewport coordinates.
 * Uses `left`/`top` like connected-overlay so scroll reposition stays stable.
 */
export function placePixelEditorSuggestRoot(
  root: HTMLElement,
  clientRect: (() => DOMRect | null) | null | undefined,
): void {
  const rect = clientRect?.();
  if (!rect || typeof window === 'undefined') return;

  const panelW = root.offsetWidth || 224;
  const panelH = root.offsetHeight || 160;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = rect.bottom + GAP_PX;
  let left = rect.left;

  // Flip above the caret when there isn’t enough room below.
  if (top + panelH > vh - VIEWPORT_MARGIN_PX && rect.top - GAP_PX - panelH >= VIEWPORT_MARGIN_PX) {
    top = rect.top - GAP_PX - panelH;
  }

  left = Math.min(
    Math.max(left, VIEWPORT_MARGIN_PX),
    Math.max(VIEWPORT_MARGIN_PX, vw - panelW - VIEWPORT_MARGIN_PX),
  );
  top = Math.min(
    Math.max(top, VIEWPORT_MARGIN_PX),
    Math.max(VIEWPORT_MARGIN_PX, vh - panelH - VIEWPORT_MARGIN_PX),
  );

  root.style.position = 'fixed';
  root.style.left = `${Math.round(left)}px`;
  root.style.top = `${Math.round(top)}px`;
  root.style.right = 'auto';
  root.style.bottom = 'auto';
  root.style.insetInlineStart = '';
  root.style.insetBlockStart = '';
  root.style.zIndex = '1200';
}

/**
 * Keep the panel glued to the caret while the page or editor scrolls
 * (mirrors connected-overlay `scrollStrategy: 'reposition'`).
 */
export function attachPixelEditorSuggestReposition(
  root: HTMLElement,
  clientRect: (() => DOMRect | null) | null | undefined,
): () => void {
  if (typeof window === 'undefined') {
    placePixelEditorSuggestRoot(root, clientRect);
    return () => undefined;
  }

  const reposition = (): void => {
    placePixelEditorSuggestRoot(root, clientRect);
  };
  reposition();
  // Capture phase so nested scroll containers (docs page, editor) are caught.
  window.addEventListener('scroll', reposition, true);
  window.addEventListener('resize', reposition);
  return () => {
    window.removeEventListener('scroll', reposition, true);
    window.removeEventListener('resize', reposition);
  };
}

export function renderPixelEditorSuggestItems(
  root: HTMLElement,
  items: readonly PixelEditorSuggestListItem[],
  selectedIndex: number,
  onPick: (index: number) => void,
): void {
  const list = suggestOptionsEl(root);
  list.replaceChildren();
  if (items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'pixel-editor-suggest__empty';
    empty.textContent = 'No matches';
    list.appendChild(empty);
    return;
  }

  items.forEach((item, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pixel-editor-suggest__option';
    if (index === selectedIndex) {
      btn.classList.add('pixel-editor-suggest__option--active');
    }
    btn.setAttribute('role', 'option');
    btn.setAttribute('aria-selected', String(index === selectedIndex));
    btn.id = `pixel-editor-suggest-option-${item.id}-${index}`;

    if (item.icon) {
      const icon = document.createElement('span');
      icon.className = 'material-symbols-outlined pixel-editor-suggest__option-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = item.icon;
      btn.appendChild(icon);
    }

    const copy = document.createElement('span');
    copy.className = 'pixel-editor-suggest__option-copy';
    const label = document.createElement('span');
    label.className = 'pixel-editor-suggest__option-label';
    label.textContent = item.label;
    copy.appendChild(label);
    if (item.subtitle) {
      const sub = document.createElement('small');
      sub.className = 'pixel-editor-suggest__option-subtitle';
      sub.textContent = item.subtitle;
      copy.appendChild(sub);
    }
    btn.appendChild(copy);

    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      onPick(index);
    });
    list.appendChild(btn);
  });

  const active = list.querySelector('.pixel-editor-suggest__option--active') as HTMLElement | null;
  active?.scrollIntoView({ block: 'nearest' });
}
