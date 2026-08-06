import { signal, type Signal } from '@angular/core';

/** Registered theme identifiers (set on `data-theme`). */
export type PixelThemeId = 'enterprise-light' | 'enterprise-dark';

export interface PixelThemeOption {
  readonly id: PixelThemeId;
  readonly label: string;
}

/** All built-in themes for selectors and documentation. */
export const PIXEL_THEME_OPTIONS: readonly PixelThemeOption[] = [
  { id: 'enterprise-light', label: 'Enterprise light' },
  { id: 'enterprise-dark', label: 'Enterprise dark' },
] as const;

const STORAGE_KEY = 'pixel-theme';

const DARK_THEME_IDS: ReadonlySet<PixelThemeId> = new Set(['enterprise-dark']);

const VALID_THEME_IDS: ReadonlySet<string> = new Set(
  PIXEL_THEME_OPTIONS.map((option) => option.id),
);

const themeIdState = signal<PixelThemeId>('enterprise-light');
const themeVersionState = signal(0);

/**
 * True while `applyPixelTheme` is writing DOM attributes so MutationObserver
 * fallbacks can ignore the echo and avoid a double version bump.
 */
let applyingPixelTheme = false;

/** Active theme id — reactive; charts and chrome should track this (or `pixelThemeVersion`). */
export const pixelThemeId: Signal<PixelThemeId> = themeIdState.asReadonly();

/**
 * Monotonic counter bumped on every theme apply / DOM sync.
 * Chart hosts track this in an `effect` so ECharts chrome re-reads CSS tokens.
 */
export const pixelThemeVersion: Signal<number> = themeVersionState.asReadonly();

/** Whether the theme id uses a dark color scheme. */
export function isPixelDarkTheme(themeId: PixelThemeId): boolean {
  return DARK_THEME_IDS.has(themeId);
}

export type PixelColorScheme = 'light' | 'dark';

/** Resolve `light` | `dark` from an explicit scheme attribute or a theme id. */
export function resolvePixelColorScheme(
  themeId: string,
  explicitScheme?: string | null,
): PixelColorScheme {
  if (explicitScheme === 'dark' || explicitScheme === 'light') {
    return explicitScheme;
  }
  return isPixelDarkTheme(themeId as PixelThemeId) ? 'dark' : 'light';
}

/** Nearest element carrying `data-theme`, falling back to the document root. */
export function findPixelThemeSource(
  start: HTMLElement | null =
    typeof document !== 'undefined' ? document.documentElement : null,
): HTMLElement | null {
  if (typeof document === 'undefined') {
    return null;
  }
  if (!start) {
    return document.querySelector('[data-theme]');
  }
  if (start.hasAttribute('data-theme')) {
    return start;
  }
  return start.closest('[data-theme]') ?? document.querySelector('[data-theme]');
}

/**
 * Copy `data-theme` and `data-color-scheme` onto a body-relocated node so component
 * tokens and scheme mixins resolve (CONVENTIONS §9).
 */
export function copyPixelThemeContext(
  target: HTMLElement,
  source?: HTMLElement | null,
): void {
  const themed = findPixelThemeSource(source ?? document.documentElement);
  if (!themed) {
    return;
  }
  const theme = themed.getAttribute('data-theme');
  if (!theme) {
    return;
  }
  target.setAttribute('data-theme', theme);
  target.setAttribute(
    'data-color-scheme',
    resolvePixelColorScheme(theme, themed.getAttribute('data-color-scheme')),
  );
}

/** Apply theme tokens to a DOM target (defaults to `document.documentElement`). */
export function applyPixelTheme(
  themeId: PixelThemeId,
  target: HTMLElement = document.documentElement,
): void {
  applyingPixelTheme = true;
  try {
    target.setAttribute('data-theme', themeId);
    target.setAttribute('data-color-scheme', isPixelDarkTheme(themeId) ? 'dark' : 'light');
    themeIdState.set(themeId);
    themeVersionState.update((version) => version + 1);

    try {
      localStorage.setItem(STORAGE_KEY, themeId);
    } catch {
      // Private browsing or blocked storage — theme still applies for the session.
    }
  } finally {
    // Allow MutationObserver to see the write as "ours" for this turn.
    queueMicrotask(() => {
      applyingPixelTheme = false;
    });
  }
}

/**
 * Sync reactive theme state from the DOM when `data-theme` changes outside
 * `applyPixelTheme` (manual attribute edits, non-Angular hosts).
 * No-ops while `applyPixelTheme` is writing to avoid double bumps.
 */
export function syncPixelThemeFromDom(
  target: HTMLElement = document.documentElement,
): void {
  if (applyingPixelTheme) {
    return;
  }
  const raw = target.getAttribute('data-theme');
  if (raw && VALID_THEME_IDS.has(raw)) {
    const themeId = raw as PixelThemeId;
    if (themeIdState() !== themeId) {
      themeIdState.set(themeId);
    }
  }
  themeVersionState.update((version) => version + 1);
}

/**
 * Bump `pixelThemeVersion` so dependents re-read CSS tokens without changing
 * `pixelThemeId` (e.g. a scoped `[data-theme]` panel under the host).
 */
export function notifyPixelThemeTokensMayHaveChanged(): void {
  if (applyingPixelTheme) {
    return;
  }
  themeVersionState.update((version) => version + 1);
}

/** Read a previously stored theme id, or `null` if none / invalid. */
export function readStoredPixelTheme(): PixelThemeId | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && VALID_THEME_IDS.has(stored)) {
      return stored as PixelThemeId;
    }
  } catch {
    // Ignore storage errors.
  }
  return null;
}

/** Apply stored theme or fall back to enterprise light. */
export function initPixelTheme(
  fallback: PixelThemeId = 'enterprise-light',
  target: HTMLElement = document.documentElement,
): PixelThemeId {
  const themeId = readStoredPixelTheme() ?? fallback;
  applyPixelTheme(themeId, target);
  return themeId;
}
