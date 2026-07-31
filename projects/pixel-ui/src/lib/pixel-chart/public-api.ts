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
  PixelChartGridLines,
  PixelChartAxisLines,
  PixelChartPlotPadding,
  PixelChartNumberFormat,
  PixelChartDateFormat,
  PixelChartReferenceLine,
  PixelChartReferenceBand,
  PixelChartAxisPointer,
  PixelChartPalette,
  PixelChartPaletteId,
  PixelChartImageExportFormat,
  PixelChartInteractionSource,
  PixelChartPointClickEvent,
  PixelChartDataZoomEvent,
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
export { ensureMapChart } from './register/map.register';

export { buildBarChartOption } from './builders/bar-option';
export type { PixelChartBarMode, PixelChartBarOrientation } from './builders/bar-option';
export { buildSkeletonBarLayout } from './builders/skeleton-bar-layout';
export {
  buildSkeletonPathLayout,
  buildSkeletonPieLayout,
  buildSkeletonScatterLayout,
  buildSkeletonBubbleLayout,
  buildSkeletonRadarLayout,
  buildSkeletonGaugeLayout,
  buildSkeletonMapLayout,
} from './builders/skeleton-chart-layouts';
export { buildLineChartOption } from './builders/line-option';
export type { PixelChartLineMode } from './builders/line-option';
export { buildAreaChartOption } from './builders/area-option';
export type { PixelChartAreaMode } from './builders/area-option';
export { withDataZoom } from './builders/interaction-option';
export {
  resolveDataZoomMode,
  resolveZoomSelectionEnabled,
  readChartZoomRange,
  resetChartZoom,
  setChartZoomSelectActive,
  zoomRangeToCategoryLabels,
  PIXEL_CHART_ZOOM_CATEGORY_THRESHOLD,
  PIXEL_CHART_ZOOM_POINT_THRESHOLD,
} from './builders/interaction-option';
export type {
  PixelChartDataZoomMode,
  PixelChartZoomSelectionMode,
  PixelChartZoomRange,
} from './builders/interaction-option';
export {
  resolveChartPerformance,
  withSeriesPerformance,
  countCartesianPoints,
  PIXEL_CHART_MAX_POINTS,
  PIXEL_CHART_PROGRESSIVE_THRESHOLD,
  PIXEL_CHART_SAMPLING_THRESHOLD,
  PIXEL_CHART_PROGRESSIVE_CHUNK,
} from './builders/performance-option';
export type {
  PixelChartPerformanceMode,
  PixelChartPerformancePreset,
} from './builders/performance-option';
export {
  formatChartAxisLabel,
  normalizeCategoryLabels,
  toChartTimestamp,
} from './builders/time-axis';
export type { PixelChartAxisValue, PixelChartXAxisType } from './builders/time-axis';
export {
  buildReferenceMarkLine,
  buildReferenceMarkArea,
  withSeriesReferences,
} from './builders/reference-option';
export { withPatternFills, resolvePixelChartDecal } from './builders/pattern-fills';
export type { PixelChartPatternId } from './builders/pattern-fills';
export { connectPixelCharts } from './sync/connect-charts';
export type { PixelChartSyncHandle } from './sync/connect-charts';
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
  buildBubbleHierarchyTable,
  bubbleSeriesToLegendSeries,
  findBubbleHierarchyNode,
} from './builders/bubble-option';
export type {
  PixelChartBubblePoint,
  PixelChartBubbleSeries,
  PixelChartBubbleLayout,
  PixelChartBubbleHierarchyNode,
} from './builders/bubble-option';
export {
  buildRadarChartOption,
  buildRadarTable,
  formatRadarIndicatorName,
} from './builders/radar-option';
export type {
  PixelChartRadarMode,
  PixelChartRadarIndicator,
} from './builders/radar-option';
export {
  buildMapChartOption,
  buildMapTable,
  buildMapPointsTable,
  buildMapLinksTable,
  buildMapSummary,
  mapRegionsToLegendSeries,
  mapPointsToLegendSeries,
  resolveMapLinkCoords,
  PIXEL_CHART_MAP_AUTO_LABEL_MAX_POINTS,
  PIXEL_CHART_MAP_SIZE_RANGE,
  PIXEL_CHART_MAP_DEFAULT_SYMBOLS,
  PIXEL_CHART_MAP_MAX_HEATMAP_POINTS,
  PIXEL_CHART_MAP_MAX_LINKS,
  PIXEL_CHART_MAP_LINE_WIDTH_RANGE,
  PIXEL_CHART_MAP_HEATMAP_BLUR,
  PIXEL_CHART_MAP_HEATMAP_POINT_SIZE,
  PIXEL_CHART_MAP_PROGRESSIVE_THRESHOLD,
  PIXEL_CHART_MAP_APPEARANCE_DEFAULT,
  PIXEL_CHART_MAP_WORLD_GEO_VIEW,
  resolveMapChrome,
} from './builders/map-option';
export type {
  PixelChartMapVariant,
  PixelChartMapRegionKey,
  PixelChartMapValueScale,
  PixelChartMapSizeScale,
  PixelChartMapLineWidthScale,
  PixelChartRegionDatum,
  PixelChartGeoPoint,
  PixelChartMapLink,
  PixelChartMapCoord,
  PixelChartMapAppearance,
  PixelChartMapChrome,
} from './builders/map-option';
export {
  registerPixelChartMap,
  isPixelChartMapRegistered,
} from './builders/map-geo';
export {
  drillLevelsToBreadcrumbItems,
  truncateDrillLevels,
  pushDrillLevel,
} from './builders/chart-drill';
export type {
  PixelChartDrillLevelBase,
  PixelChartDrillLevel,
  PixelChartDrillBreadcrumbData,
  PixelChartDrillBreadcrumbItem,
} from './builders/chart-drill';
export {
  mapDrillLevelsToBreadcrumbItems,
  truncateMapDrillLevels,
  pushMapDrillLevel,
  computeGeoJsonBoundingCoords,
} from './builders/map-drill';
export type {
  PixelChartMapDrillLevel,
  PixelChartMapDrillBreadcrumbData,
  PixelChartMapDrillBreadcrumbItem,
  PixelChartMapGeoView,
} from './builders/map-drill';

export { buildChartSummary } from './a11y/chart-summary';
export { buildChartTable } from './a11y/chart-table';
export type { PixelChartTableColumn, PixelChartTableRow } from './a11y/chart-table';
export { exportChartPng, exportChartsPng, exportChartSvg, exportChartsSvg, exportChartPdf, exportChartsPdf } from './export/chart-image-export';

export { default as PixelChartBarComponent } from '../pixel-chart-bar/pixel-chart-bar';
export { default as PixelChartLineComponent } from '../pixel-chart-line/pixel-chart-line';
export { default as PixelChartAreaComponent } from '../pixel-chart-area/pixel-chart-area';
export { default as PixelChartPieComponent } from '../pixel-chart-pie/pixel-chart-pie';
export { default as PixelChartGaugeComponent } from '../pixel-chart-gauge/pixel-chart-gauge';
export { default as PixelChartScatterComponent } from '../pixel-chart-scatter/pixel-chart-scatter';
export { default as PixelChartBubbleComponent } from '../pixel-chart-bubble/pixel-chart-bubble';
export { default as PixelChartRadarComponent } from '../pixel-chart-radar/pixel-chart-radar';
export { default as PixelChartMapComponent } from '../pixel-chart-map/pixel-chart-map';
export type {
  PixelChartRegionClickEvent,
  PixelChartMapPointClickEvent,
  PixelChartMapLinkClickEvent,
} from '../pixel-chart-map/pixel-chart-map';
export { default as PixelChartSparklineComponent } from '../pixel-chart-sparkline/pixel-chart-sparkline';
export { buildSparklinePath } from '../pixel-chart-sparkline/pixel-chart-sparkline';
export type {
  PixelChartSparklineVariant,
  PixelChartSparklineTone,
} from '../pixel-chart-sparkline/pixel-chart-sparkline';
export { default as PixelChartShellComponent } from '../pixel-chart-shell/pixel-chart-shell';
export type {
  PixelChartShellAppearance,
  PixelChartLegendItem,
  PixelChartLegendToggleEvent,
} from '../pixel-chart-shell/pixel-chart-shell';
