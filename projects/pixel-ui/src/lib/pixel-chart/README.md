# pixel-chart (core) — `pixel-ui/charts`

Shared ECharts host, theme bridge, and modular series registration for Pixel charts.

> **Install**
>
> ```bash
> npm i echarts
> ```
>
> ```ts
> // Preferred in this workspace (tsconfig path)
> import {
>   PixelChartHostComponent,
>   ensureBarChart,
>   ensureLineChart,
> } from 'pixel-ui/charts';
>
> // Also available from `pixel-ui` — primary barrel still re-exports charts until
> // ng-packagr secondary FESM entries compile (Angular `referencedFiles` bug).
> ```

## Overview

Phase 0 foundation for the chart system:

- `pixel-chart-host` — Canvas ECharts lifecycle (init / setOption / resize / dispose)
- `pixel-chart-theme` — maps `--pixel-sys-*` → ECharts theme + palettes
- `ensureBarChart` / `ensureLineChart` / `ensureAreaChart` / `ensurePieChart` /
  `ensureGaugeChart` / `ensureScatterChart` / `ensureBubbleChart` / `ensureRadarChart`
  — tree-shaken `echarts/core` registrations
- Public facades: bar · line · area · pie · gauge · scatter · bubble · radar · sparkline · shell
  (Phases 0–3 complete)

## Packaging (Phase 0)

| Item | Choice |
|------|--------|
| Import path | `pixel-ui/charts` (tsconfig / package alias) |
| Peer | `echarts` optional (not needed for sparkline) |
| Secondary ng-packagr entry | Deferred (packagr 21 build error) — revisit later; deep `charts/bar` skipped |
| Renderer | Canvas default; sparkline = custom SVG |

## Performance

| Concern | Behavior |
|---------|----------|
| `performance` input | `'auto' \| 'off' \| 'progressive' \| 'sampled'` on line/area/bar/scatter |
| Auto progressive | ≥ `PIXEL_CHART_PROGRESSIVE_THRESHOLD` (2 000 points) |
| Auto LTTB sampling | ≥ `PIXEL_CHART_SAMPLING_THRESHOLD` (5 000) — line/area only |
| Recommended max | `PIXEL_CHART_MAX_POINTS` (line/area 10k, bar 5k, scatter 20k, …) |
| Docs stress page | Chart — Line → **Performance (1k / 10k)** example |
| Bundle CI | `npm run size:charts` + `lint:echarts-import` (see `tools/CHARTS-SIZE.md`) |

## Time axis

Line charts accept `xAxisType="time"` with `Date` / timestamp categories. When
`provideNativeDateAdapter()` (or another `PixelDateAdapter`) is in the injector,
axis labels use the adapter; otherwise `Intl.DateTimeFormat`.

## Sparklines

`pixel-chart-sparkline` is **custom SVG without ECharts** (Phase 3 decision).

## Virtualized data tables

Inline chart tables were removed from the shell (CSV export only). Virtualization is
therefore N/A — use `pixel-data-grid` if you need a virtualized data view alongside charts.

## Use cases

- Advanced apps that build raw ECharts options and need Pixel theming
- Internal composition target for `pixel-chart-bar` / `pixel-chart-line` / …

## Tree-shake rules (required)

1. **Never** `import … from 'echarts'` or `echarts/dist/echarts.js` (full build).
   CI: `npm run lint:echarts-import`.
2. Use `echarts/core` + `echarts/charts` + `echarts/components` + `echarts/renderers`.
3. Call the matching `ensure*Chart()` before `setOption` with that series type.
4. Prefer importing only the chart family you need once facades ship.
5. Helpers: `withDataZoom`, `withPatternFills`, `connectPixelCharts`,
   `exportChartPdf` (same title/legend chrome as PNG), `resolveChartPerformance`.
6. Size budgets: `npm run size:charts` (budgets in `tools/charts-size-budgets.mjs`).
   Explore: `npx source-map-explorer dist/pixel-ui/fesm2022/*.mjs` after build.

### Size spike (esbuild minify + gzip, ECharts 6.1)

| Bundle | Approx gzip |
|--------|-------------|
| Modular bar register | ~171 KB |
| Modular line register | ~173 KB |
| Full `echarts` entry | ~375 KB |
| Sparkline (SVG sources) | ≪ 8 KB budget |

## Renderer

| Use | Renderer |
|-----|----------|
| Default | **Canvas** (`CanvasRenderer`) |
| SVG export | Phase 1c+ (temporary SVG renderer / export helper) |

## Accessibility

Host uses `role="img"` and requires a meaningful `ariaLabel` (or described-by) when used without shell title. Loading sets `aria-busy`.

## Plot tooltip

Plot hover uses **ECharts’ built-in tooltip** (canvas cursor + multi-series formatters).
`pixelTooltip` is not used on the plot — that directive is host-bound for chrome labels.

Chrome is styled to match `pixel-tooltip`’s **inverse** theme: on-surface fill,
surface text, corner-small radius, elevation-1 shadow, and label-sm typography
(see `styles/_tooltip.scss`). Shell action buttons still use real `pixelTooltip`.

Theme tokens are resolved from `document.documentElement` when it carries `data-theme`
(nested scoped `[data-theme]` panels still win). Chart hosts track `pixelThemeVersion`
(from `applyPixelTheme`) in an Angular `effect` so axis labels, series labels, and plot
tooltips stay in sync on light/dark toggles. `themeVersion` input remains for tests /
rare local bumps; prefer the library theme API in apps.

## Behavior notes

- **Imports:** always `import { … } from 'pixel-ui/charts'` (not the main `pixel-ui` barrel) so
  button-only apps never parse ECharts facades.
- **App delivery:** wrap below-the-fold charts in `@defer (on viewport)` with a sized
  `@placeholder` matching plot height to protect CLS:
  ```html
  @defer (on viewport) {
    <pixel-chart-line … />
  } @placeholder {
    <div style="block-size: 20rem" aria-hidden="true"></div>
  }
  ```
- **Dual Y-axis:** the facade APIs intentionally expose one value axis. Use
  `pixel-chart-host` with a raw ECharts `option` for a secondary Y-axis or other advanced
  ECharts fields.
- **Dashboard sync:** set the same non-empty `syncGroup` on compatible cartesian facades to
  link ECharts interactions across their hosts.
- **Drill-down (consumer-owned):** charts emit typed clicks only — apps own the level
  stack and rebind data (and may **change facade type** per level, e.g. pie → bar, or
  drive **multiple facades** from one stack). Shared helpers: `pushDrillLevel`,
  `truncateDrillLevels`, `drillLevelsToBreadcrumbItems` (`builders/chart-drill.ts`).
  Map keeps geo-specific aliases (`pushMapDrillLevel`, …) plus
  `computeGeoJsonBoundingCoords`. Pack bubbles: `findBubbleHierarchyNode`.
  Chrome: `[pixelChartHeader]` + `pixel-breadcrumb` + shell `exportBreadcrumb`; hide
  breadcrumb at root. Set facade / host `drillable` for a pointer cursor.
  Keyboard: breadcrumb for drill-up; canvas click is pointer-oriented.
  | Family | Typical drill | Notes |
  |--------|---------------|--------|
  | Map choropleth/area | Region → child GeoJSON | Map helpers |
  | Bar / line / area | Category / bucket → child series | Docs: bar `drilldown` |
  | Pie / donut | Slice → child chart | Docs: pie `drilldown` (→ bar) |
  | Bubble pack | Group → children hierarchy | Docs: bubble `drilldown` |
  | Linked facades | Shared stack | Docs: bar `linked-drilldown` |
  | Scatter / radar | Point / series | Selective |
  | Gauge / sparkline | — | No click API |
- **Formatting precedence:** `valueFormat` is the advanced formatter for labels and tooltips.
  `valueSuffix` remains the shorthand fallback; a suffix inside `valueFormat` takes precedence.
- **Legend hide / series colors:** builders assign palette colors by each series’ (or slice’s)
  index in the **full** input list (or an explicit `color`), not by “nth currently visible”
  item. Toggling shell legend items must not reshuffle colors on remaining series.
- **Per-point bar colors:** optional `PixelChartPoint.color` paints individual bars in a
  single series (useful when a categorical legend is shared with pie / map).
- **`showSkeleton` (primary on facades):** bind `[showSkeleton]` on the chart component
  (same pattern as `pixel-select`). The host fills the plot height with
  `pixel-skeleton preset="chart"` and a family silhouette, sets `aria-busy` /
  `data-skeleton`, and skips ECharts until cleared. Facades forward family-specific
  silhouette inputs and data-driven layouts so stubs match live proportions:
  bar (`skeletonBarLayout` / mode / orientation), line & area (`skeletonPathLayout`),
  pie (`skeletonPieLayout`), scatter & bubble (`skeletonPointsLayout`), radar
  (`skeletonRadarLayout`), map (`skeletonMapLayout`). Gauge keeps a simple decorative
  silhouette (not data/variant-driven).
- **Shell `showSkeleton` (legend stubs):** bind the **same** flag on the shell so legend
  chips skeleton while the plot skeletons. When both clear, legend + chart appear together.
  Shell no longer replaces the plot slot. Sparkline has no skeleton API.

## Theme customization

Theme is derived at runtime from CSS variables on the host (or ancestor). Component token:

Cartesian, polar, and radar grid lines use a 0.5 px stroke with the outline-variant token
at reduced opacity so numeric guides remain visible without competing with the data.
Cartesian X/Y axis baselines are explicitly visible; an individual raw option can still
disable one with `axisLine.show: false`.

| Token | Default role |
|-------|----------------|
| `--pixel-chart-plot-min-block-size` | Plot block size (also set from `height` input) |
| `--pixel-chart-grid-opacity` | Grid-line opacity |
| `--pixel-chart-grid-width` | Grid-line stroke width |
| `--pixel-chart-axis-line-color` | Cartesian axis baseline color |
| `--pixel-chart-line-width` | Default line-series stroke width |
| `--pixel-chart-area-opacity` | Default area-series fill opacity |

## Breaking changes

- Removed host `brushEnd` output and brush toolbox registration.
- Replaced public helper `withBrushAndZoom` with `withDataZoom`.
- Removed types `PixelChartBrushMode` / `PixelChartBrushEndEvent`.

<!-- API-CONTRACT:START — generated by tools/generate-readme-api.mjs. Do NOT edit between these markers; run `npm run readme:api` instead. -->

## API contract

_Machine-generated from the component source. This is the behavioral API surface: any change
to it is a **breaking-change candidate** and must be deliberate. After modifying this
component, run `npm run readme:api` and review this section's diff as a regression check._

### Component `pixel-chart-host` (`PixelChartHostComponent`)

Low-level ECharts host: init / setOption / resize / dispose. Chart families compose this; apps rarely use it alone. Call `ensureBarChart()` / `ensureLineChart()` (or future registers) before passing options that need those series types.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `option` | `EChartsCoreOption | null` | `null` | ECharts option object (modular series must be registered first). |
| `palette` | `PixelChartPalette` | `'brand'` | Series color palette (named or explicit hex list). |
| `ariaLabel` | `string` | `''` | Accessible name for the plot region. |
| `ariaDescribedBy` | `string` | `''` | Extra `aria-describedby` ids (merged by consumers with internal status ids). |
| `id` | `string` | `''` | Optional id override. |
| `height` | `string | number` | `'280px'` | Plot block size (CSS length or number of pixels). |
| `animation` | `PixelChartAnimationMode` | `'auto'` | Animation: `auto` honors `prefers-reduced-motion`. |
| `loading` | `boolean` | `false` | Marks the host busy (ARIA); does not render chrome — use shell for loader UI. |
| `showSkeleton` | `boolean` | `false` | Replace the plot with a type-specific `pixel-skeleton` (no ECharts instance). Primary loading API — bind on the facade like `pixel-select` `showSkeleton`. Prefer this over shell `showSkeleton` whenever the plot is projected. |
| `skeletonVariant` | `PixelSkeletonChartVariant` | `'bar'` | Silhouette for the plot skeleton (`preset="chart"`). Facades set this to their family. |
| `skeletonBarMode` | `PixelSkeletonChartBarMode` | `'grouped'` | Bar layout silhouette when `skeletonVariant` is `bar` (mirrors facade `mode`). |
| `skeletonBarOrientation` | `PixelSkeletonChartBarOrientation` | `'vertical'` | Bar direction silhouette when `skeletonVariant` is `bar` (mirrors facade `orientation`). |
| `skeletonBarLayout` | `PixelSkeletonBarLayout | null` | `null` | Data-driven bar sizes for the plot skeleton (from facade series). When set, stubs match live proportions; when `null`, decorative placeholders are used. |
| `skeletonPieMode` | `PixelSkeletonChartPieMode` | `'donut'` | Pie / donut / semi mode for the plot skeleton. |
| `skeletonBubbleLayout` | `'cartesian' | 'pack'` | `'cartesian'` | Bubble layout for the plot skeleton (`cartesian` \| `pack`). |
| `skeletonPathMode` | `'straight' | 'smooth' | 'step'` | `'straight'` | Line path mode for the plot skeleton (`straight` \| `smooth` \| `step`). |
| `skeletonPathLayout` | `PixelSkeletonPathLayout | null` | `null` | Data-driven line / area path for the plot skeleton. |
| `skeletonPieLayout` | `PixelSkeletonPieLayout | null` | `null` | Data-driven pie segments for the plot skeleton. |
| `skeletonPointsLayout` | `PixelSkeletonPointsLayout | null` | `null` | Data-driven scatter / bubble markers for the plot skeleton. |
| `skeletonRadarLayout` | `PixelSkeletonRadarLayout | null` | `null` | Data-driven radar radii for the plot skeleton. |
| `skeletonMapLayout` | `PixelSkeletonMapLayout | null` | `null` | Data-driven map intensities for the plot skeleton. |
| `themeVersion` | `number` | `0` | Optional local theme bump (tests / rare overrides). Prefer `applyPixelTheme()` — chart hosts already track `pixelThemeVersion` from the library theme API. |
| `syncGroup` | `string` | `''` | ECharts connect group id for multi-chart axis / dataZoom sync. Charts that share the same non-empty string stay linked. Prefer this over calling `connectPixelCharts` when plots are owned by facades. |
| `drillable` | `boolean` | `false` | Pointer cursor on the plot — use when clicks drill or navigate. Does not change hit-testing; apps still own drill logic. |

**Outputs**

| Output | Payload | Description |
| --- | --- | --- |
| `chartReady` | `PixelChartHostReadyEvent` | Fires once after the ECharts instance is created. |
| `chartClick` | `unknown` | Native ECharts click payloads (series / point). |
| `dataZoom` | `PixelChartDataZoomEvent` | dataZoom range changed. |

### Exported types

| Type | Definition |
| --- | --- |
| `PixelChartAnimationMode` | `boolean | 'auto'` |
| `PixelChartHostReadyEvent` | `{ readonly chart: EChartsType; }` |
| `PixelChartPoint` | `{ readonly x: string | number | Date; readonly y: number | null; readonly size?: number; readonly label?: string; /** Optional per-point color (e.g. single-series bars matching a categorical legend). */ readonly color?: string; }` |
| `PixelChartSeries` | `{ readonly id: string; readonly name: string; readonly data: readonly PixelChartPoint[] | readonly number[]; readonly color?: string; }` |
| `PixelChartShowValues` | `boolean | 'auto'` |
| `PixelChartGridLines` | `'on' | 'off' | 'x' | 'y'` |
| `PixelChartAxisLines` | `'on' | 'off' | 'x' | 'y'` |
| `PixelChartPlotPadding` | `{ readonly top?: number; readonly right?: number; readonly bottom?: number; readonly left?: number; }` |
| `PixelChartNumberFormat` | `{ readonly style?: 'decimal' | 'percent' | 'currency' | 'compact'; readonly currency?: string; readonly minimumFractionDigits?: number; readonly maximumFractionDigits?: number; /** Appended after the formatted number when style is not `percent`. */ readonly suffix?: string; readonly locale?: string; }` |
| `PixelChartPaletteId` | `'brand' | 'vibrant' | 'cool' | 'warm'` |
| `PixelChartPalette` | `PixelChartPaletteId | readonly string[]` |
| `PixelChartImageExportFormat` | `'png' | 'svg' | 'pdf'` |
| `PixelChartInteractionSource` | `'mouse' | 'keyboard'` |
| `PixelChartPointClickEvent` | `{ readonly seriesId: string; readonly seriesName: string; readonly pointIndex: number; readonly x: string | number | Date; readonly y: number | null; readonly source: PixelChartInteractionSource; readonly originalEvent: Event; }` |
| `PixelChartEChartsTheme` | `{ readonly color: readonly string[]; readonly backgroundColor: string; readonly textStyle: { readonly color: string; readonly fontFamily: string }; readonly title: { readonly textStyle: { readonly color: string; readonly fontFamily: string } }; readonly legend: { readonly textStyle: { readonly color: string; readonly fontFamily: string } }; /** Plot tooltip chrome — mirrors `pixel-tooltip` inverse theme (not the directive itself). */ readonly tooltip: { readonly backgroundColor: string; readonly borderColor: string; readonly borderWidth: number; readonly padding: readonly [number, number]; readonly extraCssText: string; readonly textStyle: { readonly color: string; readonly fontFamily: string; readonly fontSize: number; readonly fontWeight: number; readonly lineHeight: number; }; }; readonly categoryAxis: PixelChartAxisTheme; readonly valueAxis: PixelChartAxisTheme; /** Defaults from `--pixel-chart-line-width` / `--pixel-chart-area-opacity` (facades may override). */ readonly line?: { readonly lineStyle?: { readonly width?: number }; readonly areaStyle?: { readonly opacity?: number }; }; readonly visualMap?: { readonly inRange?: { readonly color?: readonly string[] }; readonly textStyle?: { readonly color: string; readonly fontFamily: string }; }; /** Geographic map chrome (land / borders) from `--pixel-chart-map-*`. */ readonly map?: { readonly noDataColor: string; readonly borderColor: string; readonly emphasisBorderColor: string; readonly shadowColor: string; }; }` |

<!-- API-CONTRACT:END -->
