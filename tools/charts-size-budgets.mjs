/**
 * Charts family gzip budgets (bytes) measured from modular register entrypoints
 * (esbuild minify + gzip, Angular externalized). Update after intentional
 * ECharts / register changes; keep ~10–15% headroom over last measured sizes.
 *
 * Measured with: `npm run size:charts -- --write`
 */
export const PIXEL_CHART_FAMILY_GZIP_BUDGETS = {
  bar: 230_000,
  line: 230_000,
  area: 230_000,
  pie: 175_000,
  gauge: 210_000,
  scatter: 240_000,
  bubble: 210_000,
  radar: 205_000,
  /** Custom SVG sparkline — must stay tiny (no ECharts). */
  sparkline: 8_000,
};

/**
 * Soft informational cap for the **whole** `pixel-ui` FESM (not charts-only).
 * Reported by size:charts but does **not** fail CI — the library bundle includes
 * non-chart components. Use source-map-explorer for deep dives.
 */
export const PIXEL_CHARTS_BUNDLE_GZIP_BUDGET = 1_200_000;
