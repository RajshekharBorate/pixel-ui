import { describe, expect, it, beforeEach } from 'vitest';
import {
  applyPixelTheme,
  initPixelTheme,
  notifyPixelThemeTokensMayHaveChanged,
  pixelThemeId,
  pixelThemeVersion,
  syncPixelThemeFromDom,
} from './pixel-theme';

describe('pixel-theme reactive API', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-color-scheme');
    initPixelTheme('enterprise-light');
  });

  it('applyPixelTheme sets DOM attrs and bumps pixelThemeVersion', () => {
    const before = pixelThemeVersion();
    applyPixelTheme('enterprise-dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('enterprise-dark');
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('dark');
    expect(pixelThemeId()).toBe('enterprise-dark');
    expect(pixelThemeVersion()).toBe(before + 1);
  });

  it('syncPixelThemeFromDom is a no-op while applyPixelTheme is writing', async () => {
    const before = pixelThemeVersion();
    applyPixelTheme('enterprise-dark');
    // Echo during the same turn should not bump again.
    syncPixelThemeFromDom(document.documentElement);
    expect(pixelThemeVersion()).toBe(before + 1);
    await Promise.resolve();
    // After the microtask, a genuine external sync may bump.
    document.documentElement.setAttribute('data-theme', 'enterprise-light');
    syncPixelThemeFromDom(document.documentElement);
    expect(pixelThemeId()).toBe('enterprise-light');
    expect(pixelThemeVersion()).toBe(before + 2);
  });

  it('notifyPixelThemeTokensMayHaveChanged bumps version without changing id', async () => {
    applyPixelTheme('enterprise-dark');
    await Promise.resolve(); // clear applyPixelTheme echo guard
    const id = pixelThemeId();
    const before = pixelThemeVersion();
    notifyPixelThemeTokensMayHaveChanged();
    expect(pixelThemeId()).toBe(id);
    expect(pixelThemeVersion()).toBe(before + 1);
  });
});
