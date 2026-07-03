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

/** Whether the theme id uses a dark color scheme. */
export function isPixelDarkTheme(themeId: PixelThemeId): boolean {
  return DARK_THEME_IDS.has(themeId);
}

/** Apply theme tokens to a DOM target (defaults to `document.documentElement`). */
export function applyPixelTheme(
  themeId: PixelThemeId,
  target: HTMLElement = document.documentElement,
): void {
  target.setAttribute('data-theme', themeId);
  target.setAttribute('data-color-scheme', isPixelDarkTheme(themeId) ? 'dark' : 'light');

  try {
    localStorage.setItem(STORAGE_KEY, themeId);
  } catch {
    // Private browsing or blocked storage — theme still applies for the session.
  }
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
