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

/** Resolve modern CSS colors (`var`, `color-mix`, `color(srgb)`) for canvas consumers. */
function resolveCssColor(el: HTMLElement, value: string, fallback: string): string {
  const doc = el.ownerDocument;
  if (!doc?.body) {
    return value || fallback;
  }
  const probe = doc.createElement('span');
  probe.style.cssText =
    'position:absolute;visibility:hidden;pointer-events:none;inset:0;color:' + fallback;
  probe.style.color = value || fallback;
  el.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();

  const srgb = computed.match(
    /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/,
  );
  if (!srgb) {
    return computed || fallback;
  }
  const channel = (raw: string): number =>
    Math.max(0, Math.min(255, Math.round(Number.parseFloat(raw) * 255)));
  const alpha = srgb[4] == null ? 1 : Math.max(0, Math.min(1, Number.parseFloat(srgb[4])));
  return `rgba(${channel(srgb[1]!)}, ${channel(srgb[2]!)}, ${channel(srgb[3]!)}, ${alpha})`;
}

function cssLengthToPx(value: string, fallbackPx: number): number {
  const trimmed = value.trim();
  const n = Number.parseFloat(trimmed);
  if (!Number.isFinite(n)) {
    return fallbackPx;
  }
  if (trimmed.endsWith('rem') || trimmed.endsWith('em')) {
    return n * 16;
  }
  return n;
}

/** Relative luminance 0–1 for hex / rgb(a) strings; null when unparsable. */
function relativeLuminance(cssColor: string): number | null {
  const hex = cssColor.trim().match(/^#([\da-f]{3}|[\da-f]{6})$/i)?.[1];
  let r = 0;
  let g = 0;
  let b = 0;
  if (hex) {
    const expanded =
      hex.length === 3 ? [...hex].map((part) => `${part}${part}`).join('') : hex;
    r = Number.parseInt(expanded.slice(0, 2), 16) / 255;
    g = Number.parseInt(expanded.slice(2, 4), 16) / 255;
    b = Number.parseInt(expanded.slice(4, 6), 16) / 255;
  } else {
    const rgb = cssColor
      .trim()
      .match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
    if (!rgb) {
      return null;
    }
    r = Number.parseFloat(rgb[1]!) / 255;
    g = Number.parseFloat(rgb[2]!) / 255;
    b = Number.parseFloat(rgb[3]!) / 255;
  }
  const channel = (c: number): number =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function isDarkSchemeAncestor(el: HTMLElement): boolean | null {
  let node: HTMLElement | null = el;
  while (node) {
    const scheme = node.getAttribute('data-color-scheme');
    if (scheme === 'dark') {
      return true;
    }
    if (scheme === 'light') {
      return false;
    }
    const theme = node.getAttribute('data-theme') ?? '';
    if (theme.includes('dark')) {
      return true;
    }
    if (theme.includes('light')) {
      return false;
    }
    node = node.parentElement;
  }
  return null;
}

/**
 * When the canvas is dark but the ramp still resolves near-white, replace with a
 * primary-forward ramp so heatmap kernels do not paint pale boxes.
 */
function ensureMapRampForSurface(
  ramp: readonly string[],
  surfaceToken: string,
  el: HTMLElement,
  primary: string,
): string[] {
  const surfaceResolved = resolveCssColor(el, surfaceToken, surfaceToken);
  const schemeDark = isDarkSchemeAncestor(el);
  const surfaceL = relativeLuminance(surfaceResolved);
  const canvasDark =
    schemeDark === true ||
    (schemeDark !== false && surfaceL != null && surfaceL < 0.28);
  if (!canvasDark) {
    return [...ramp];
  }
  const lowL = relativeLuminance(ramp[0] ?? '');
  if (lowL == null || lowL < 0.45) {
    return [...ramp];
  }
  const high = resolveCssColor(el, primary, primary);
  // Bright upper stops so heatmaps / choropleth peaks read on dark surfaces.
  return [
    resolveCssColor(el, `color-mix(in srgb, ${primary} 32%, #0e1218)`, '#1a2330'),
    resolveCssColor(el, `color-mix(in srgb, ${primary} 55%, #12151c)`, '#3d6fa8'),
    resolveCssColor(el, `color-mix(in srgb, ${primary} 78%, #1a2330)`, '#5b9bd4'),
    high,
    resolveCssColor(el, `color-mix(in srgb, ${primary} 42%, #ffffff)`, '#d6e6ff'),
  ];
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

  const axisLineColor = readCssVar(el, '--pixel-chart-axis-line-color', outline);
  const gridOpacityRaw = readCssVar(el, '--pixel-chart-grid-opacity', '0.75');
  const gridWidthRaw = readCssVar(el, '--pixel-chart-grid-width', '0.5');
  const lineWidthRaw = readCssVar(el, '--pixel-chart-line-width', '2');
  const areaOpacityRaw = readCssVar(el, '--pixel-chart-area-opacity', '0.35');
  const mapRampRaw = [
    resolveCssColor(el, readCssVar(el, '--pixel-chart-map-ramp-low', '#e3f2fd'), '#e3f2fd'),
    resolveCssColor(
      el,
      readCssVar(el, '--pixel-chart-map-ramp-low-mid', '#90caf9'),
      '#90caf9',
    ),
    resolveCssColor(el, readCssVar(el, '--pixel-chart-map-ramp-mid', '#42a5f5'), '#42a5f5'),
    resolveCssColor(
      el,
      readCssVar(el, '--pixel-chart-map-ramp-high-mid', '#1e88e5'),
      '#1e88e5',
    ),
    resolveCssColor(el, readCssVar(el, '--pixel-chart-map-ramp-high', primary), primary),
  ];
  const mapRamp = ensureMapRampForSurface(mapRampRaw, surface, el, primary);
  const mapNoData = resolveCssColor(
    el,
    readCssVar(
      el,
      '--pixel-chart-map-no-data',
      'color-mix(in srgb, var(--pixel-sys-outline, #74777f) 18%, transparent)',
    ),
    'rgba(116, 119, 127, 0.18)',
  );
  const mapBorder = resolveCssColor(
    el,
    readCssVar(
      el,
      '--pixel-chart-map-border',
      'color-mix(in srgb, var(--pixel-sys-outline, #74777f) 50%, transparent)',
    ),
    'rgba(116, 119, 127, 0.45)',
  );
  const mapEmphasisBorder = resolveCssColor(
    el,
    readCssVar(
      el,
      '--pixel-chart-map-border-emphasis',
      'color-mix(in srgb, var(--pixel-sys-primary, #1565c0) 72%, transparent)',
    ),
    'rgba(21, 101, 192, 0.85)',
  );
  const mapShadow = resolveCssColor(
    el,
    readCssVar(
      el,
      '--pixel-chart-map-shadow',
      'color-mix(in srgb, var(--pixel-sys-on-surface, #1a1b1f) 22%, transparent)',
    ),
    'rgba(26, 27, 31, 0.22)',
  );
  const gridOpacity = Number.parseFloat(gridOpacityRaw);
  const gridWidth = Number.parseFloat(gridWidthRaw);
  const themeLineWidth = Number.parseFloat(lineWidthRaw);
  const themeAreaOpacity = Number.parseFloat(areaOpacityRaw);
  const splitLineStyle = {
    color: outlineVariant,
    opacity: Number.isFinite(gridOpacity) ? gridOpacity : 0.75,
    width: Number.isFinite(gridWidth) ? gridWidth : 0.5,
  };

  const colors = resolvePixelChartPaletteColors(palette);
  const seriesColors =
    colors === PIXEL_CHART_PALETTE_BRAND
      ? [primary, ...PIXEL_CHART_PALETTE_BRAND.slice(1)]
      : colors;

  // Axis labels use on-surface (not variant) for readable contrast in dark scheme.
  const axisLabelColor = onSurface;
  const axisMuted = onSurfaceVariant;

  // Match `pixel-tooltip` **surface** theme (`styles/_tooltip.scss`). Plot hover stays on
  // ECharts (canvas cursor + multi-series); we only mirror chrome — not `pixelTooltip`.
  const tooltipFontPx = cssLengthToPx(
    readCssVar(el, '--pixel-sys-label-sm-size', '0.8125rem'),
    13,
  );
  const tooltipLine = Number.parseFloat(
    readCssVar(el, '--pixel-sys-label-sm-line-height', '1.2'),
  );
  const tooltipWeight = Number.parseInt(
    readCssVar(el, '--pixel-sys-label-sm-weight', '500'),
    10,
  );
  const elevation = readCssVar(
    el,
    '--pixel-sys-elevation-level1',
    '0 2px 8px rgb(0 0 0 / 18%)',
  );
  const radius = readCssVar(el, '--pixel-sys-shape-corner-small', '0.5rem');

  return {
    color: seriesColors,
    backgroundColor: 'transparent',
    textStyle: { color: onSurface, fontFamily },
    title: { textStyle: { color: onSurface, fontFamily } },
    legend: { textStyle: { color: axisMuted, fontFamily } },
    line: {
      lineStyle: {
        width: Number.isFinite(themeLineWidth) ? themeLineWidth : 2,
      },
      areaStyle: {
        opacity: Number.isFinite(themeAreaOpacity) ? themeAreaOpacity : 0.35,
      },
    },
    visualMap: {
      inRange: { color: mapRamp },
      textStyle: { color: axisLabelColor, fontFamily },
    },
    map: {
      noDataColor: mapNoData,
      borderColor: mapBorder,
      emphasisBorderColor: mapEmphasisBorder,
      shadowColor: mapShadow,
    },
    tooltip: {
      backgroundColor: surfaceContainer || surface,
      borderColor: `color-mix(in srgb, ${outline} 32%, transparent)`,
      borderWidth: 1,
      // `.pixel-tooltip` padding-block / padding-inline ≈ 6px / 8px.
      padding: [6, 8] as const,
      extraCssText: [
        `border-radius:${radius}`,
        `box-shadow:${elevation}`,
        'overflow:hidden',
      ].join(';'),
      textStyle: {
        color: onSurface,
        fontFamily,
        fontSize: tooltipFontPx,
        fontWeight: Number.isFinite(tooltipWeight) ? tooltipWeight : 500,
        lineHeight: Number.isFinite(tooltipLine)
          ? Math.round(tooltipFontPx * tooltipLine)
          : Math.round(tooltipFontPx * 1.2),
      },
    },
    categoryAxis: {
      axisLine: { lineStyle: { color: axisLineColor } },
      axisLabel: { color: axisLabelColor, fontFamily },
      axisTick: { lineStyle: { color: axisLineColor } },
      splitLine: { lineStyle: { ...splitLineStyle } },
      nameTextStyle: { color: axisLabelColor, fontFamily },
    },
    valueAxis: {
      axisLine: { lineStyle: { color: axisLineColor } },
      axisLabel: { color: axisLabelColor, fontFamily },
      axisTick: { lineStyle: { color: axisLineColor } },
      splitLine: { lineStyle: { ...splitLineStyle } },
      nameTextStyle: { color: axisLabelColor, fontFamily },
    },
  };
}
