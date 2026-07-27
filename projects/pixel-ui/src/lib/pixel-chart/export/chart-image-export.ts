import type { EChartsCoreOption, EChartsType } from 'echarts/core';
import * as echarts from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';
import { saveAs } from '../../services/export/save-as';

let svgRendererRegistered = false;

function ensureSvgRenderer(): void {
  if (svgRendererRegistered) {
    return;
  }
  echarts.use([SVGRenderer]);
  svgRendererRegistered = true;
}

function downloadDataUrl(url: string, fileName: string, mime: string, ext: string): boolean {
  try {
    const comma = url.indexOf(',');
    const payload = comma >= 0 ? url.slice(comma + 1) : url;
    const isBase64 = comma >= 0 && url.slice(0, comma).includes('base64');
    let blob: Blob;
    if (isBase64) {
      const binary = atob(payload);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      blob = new Blob([bytes], { type: mime });
    } else {
      blob = new Blob([decodeURIComponent(payload)], { type: mime });
    }
    const name = fileName.toLowerCase().endsWith(`.${ext}`) ? fileName : `${fileName}.${ext}`;
    saveAs(blob, name, mime);
    return true;
  } catch {
    return false;
  }
}

/**
 * Export the current chart canvas as a PNG download.
 * Requires a live ECharts instance (Canvas renderer).
 */
export function exportChartPng(
  chart: EChartsType | null | undefined,
  fileName = 'chart',
): boolean {
  if (!chart || typeof document === 'undefined') {
    return false;
  }
  try {
    const url = chart.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    });
    return downloadDataUrl(url, fileName, 'image/png', 'png');
  } catch {
    return false;
  }
}

/**
 * Export chart as SVG by re-rendering the live option with a temporary SVG renderer.
 * Does not change the on-screen Canvas instance.
 */
export function exportChartSvg(
  chart: EChartsType | null | undefined,
  fileName = 'chart',
): boolean {
  if (!chart || typeof document === 'undefined') {
    return false;
  }
  let temp: EChartsType | null = null;
  let host: HTMLDivElement | null = null;
  try {
    ensureSvgRenderer();
    const option = chart.getOption() as EChartsCoreOption;
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
    temp.setOption(option, { notMerge: true });
    const url = temp.getDataURL({
      type: 'svg',
      backgroundColor: '#ffffff',
    });
    return downloadDataUrl(url, fileName, 'image/svg+xml', 'svg');
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
