import type { EChartsCoreOption } from 'echarts/core';

export type PixelChartDataZoomMode = boolean | 'inside' | 'slider' | 'both';

/**
 * Merge optional dataZoom into a cartesian option.
 * Brush / toolbox selection is not supported.
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
  const wantInside = zoomMode === true || zoomMode === 'inside' || zoomMode === 'both';
  const wantSlider = zoomMode === 'slider' || zoomMode === 'both';

  if (wantInside) {
    zooms.push({
      type: 'inside',
      xAxisIndex: 0,
      filterMode: 'none',
    });
  }
  if (wantSlider) {
    zooms.push({
      type: 'slider',
      xAxisIndex: 0,
      height: 18,
      bottom: 4,
      filterMode: 'none',
      brushSelect: false,
    });
    const grid = (next['grid'] as Record<string, unknown> | undefined) ?? {};
    next['grid'] = {
      ...grid,
      bottom: Math.max(Number(grid['bottom'] ?? 40), 48),
    };
  }

  next['dataZoom'] = zooms;
  return next as EChartsCoreOption;
}
