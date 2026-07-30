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
  if (obj['axisLabel'] && typeof obj['axisLabel'] === 'object') {
    const axisLabel = { ...(obj['axisLabel'] as Record<string, unknown>) };
    if (axisLabel['show'] !== false) {
      axisLabel['color'] = foreground;
      obj['axisLabel'] = axisLabel;
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

async function composeExportCanvas(
  chartUrl: string,
  chartWidth: number,
  chartHeight: number,
  theme: ReturnType<typeof resolveExportTheme>,
  meta?: PixelChartExportMeta,
): Promise<HTMLCanvasElement | null> {
  const img = new Image();
  img.decoding = 'sync';

  const loaded = new Promise<boolean>((resolve) => {
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
  });
  img.src = chartUrl;
  if (!(await loaded)) {
    return null;
  }

  const { headerHeight, legendHeight, legendItems } = measureExportChrome(meta);
  const canvas = document.createElement('canvas');
  canvas.width = chartWidth * 2;
  canvas.height = (chartHeight + headerHeight + legendHeight) * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
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

  return canvas;
}

async function composePngExport(
  chartUrl: string,
  chartWidth: number,
  chartHeight: number,
  fileName: string,
  theme: ReturnType<typeof resolveExportTheme>,
  meta?: PixelChartExportMeta,
): Promise<boolean> {
  const canvas = await composeExportCanvas(chartUrl, chartWidth, chartHeight, theme, meta);
  if (!canvas) {
    return false;
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

function encodeLatin1(text: string): Uint8Array {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    out[i] = text.charCodeAt(i) & 0xff;
  }
  return out;
}

function concatBytes(...parts: readonly Uint8Array[]): Uint8Array {
  let total = 0;
  for (const part of parts) {
    total += part.length;
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/** Read SOF0/SOF2 dimensions from a JPEG bitstream. */
export function readJpegDimensions(jpegBytes: Uint8Array): { width: number; height: number } | null {
  if (jpegBytes.length < 4 || jpegBytes[0] !== 0xff || jpegBytes[1] !== 0xd8) {
    return null;
  }
  let i = 2;
  while (i + 9 < jpegBytes.length) {
    if (jpegBytes[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = jpegBytes[i + 1]!;
    if (marker === 0xd8 || marker === 0xd9) {
      i += 2;
      continue;
    }
    const len = (jpegBytes[i + 2]! << 8) | jpegBytes[i + 3]!;
    if (len < 2 || i + 2 + len > jpegBytes.length) {
      return null;
    }
    if (marker === 0xc0 || marker === 0xc2) {
      const height = (jpegBytes[i + 5]! << 8) | jpegBytes[i + 6]!;
      const width = (jpegBytes[i + 7]! << 8) | jpegBytes[i + 8]!;
      return { width, height };
    }
    i += 2 + len;
  }
  return null;
}

/**
 * Build a minimal single-page PDF that embeds a JPEG image (no jspdf peer).
 * Binary streams are assembled as Uint8Array so JPEG bytes stay intact.
 */
export function buildJpegPdf(
  jpegBytes: Uint8Array,
  widthPx: number,
  heightPx: number,
): Uint8Array {
  const sof = readJpegDimensions(jpegBytes);
  const pageW = Math.max(1, Math.round(sof?.width ?? widthPx));
  const pageH = Math.max(1, Math.round(sof?.height ?? heightPx));

  const objects: Uint8Array[] = [];
  const add = (parts: readonly Uint8Array[]) => {
    objects.push(concatBytes(...parts));
    return objects.length;
  };

  const imageDict = encodeLatin1(
    `<< /Type /XObject /Subtype /Image /Width ${pageW} /Height ${pageH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`,
  );
  const imageObj = add([imageDict, jpegBytes, encodeLatin1('endstream')]);
  const content = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ\n`;
  const contentObj = add([
    encodeLatin1(`<< /Length ${content.length} >>\nstream\n${content}endstream`),
  ]);
  const resourcesObj = add([
    encodeLatin1(`<< /ProcSet [/PDF /ImageC] /XObject << /Im0 ${imageObj} 0 R >> >>`),
  ]);
  const pageObj = add([
    encodeLatin1(
      `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents ${contentObj} 0 R /Resources ${resourcesObj} 0 R >>`,
    ),
  ]);
  const pagesObj = add([
    encodeLatin1(`<< /Type /Pages /Kids [${pageObj} 0 R] /Count 1 >>`),
  ]);
  objects[pageObj - 1] = encodeLatin1(
    `<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents ${contentObj} 0 R /Resources ${resourcesObj} 0 R >>`,
  );
  const catalogObj = add([encodeLatin1(`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`)]);

  const header = encodeLatin1('%PDF-1.4\n');
  const chunks: Uint8Array[] = [header];
  const offsets: number[] = [0];
  let cursor = header.length;
  for (let i = 0; i < objects.length; i++) {
    offsets.push(cursor);
    const objHeader = encodeLatin1(`${i + 1} 0 obj\n`);
    const objFooter = encodeLatin1('\nendobj\n');
    chunks.push(objHeader, objects[i]!, objFooter);
    cursor += objHeader.length + objects[i]!.length + objFooter.length;
  }
  const xrefStart = cursor;
  let xref = `xref\n0 ${objects.length + 1}\n`;
  xref += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObj} 0 R >>\n`;
  xref += `startxref\n${xrefStart}\n%%EOF`;
  chunks.push(encodeLatin1(xref));
  return concatBytes(...chunks);
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(',');
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

/**
 * Export chart as a downloadable PDF.
 * Uses the same composed canvas as PNG (title / description / legend chrome),
 * then JPEG-embeds into a minimal PDF — no `jspdf` peer, no print popup.
 */
export async function exportChartPdf(
  chart: EChartsType | null | undefined,
  fileName = 'chart',
  meta?: PixelChartExportMeta,
): Promise<boolean> {
  if (!chart || typeof document === 'undefined') {
    return false;
  }
  try {
    const backgroundColor = resolveChartExportBackground(chart);
    const chartW = Math.max(1, Math.round(chart.getWidth()));
    const chartH = Math.max(1, Math.round(chart.getHeight()));
    const pngUrl = chart.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor,
    });
    const theme = resolveExportTheme(chart);
    const canvas = await composeExportCanvas(pngUrl, chartW, chartH, theme, meta);
    if (!canvas) {
      return false;
    }
    const jpegUrl = canvas.toDataURL('image/jpeg', 0.95);
    const jpegBytes = dataUrlToBytes(jpegUrl);
    const pdfBytes = buildJpegPdf(jpegBytes, canvas.width, canvas.height);
    const copy = new Uint8Array(pdfBytes.byteLength);
    copy.set(pdfBytes);
    return downloadBlob(
      new Blob([copy], { type: 'application/pdf' }),
      fileName,
      'application/pdf',
      'pdf',
    );
  } catch {
    return false;
  }
}
