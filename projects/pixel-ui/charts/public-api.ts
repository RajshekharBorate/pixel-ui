/**

 * Workspace / package alias for `pixel-ui/charts` (editor-style entry).

 */



export {

  PixelChartHostComponent,

  buildPixelChartEChartsTheme,

  resolvePixelChartPaletteColors,

  PIXEL_CHART_PALETTE_BRAND,

  PIXEL_CHART_PALETTE_VIBRANT,

  PIXEL_CHART_PALETTE_COOL,

  PIXEL_CHART_PALETTE_WARM,

  ensureBarChart,

  ensureLineChart,

  ensureAreaChart,

  ensurePieChart,

  ensureGaugeChart,

  ensureScatterChart,

  ensureBubbleChart,

  ensureRadarChart,

  ensureMapChart,

  buildBarChartOption,

  buildLineChartOption,

  buildAreaChartOption,
  buildReferenceMarkLine,
  buildReferenceMarkArea,
  withSeriesReferences,

  withDataZoom,

  resolveDataZoomMode,

  resolveZoomSelectionEnabled,

  readChartZoomRange,

  resetChartZoom,

  setChartZoomSelectActive,

  zoomRangeToCategoryLabels,

  PIXEL_CHART_ZOOM_CATEGORY_THRESHOLD,

  PIXEL_CHART_ZOOM_POINT_THRESHOLD,

  resolveChartPerformance,

  withSeriesPerformance,

  countCartesianPoints,

  PIXEL_CHART_MAX_POINTS,

  PIXEL_CHART_PROGRESSIVE_THRESHOLD,

  PIXEL_CHART_SAMPLING_THRESHOLD,

  PIXEL_CHART_PROGRESSIVE_CHUNK,

  formatChartAxisLabel,

  normalizeCategoryLabels,

  toChartTimestamp,

  buildPieChartOption,

  buildPieTable,

  pieSlicesToLegendSeries,

  buildGaugeChartOption,

  buildScatterChartOption,

  buildScatterStats,

  buildScatterTable,

  PIXEL_CHART_STATS_MAX_N,

  computeScatterStats,

  buildBubbleChartOption,

  buildBubbleTable,

  buildBubbleHierarchyTable,

  bubbleSeriesToLegendSeries,

  findBubbleHierarchyNode,

  buildRadarChartOption,

  buildRadarTable,

  formatRadarIndicatorName,

  buildMapChartOption,

  buildMapTable,

  buildMapSummary,

  mapRegionsToLegendSeries,

  buildMapPointsTable,

  buildMapLinksTable,

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

  registerPixelChartMap,

  isPixelChartMapRegistered,

  mapDrillLevelsToBreadcrumbItems,

  truncateMapDrillLevels,

  pushMapDrillLevel,

  computeGeoJsonBoundingCoords,

  drillLevelsToBreadcrumbItems,

  truncateDrillLevels,

  pushDrillLevel,

  buildChartSummary,

  buildChartTable,

  withPatternFills,

  resolvePixelChartDecal,

  connectPixelCharts,

  exportChartPng,

  exportChartsPng,

  exportChartSvg,

  exportChartsSvg,

  exportChartPdf,

  exportChartsPdf,

  buildSparklinePath,

  PixelChartBarComponent,

  PixelChartLineComponent,

  PixelChartAreaComponent,

  PixelChartPieComponent,

  PixelChartGaugeComponent,

  PixelChartScatterComponent,

  PixelChartBubbleComponent,

  PixelChartRadarComponent,

  PixelChartMapComponent,

  PixelChartSparklineComponent,

  PixelChartShellComponent,

} from '../src/lib/pixel-chart/public-api';



export type {

  PixelChartHostReadyEvent,

  PixelChartAnimationMode,

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

  PixelChartBarMode,

  PixelChartBarOrientation,

  PixelChartLineMode,

  PixelChartAreaMode,

  PixelChartDataZoomMode,

  PixelChartZoomSelectionMode,

  PixelChartZoomRange,

  PixelChartPerformanceMode,

  PixelChartPerformancePreset,

  PixelChartAxisValue,

  PixelChartXAxisType,

  PixelChartPatternId,

  PixelChartPieMode,

  PixelChartPieSlice,

  PixelChartGaugeVariant,

  PixelChartGaugeRange,

  PixelChartRegressionStats,

  PixelChartBubblePoint,

  PixelChartBubbleSeries,

  PixelChartBubbleLayout,

  PixelChartBubbleHierarchyNode,

  PixelChartRadarMode,

  PixelChartRadarIndicator,

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

  PixelChartMapDrillLevel,

  PixelChartMapDrillBreadcrumbData,

  PixelChartMapDrillBreadcrumbItem,

  PixelChartMapGeoView,

  PixelChartDrillLevelBase,

  PixelChartDrillLevel,

  PixelChartDrillBreadcrumbData,

  PixelChartDrillBreadcrumbItem,

  PixelChartRegionClickEvent,

  PixelChartMapPointClickEvent,

  PixelChartMapLinkClickEvent,

  PixelChartSyncHandle,

  PixelChartTableColumn,

  PixelChartTableRow,

  PixelChartLegendItem,

  PixelChartLegendToggleEvent,

  PixelChartShellAppearance,

  PixelChartSparklineVariant,

  PixelChartSparklineTone,

} from '../src/lib/pixel-chart/public-api';

