import type { EChartsCoreOption, EChartsType } from 'echarts/core';
import type { PixelChartSeries } from '../pixel-chart.types';

export type PixelChartDataZoomMode =
  | boolean
  | 'inside'
  | 'slider'
  | 'both'
  | 'selection';

/** Shell / plot zoomSelection input. */
export type PixelChartZoomSelectionMode = boolean | 'auto';

export const PIXEL_CHART_ZOOM_CATEGORY_THRESHOLD = 24;
export const PIXEL_CHART_ZOOM_POINT_THRESHOLD = 50;

export type PixelChartZoomRange = {
  readonly start: number;
  readonly end: number;
  /** True when not full-range (0–100). */
  readonly zoomed: boolean;
};

/**
 * Resolve whether zoom-selection chrome should appear (shell).
 * `auto` → large category count or large point count.
 */
export function resolveZoomSelectionEnabled(
  mode: PixelChartZoomSelectionMode,
  categories: readonly string[],
  series: readonly PixelChartSeries[],
  categoryThreshold = PIXEL_CHART_ZOOM_CATEGORY_THRESHOLD,
  pointThreshold = PIXEL_CHART_ZOOM_POINT_THRESHOLD,
): boolean {
  if (mode === true) {
    return true;
  }
  if (mode === false) {
    return false;
  }
  if (categories.length >= categoryThreshold) {
    return true;
  }
  let points = 0;
  for (const s of series) {
    points += s.data.length;
  }
  return points >= pointThreshold;
}

/**
 * Resolve plot `dataZoom` when set to `'auto'` (or omitted with auto semantics).
 * Large data → `'selection'` (slider + select-zoom + pan).
 */
export function resolveDataZoomMode(
  mode: PixelChartDataZoomMode | 'auto' | undefined,
  dataSize: number,
  threshold = PIXEL_CHART_ZOOM_CATEGORY_THRESHOLD,
): PixelChartDataZoomMode {
  if (mode === 'auto') {
    return dataSize >= threshold ? 'selection' : false;
  }
  if (mode == null) {
    return false;
  }
  return mode;
}

/** Read current dataZoom window (percent). */
export function readChartZoomRange(chart: EChartsType | null | undefined): PixelChartZoomRange {
  if (!chart) {
    return { start: 0, end: 100, zoomed: false };
  }
  const opt = chart.getOption() as { dataZoom?: unknown };
  const raw = opt.dataZoom;
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  for (const item of list) {
    const z = item as { start?: number; end?: number; type?: string };
    if (z && typeof z.start === 'number' && typeof z.end === 'number') {
      const start = z.start;
      const end = z.end;
      return {
        start,
        end,
        zoomed: start > 0.5 || end < 99.5,
      };
    }
  }
  return { start: 0, end: 100, zoomed: false };
}

/** Map a percent window onto category labels (inclusive). */
export function zoomRangeToCategoryLabels(
  categories: readonly string[],
  startPct: number,
  endPct: number,
): { startLabel: string; endLabel: string } | null {
  if (categories.length === 0) {
    return null;
  }
  const last = categories.length - 1;
  const startIdx = Math.max(0, Math.min(last, Math.round((startPct / 100) * last)));
  const endIdx = Math.max(startIdx, Math.min(last, Math.round((endPct / 100) * last)));
  return {
    startLabel: categories[startIdx]!,
    endLabel: categories[endIdx]!,
  };
}

/** Enable / disable ECharts dataZoom-select cursor (hidden toolbox). */
export function setChartZoomSelectActive(
  chart: EChartsType | null | undefined,
  active: boolean,
): void {
  if (!chart) {
    return;
  }
  try {
    chart.dispatchAction({
      type: 'takeGlobalCursor',
      key: 'dataZoomSelect',
      dataZoomSelectActive: active,
    });
  } catch {
    // Toolbox / dataZoom select not registered.
  }
}

/** Reset to full range and exit select cursor. */
export function resetChartZoom(chart: EChartsType | null | undefined): void {
  if (!chart) {
    return;
  }
  try {
    chart.dispatchAction({
      type: 'dataZoom',
      start: 0,
      end: 100,
    });
  } catch {
    // ignore
  }
  setChartZoomSelectActive(chart, false);
}

/**
 * Merge dataZoom (+ optional hidden select-zoom toolbox) into a cartesian option.
 */
export function withDataZoom(
  option: EChartsCoreOption,
  zoomMode: PixelChartDataZoomMode | undefined = false,
): EChartsCoreOption {
  if (!zoomMode) {
    return option;
  }

  const next: Record<string, unknown> = { ...(option as Record<string, unknown>) };
  const zooms: Record<string, unknown>[] = [];
  const selection = zoomMode === 'selection';
  const wantInside =
    zoomMode === true || zoomMode === 'inside' || zoomMode === 'both' || selection;
  const wantSlider = zoomMode === 'slider' || zoomMode === 'both' || selection;

  if (wantInside) {
    zooms.push({
      type: 'inside',
      xAxisIndex: 0,
      filterMode: 'none',
      zoomOnMouseWheel: !selection,
      moveOnMouseMove: true,
      moveOnMouseWheel: false,
    });
  }

  if (wantSlider) {
    zooms.push({
      type: 'slider',
      xAxisIndex: 0,
      height: 22,
      bottom: 8,
      left: 48,
      right: 32,
      filterMode: 'none',
      brushSelect: false,
      showDetail: true,
      showDataShadow: true,
      handleSize: '120%',
      handleStyle: {
        color: '#1565c0',
        borderColor: '#1565c0',
      },
      moveHandleStyle: {
        color: '#1565c0',
        opacity: 1,
      },
      borderColor: 'rgba(116, 119, 127, 0.35)',
      fillerColor: 'rgba(21, 101, 192, 0.18)',
      backgroundColor: 'rgba(116, 119, 127, 0.08)',
      dataBackground: {
        lineStyle: { color: 'rgba(116, 119, 127, 0.35)', width: 1 },
        areaStyle: { color: 'rgba(116, 119, 127, 0.12)' },
      },
      selectedDataBackground: {
        lineStyle: { color: 'rgba(21, 101, 192, 0.65)', width: 1 },
        areaStyle: { color: 'rgba(21, 101, 192, 0.22)' },
      },
      textStyle: { color: 'rgba(116, 119, 127, 0.9)', fontSize: 11 },
    });
    const grid = (next['grid'] as Record<string, unknown> | undefined) ?? {};
    next['grid'] = {
      ...grid,
      bottom: Math.max(Number(grid['bottom'] ?? 40), 72),
    };
  }

  if (selection) {
    // Hidden toolbox — Pixel shell toggles select via takeGlobalCursor.
    next['toolbox'] = {
      show: false,
      feature: {
        dataZoom: {
          yAxisIndex: 'none',
          brushStyle: {
            color: 'rgba(21, 101, 192, 0.18)',
            borderWidth: 1,
            borderColor: 'rgba(21, 101, 192, 0.65)',
          },
        },
      },
    };
  }

  next['dataZoom'] = zooms;
  return next as EChartsCoreOption;
}
