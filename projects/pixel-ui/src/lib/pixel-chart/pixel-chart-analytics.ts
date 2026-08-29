import type { PixelUiAnalyticsPort } from '../shared/analytics/pixel-ui-analytics';
import { emitPixelUiAnalytics } from '../shared/analytics/pixel-ui-analytics';

export interface PixelChartPointClickAnalytics {
  readonly chartId?: string;
  readonly seriesId: string;
  readonly categoryIndex: number;
  readonly chartType: string;
}

/** Emits a privacy-safe chart point interaction without labels or point values. */
export function emitChartPointClick(
  port: PixelUiAnalyticsPort | null | undefined,
  event: PixelChartPointClickAnalytics,
): void {
  const chartId = event.chartId?.trim();
  emitPixelUiAnalytics(port, {
    name: 'ui.chart.point_click',
    component: `pixel-chart-${event.chartType}`,
    reserved: {
      ...(chartId ? { chartId } : {}),
      seriesId: event.seriesId,
      categoryIndex: event.categoryIndex,
      chartType: event.chartType,
    },
  });
}
