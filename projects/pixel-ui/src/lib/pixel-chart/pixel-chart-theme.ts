import type { PixelChartEChartsTheme, PixelChartPalette, PixelChartPaletteId } from './pixel-chart.types';

/** Fallback series colors when CSS vars are unavailable (SSR / tests). */
export const PIXEL_CHART_PALETTE_BRAND: readonly string[] = [
  '#1565c0',
  '#00897b',
  '#7e57c2',
  '#ef6c00',
  '#f9a825',
  '#5c6bc0',
  '#26a69a',
  '#ab47bc',
];

export const PIXEL_CHART_PALETTE_VIBRANT: readonly string[] = [
  '#1d61d1',
  '#00bfa5',
  '#8b5cf6',
  '#f4511e',
  '#ffb300',
  '#3949ab',
  '#00acc1',
  '#d81b60',
];

export const PIXEL_CHART_PALETTE_COOL: readonly string[] = [
  '#0277bd',
  '#00838f',
  '#5e35b1',
  '#3949ab',
  '#00897b',
  '#546e7a',
  '#039be5',
  '#7e57c2',
];

export const PIXEL_CHART_PALETTE_WARM: readonly string[] = [
  '#e65100',
  '#f9a825',
  '#c62828',
  '#ef6c00',
  '#f57c00',
  '#ff8f00',
  '#d84315',
  '#bf360c',
];

const NAMED_PALETTES: Readonly<Record<PixelChartPaletteId, readonly string[]>> = {
  brand: PIXEL_CHART_PALETTE_BRAND,
  vibrant: PIXEL_CHART_PALETTE_VIBRANT,
  cool: PIXEL_CHART_PALETTE_COOL,
  warm: PIXEL_CHART_PALETTE_WARM,
};

const FONT_FALLBACK =
  "'Google Sans', 'Google Sans Text', Roboto, ui-sans-serif, system-ui, sans-serif";

/**
 * Resolve palette colors from a named id or an explicit list.
 */
export function resolvePixelChartPaletteColors(palette: PixelChartPalette = 'brand'): readonly string[] {
  if (typeof palette !== 'string') {
    return palette.length > 0 ? palette : PIXEL_CHART_PALETTE_BRAND;
  }
  return NAMED_PALETTES[palette] ?? PIXEL_CHART_PALETTE_BRAND;
}

function readCssVar(el: HTMLElement, name: string, fallback: string): string {
  const value = getComputedStyle(el).getPropertyValue(name).trim();
  return value || fallback;
}

/**
 * Map Pixel system tokens on `el` (or a theme ancestor) into an ECharts theme object.
 * Literal fallbacks match `_theming.scss` enterprise-light defaults.
 */
export function buildPixelChartEChartsTheme(
  el: HTMLElement,
  palette: PixelChartPalette = 'brand',
): PixelChartEChartsTheme {
  const onSurface = readCssVar(el, '--pixel-sys-on-surface', '#1a1b1f');
  const onSurfaceVariant = readCssVar(el, '--pixel-sys-on-surface-variant', '#44474e');
  const outline = readCssVar(el, '--pixel-sys-outline', '#74777f');
  const outlineVariant = readCssVar(el, '--pixel-sys-outline-variant', '#c4c6d0');
  const surface = readCssVar(el, '--pixel-sys-surface', '#f8f9ff');
  const surfaceContainer = readCssVar(el, '--pixel-sys-surface-container', surface);
  const primary = readCssVar(el, '--pixel-sys-primary', '#1565c0');
  const fontFamily = readCssVar(el, '--pixel-sys-font-family', FONT_FALLBACK);

  const colors = resolvePixelChartPaletteColors(palette);
  const seriesColors =
    colors === PIXEL_CHART_PALETTE_BRAND
      ? [primary, ...PIXEL_CHART_PALETTE_BRAND.slice(1)]
      : colors;

  // Axis labels use on-surface (not variant) for readable contrast in dark scheme.
  const axisLabelColor = onSurface;
  const axisMuted = onSurfaceVariant;

  return {
    color: seriesColors,
    backgroundColor: 'transparent',
    textStyle: { color: onSurface, fontFamily },
    title: { textStyle: { color: onSurface, fontFamily } },
    legend: { textStyle: { color: axisMuted, fontFamily } },
    tooltip: {
      backgroundColor: surfaceContainer || surface,
      borderColor: outlineVariant,
      textStyle: { color: onSurface, fontFamily },
    },
    categoryAxis: {
      axisLine: { lineStyle: { color: outline } },
      axisLabel: { color: axisLabelColor, fontFamily },
      axisTick: { lineStyle: { color: outline } },
      splitLine: { lineStyle: { color: outlineVariant } },
      nameTextStyle: { color: axisMuted, fontFamily },
    },
    valueAxis: {
      axisLine: { lineStyle: { color: outline } },
      axisLabel: { color: axisLabelColor, fontFamily },
      axisTick: { lineStyle: { color: outline } },
      splitLine: { lineStyle: { color: outlineVariant } },
      nameTextStyle: { color: axisMuted, fontFamily },
    },
  };
}
