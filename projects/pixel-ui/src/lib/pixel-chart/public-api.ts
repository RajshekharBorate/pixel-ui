/**
 * Public surface for `pixel-ui/charts`.
 * Keep ECharts-backed symbols here — prefer this path over the root barrel.
 */

export { default as PixelChartHostComponent } from './pixel-chart-host';
export type {
  PixelChartHostReadyEvent,
  PixelChartAnimationMode,
} from './pixel-chart-host';

export {
  buildPixelChartEChartsTheme,
  resolvePixelChartPaletteColors,
  PIXEL_CHART_PALETTE_BRAND,
  PIXEL_CHART_PALETTE_VIBRANT,
  PIXEL_CHART_PALETTE_COOL,
  PIXEL_CHART_PALETTE_WARM,
} from './pixel-chart-theme';

export type {
  PixelChartPoint,
  PixelChartSeries,
  PixelChartShowValues,
  PixelChartPalette,
  PixelChartPaletteId,
  PixelChartImageExportFormat,
  PixelChartInteractionSource,
  PixelChartPointClickEvent,
  PixelChartEChartsTheme,
} from './pixel-chart.types';

export { ensureBarChart } from './register/bar.register';
export { ensureLineChart } from './register/line.register';
export { ensureAreaChart } from './register/area.register';
export { ensurePieChart } from './register/pie.register';
export { ensureGaugeChart } from './register/gauge.register';
export { ensureScatterChart } from './register/scatter.register';
export { ensureBubbleChart } from './register/bubble.register';
export { ensureRadarChart } from './register/radar.register';

export { buildBarChartOption } from './builders/bar-option';
export type { PixelChartBarMode, PixelChartBarOrientation } from './builders/bar-option';
export { buildLineChartOption } from './builders/line-option';
export type { PixelChartLineMode } from './builders/line-option';
export { buildAreaChartOption } from './builders/area-option';
export type { PixelChartAreaMode } from './builders/area-option';
export {
  buildPieChartOption,
  buildPieTable,
  pieSlicesToLegendSeries,
} from './builders/pie-option';
export type { PixelChartPieMode, PixelChartPieSlice } from './builders/pie-option';
export { buildGaugeChartOption } from './builders/gauge-option';
export type {
  PixelChartGaugeVariant,
  PixelChartGaugeRange,
} from './builders/gauge-option';
export {
  buildScatterChartOption,
  buildScatterStats,
  buildScatterTable,
} from './builders/scatter-option';
export type { PixelChartRegressionStats } from './builders/scatter-option';
export { PIXEL_CHART_STATS_MAX_N, computeScatterStats } from './builders/scatter-stats';
export {
  buildBubbleChartOption,
  buildBubbleTable,
  bubbleSeriesToLegendSeries,
} from './builders/bubble-option';
export type {
  PixelChartBubblePoint,
  PixelChartBubbleSeries,
} from './builders/bubble-option';
export { buildRadarChartOption, buildRadarTable } from './builders/radar-option';
export type {
  PixelChartRadarMode,
  PixelChartRadarIndicator,
} from './builders/radar-option';

export { buildChartSummary } from './a11y/chart-summary';
export { buildChartTable } from './a11y/chart-table';
export type { PixelChartTableColumn, PixelChartTableRow } from './a11y/chart-table';
export { exportChartPng, exportChartSvg } from './export/chart-image-export';

export { default as PixelChartBarComponent } from '../pixel-chart-bar/pixel-chart-bar';
export { default as PixelChartLineComponent } from '../pixel-chart-line/pixel-chart-line';
export { default as PixelChartAreaComponent } from '../pixel-chart-area/pixel-chart-area';
export { default as PixelChartPieComponent } from '../pixel-chart-pie/pixel-chart-pie';
export { default as PixelChartGaugeComponent } from '../pixel-chart-gauge/pixel-chart-gauge';
export { default as PixelChartScatterComponent } from '../pixel-chart-scatter/pixel-chart-scatter';
export { default as PixelChartBubbleComponent } from '../pixel-chart-bubble/pixel-chart-bubble';
export { default as PixelChartRadarComponent } from '../pixel-chart-radar/pixel-chart-radar';
export { default as PixelChartShellComponent } from '../pixel-chart-shell/pixel-chart-shell';
export type {
  PixelChartLegendItem,
  PixelChartLegendToggleEvent,
} from '../pixel-chart-shell/pixel-chart-shell';
