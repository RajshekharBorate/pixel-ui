import type { EChartsCoreOption, EChartsType } from 'echarts/core';
import * as echarts from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';
import { saveAs } from '../../services/export/save-as';

export type PixelChartExportLegendItem = {
  readonly name: string;
  readonly color: string;
  readonly visible: boolean;
};

export type PixelChartExportMeta = {
  readonly title?: string;
  readonly description?: string;
  readonly legendItems?: readonly PixelChartExportLegendItem[];
};

let svgRendererRegistered = false;

function ensureSvgRenderer(): void {
  if (svgRendererRegistered) {
    return;
  }
  echarts.use([SVGRenderer]);
  svgRendererRegistered = true;
}

/** Surface token from the chart DOM (or ancestor) for export backgrounds. */
export function resolveChartExportBackground(
  chart: EChartsType | null | undefined,
  fallback = '#ffffff',
): string {
  if (!chart || typeof document === 'undefined') {
    return fallback;
  }
  const el = chart.getDom() as HTMLElement | undefined;
  if (!el) {
    return fallback;
  }
  const fromShell = getComputedStyle(el)
    .getPropertyValue('--pixel-chart-shell-bg')
    .trim();
  if (fromShell) {
    return fromShell;
  }
  const surface = getComputedStyle(el).getPropertyValue('--pixel-sys-surface').trim();
  return surface || fallback;
}

/**
 * SVG `style` attributes break when `font-family` contains commas (multi-family stacks).
 * Reduce to the first safe token only (no quotes, no commas).
 */
function sanitizeSvgFontFamily(raw: string): string {
  const clean = raw.replace(/['"]/g, '').trim();
  const first = clean.split(',')[0]?.trim() ?? '';
  return first || 'sans-serif';
}

function sanitizeSvgMarkup(svgText: string): string {
  return svgText.replaceAll(/font-family:([^;"]+)/g, (_m, family: string) => {
    return `font-family:${sanitizeSvgFontFamily(family)}`;
  });
}

/**
 * Remove all `fontFamily` keys from an ECharts option so the SVG renderer
 * falls back to a single safe default instead of writing multi-value stacks.
 */
function stripFontFamilyFromOption(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripFontFamilyFromOption);
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === 'fontFamily') {
        continue;
      }
      out[k] = stripFontFamilyFromOption(v);
    }
    return out;
  }
  return value;
}

/** Ensure title / pie labels use the live theme foreground for export. */
function applyExportForeground(value: unknown, foreground: string): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => applyExportForeground(item, foreground));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  const obj = { ...(value as Record<string, unknown>) };
  if (obj['textStyle'] && typeof obj['textStyle'] === 'object') {
    const textStyle = { ...(obj['textStyle'] as Record<string, unknown>) };
    textStyle['color'] = foreground;
    obj['textStyle'] = textStyle;
  }
  if (obj['title'] != null) {
    obj['title'] = applyExportForeground(obj['title'], foreground);
  }
  if (obj['label'] && typeof obj['label'] === 'object') {
    const label = { ...(obj['label'] as Record<string, unknown>) };
    if (label['show'] !== false) {
      label['color'] = foreground;
      obj['label'] = label;
    }
  }
  if (Array.isArray(obj['series'])) {
    obj['series'] = applyExportForeground(obj['series'], foreground);
  }
  return obj;
}

function downloadBlob(blob: Blob, fileName: string, mime: string, ext: string): boolean {
  try {
    const name = fileName.toLowerCase().endsWith(`.${ext}`) ? fileName : `${fileName}.${ext}`;
    saveAs(blob, name, mime);
    return true;
  } catch {
    return false;
  }
}

function resolveChartElement(chart: EChartsType | null | undefined): HTMLElement | null {
  return (chart?.getDom() as HTMLElement | undefined) ?? null;
}

function readExportToken(el: HTMLElement | null, name: string, fallback: string): string {
  if (!el) {
    return fallback;
  }
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback;
}

function resolveExportTheme(chart: EChartsType | null | undefined): {
  background: string;
  foreground: string;
  muted: string;
  fontFamily: string;
} {
  const el = resolveChartElement(chart);
  return {
    background: resolveChartExportBackground(chart),
    foreground: readExportToken(el, '--pixel-sys-on-surface', '#1a1b1f'),
    muted: readExportToken(el, '--pixel-sys-on-surface-variant', '#44474e'),
    fontFamily: sanitizeSvgFontFamily(
      readExportToken(
        el,
        '--pixel-sys-font-family',
        "'Google Sans', 'Google Sans Text', Roboto, ui-sans-serif, system-ui, sans-serif",
      ),
    ),
  };
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function measureExportChrome(meta: PixelChartExportMeta | undefined): {
  headerHeight: number;
  legendHeight: number;
  legendItems: readonly PixelChartExportLegendItem[];
} {
  const title = meta?.title?.trim() ?? '';
  const description = meta?.description?.trim() ?? '';
  const legendItems = (meta?.legendItems ?? []).filter((item) => item.visible);
  const headerHeight = title || description ? (title && description ? 52 : 32) : 0;
  const legendHeight = legendItems.length > 0 ? 34 : 0;
  return { headerHeight, legendHeight, legendItems };
}

/** Ensure percentage / axis labels are fully opaque in the static export. */
function forceLabelVisibility(root: Element): void {
  root.querySelectorAll('text, tspan').forEach((el) => {
    const fillOp = el.getAttribute('fill-opacity');
    if (fillOp != null && Number.parseFloat(fillOp) < 1) {
      el.setAttribute('fill-opacity', '1');
    }
    const op = el.getAttribute('opacity');
    if (op != null && Number.parseFloat(op) < 1) {
      el.setAttribute('opacity', '1');
    }
  });
}

/** Strip ECharts hover / entrance CSS so the file is a static drawing. */
function stripSvgAnimationStyles(root: Element): void {
  root.querySelectorAll('style').forEach((styleEl) => {
    styleEl.remove();
  });
  root.querySelectorAll('[class]').forEach((el) => {
    el.removeAttribute('class');
  });
}

/**
 * Nest chart SVG children under shell chrome (theme background, title, legend).
 */
function composeSvgFromChartMarkup(
  chartSvgMarkup: string,
  chartWidth: number,
  chartHeight: number,
  theme: ReturnType<typeof resolveExportTheme>,
  meta?: PixelChartExportMeta,
): string {
  const sanitized = sanitizeSvgMarkup(chartSvgMarkup);
  const open = sanitized.match(/<svg\b[^>]*>/i);
  const closeIdx = sanitized.lastIndexOf('</svg>');
  const sourceBody =
    open && closeIdx > open.index!
      ? sanitized.slice(open.index! + open[0].length, closeIdx)
      : sanitized;

  const { headerHeight, legendHeight, legendItems } = measureExportChrome(meta);
  const totalHeight = chartHeight + headerHeight + legendHeight;
  const title = meta?.title?.trim() ?? '';
  const description = meta?.description?.trim() ?? '';

  const parts: string[] = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${chartWidth}" height="${totalHeight}" viewBox="0 0 ${chartWidth} ${totalHeight}">`,
    `<rect width="${chartWidth}" height="${totalHeight}" fill="${theme.background}" />`,
  ];

  if (title) {
    parts.push(
      `<text x="24" y="30" fill="${theme.foreground}" font-family="${theme.fontFamily}" font-size="16" font-weight="600">${escapeXml(title)}</text>`,
    );
  }
  if (description) {
    parts.push(
      `<text x="24" y="${title ? 48 : 30}" fill="${theme.muted}" font-family="${theme.fontFamily}" font-size="12">${escapeXml(description)}</text>`,
    );
  }

  parts.push(`<g transform="translate(0 ${headerHeight})">${sourceBody}</g>`);

  if (legendItems.length > 0) {
    let x = 24;
    const y = headerHeight + chartHeight + 22;
    for (const item of legendItems) {
      parts.push(`<circle cx="${x + 5}" cy="${y - 4}" r="5" fill="${escapeXml(item.color)}" />`);
      parts.push(
        `<text x="${x + 16}" y="${y}" fill="${theme.foreground}" font-family="${theme.fontFamily}" font-size="12">${escapeXml(item.name)}</text>`,
      );
      x += Math.max(88, item.name.length * 8 + 28);
    }
  }

  parts.push(`</svg>`);
  return parts.join('');
}

async function composePngExport(
  chartUrl: string,
  chartWidth: number,
  chartHeight: number,
  fileName: string,
  theme: ReturnType<typeof resolveExportTheme>,
  meta?: PixelChartExportMeta,
): Promise<boolean> {
  const img = new Image();
  img.decoding = 'sync';

  const loaded = new Promise<boolean>((resolve) => {
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
  });
  img.src = chartUrl;
  if (!(await loaded)) {
    return false;
  }

  const { headerHeight, legendHeight, legendItems } = measureExportChrome(meta);
  const canvas = document.createElement('canvas');
  canvas.width = chartWidth * 2;
  canvas.height = (chartHeight + headerHeight + legendHeight) * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return false;
  }

  ctx.scale(2, 2);
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, chartWidth, chartHeight + headerHeight + legendHeight);

  const title = meta?.title?.trim() ?? '';
  const description = meta?.description?.trim() ?? '';
  if (title) {
    ctx.fillStyle = theme.foreground;
    ctx.font = `600 16px ${theme.fontFamily}`;
    ctx.fillText(title, 24, 30);
  }
  if (description) {
    ctx.fillStyle = theme.muted;
    ctx.font = `12px ${theme.fontFamily}`;
    ctx.fillText(description, 24, title ? 48 : 30);
  }

  ctx.drawImage(img, 0, headerHeight, chartWidth, chartHeight);

  if (legendItems.length > 0) {
    let x = 24;
    const y = headerHeight + chartHeight + 22;
    ctx.font = `12px ${theme.fontFamily}`;
    for (const item of legendItems) {
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(x + 5, y - 4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = theme.foreground;
      ctx.fillText(item.name, x + 16, y);
      x += Math.max(88, item.name.length * 8 + 28);
    }
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  return blob ? downloadBlob(blob, fileName, 'image/png', 'png') : false;
}

/**
 * Export the current chart canvas as a PNG download.
 * Background follows the active theme surface (dark / light).
 */
export async function exportChartPng(
  chart: EChartsType | null | undefined,
  fileName = 'chart',
  meta?: PixelChartExportMeta,
): Promise<boolean> {
  if (!chart || typeof document === 'undefined') {
    return false;
  }
  try {
    const backgroundColor = resolveChartExportBackground(chart);
    const url = chart.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor,
    });
    return await composePngExport(
      url,
      Math.max(1, Math.round(chart.getWidth())),
      Math.max(1, Math.round(chart.getHeight())),
      fileName,
      resolveExportTheme(chart),
      meta,
    );
  } catch {
    return false;
  }
}

/**
 * Export chart as a static SVG (no entrance animation).
 * Re-renders with a temporary SVG renderer, then wraps with theme background,
 * shell title, and legend.
 */
export function exportChartSvg(
  chart: EChartsType | null | undefined,
  fileName = 'chart',
  meta?: PixelChartExportMeta,
): boolean {
  if (!chart || typeof document === 'undefined') {
    return false;
  }
  let temp: EChartsType | null = null;
  let host: HTMLDivElement | null = null;
  try {
    ensureSvgRenderer();
    const theme = resolveExportTheme(chart);
    const option = applyExportForeground(
      stripFontFamilyFromOption(chart.getOption()),
      theme.foreground,
    ) as EChartsCoreOption;
    const width = Math.max(1, Math.round(chart.getWidth()));
    const height = Math.max(1, Math.round(chart.getHeight()));

    host = document.createElement('div');
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = `position:fixed;inset-inline-start:-99999px;inline-size:${width}px;block-size:${height}px;pointer-events:none;`;
    document.body.appendChild(host);

    temp = echarts.init(host, undefined, {
      renderer: 'svg',
      width,
      height,
    });
    temp.setOption(
      {
        ...option,
        backgroundColor: theme.background,
        animation: false,
        animationDuration: 0,
        animationDurationUpdate: 0,
      } as EChartsCoreOption,
      { notMerge: true },
    );

    const svgRoot = host.querySelector('svg');
    if (!svgRoot) {
      return false;
    }
    forceLabelVisibility(svgRoot);
    stripSvgAnimationStyles(svgRoot);
    const chartMarkup = new XMLSerializer().serializeToString(svgRoot);
    const svgText = composeSvgFromChartMarkup(
      chartMarkup,
      width,
      height,
      theme,
      meta,
    );
    return downloadBlob(
      new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' }),
      fileName,
      'image/svg+xml',
      'svg',
    );
  } catch {
    return false;
  } finally {
    try {
      temp?.dispose();
    } catch {
      // ignore
    }
    host?.remove();
  }
}
