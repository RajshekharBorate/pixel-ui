/**
 * Expected `--pixel-sys-*` values for unit tests.
 * Keep in sync with `$light-theme` / `$dark-theme` in `src/styles/_theming.scss`.
 * Spec hosts must use `data-theme="enterprise-light" | "enterprise-dark"`
 * (see `PixelThemeId`) — bare `"dark"` / `"light"` do not apply theme tokens.
 */
import type { PixelThemeId } from '../lib/theme/pixel-theme';

export const PIXEL_TEST_THEME = {
  light: 'enterprise-light',
  dark: 'enterprise-dark',
} as const satisfies Record<'light' | 'dark', PixelThemeId>;

/** Resolved system color tokens per registered theme. */
export const PIXEL_SYS_COLOR = {
  light: {
    primary: '#0b57d0',
    surface: '#fafcff',
    surfaceContainerLow: '#f3f6fc',
    error: '#b3261e',
  },
  dark: {
    primary: '#a8c7fa',
    surface: '#1a2332',
    surfaceContainerLow: '#161d2b',
    error: '#ff8a84',
  },
} as const;

/** Read a custom property from an element (trimmed). */
export function cssVar(el: Element, name: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

/** Assert host has the enterprise-light primary (default theme-host). */
export function expectLightSysPrimary(host: Element): void {
  expect(cssVar(host, '--pixel-sys-primary')).toBe(PIXEL_SYS_COLOR.light.primary);
}

/** Assert host picked up enterprise-dark system tokens from a themed ancestor. */
export function expectDarkSysPrimary(host: Element): void {
  expect(cssVar(host, '--pixel-sys-primary')).toBe(PIXEL_SYS_COLOR.dark.primary);
}

/** Soft check: token is defined (non-empty). Prefer scheme helpers when asserting brand colors. */
export function expectCssVarDefined(host: Element, name: string): void {
  expect(cssVar(host, name).length).toBeGreaterThan(0);
}
