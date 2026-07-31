# pixel-chart-map

Geographic map facade covering all nine mockup variants:

**choropleth** · **area** · **point** · **bubble** · **scatter** · **symbol** ·
**heatmap** · **route** · **flow**.

> Import from `pixel-ui/charts`. Requires optional peer `echarts`.
> Apps/docs supply GeoJSON via `registerPixelChartMap` or the `geoJson` input.
> The library does **not** ship a world atlas.

## Overview

Compose with `pixel-chart-host` / `pixel-chart-shell`. Region data joins GeoJSON
features by `regionKey` (`name` default → feature `properties.name`). Point layers
and heatmap use `points`. Route / flow use `links` (`from` / `to` as coords or
point ids, optional `waypoints`).

## Use cases

- Sales / KPI by country or custom region (choropleth + `visualMap`)
- Territory / org regions with categorical colors (area + shell legend)
- Sites / facilities (point / symbol) and volume-by-location (bubble / scatter)
- Activity density (heatmap)
- Shipping / travel paths (route) and hub→spoke volume (flow)

## Variant parity

| Input / feature | choropleth | area | point | bubble | scatter | symbol | heatmap | route | flow |
|-----------------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `data` | ✓ | ✓ | | | | | | | |
| `points` | | | ✓ | ✓ | ✓ | ✓ | ✓ | id resolve | id resolve |
| `links` | | | | | | | | ✓ | ✓ |
| `valueScale` / visualMap | ✓ | | | | | | ✓ | | |
| `sizeScale` | | | | ✓ | ✓ | | | | |
| `lineWidthScale` | | | | | | | | | ✓ |
| `heatmapBlur` / `heatmapPointSize` | | | | | | | ✓ | | |
| `symbolMap` | | | | | | ✓ | | | |
| Shell categorical legend | | ✓ | | | ✓ | ✓ | | | |
| `regionClick` | ✓ | ✓ | | | | | | | |
| `pointClick` | | | ✓ | ✓ | ✓ | ✓ | ✓ | | |
| `linkClick` | | | | | | | | ✓ | ✓ |
| `valueFormat` / `nullLabel` | ✓ | | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `syncGroup` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `roam` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## Behavior notes

- Call `ensureMapChart()` (done at facade load) and register GeoJSON under `mapName`
  before or via `[geoJson]`. Unregistered / empty `mapName` yields an empty option
  (safe while async GeoJSON loads). Unmatched region ids keep the no-data land fill.
- **Legends (hybrid):** choropleth / heatmap use ECharts `visualMap` (piecewise labels
  should match product scale copy). Shell legend is for categorical **area**
  (`mapRegionsToLegendSeries` + `hiddenRegionIds`) and scatter/symbol categories
  (`mapPointsToLegendSeries` + `hiddenCategoryIds`). Prefer shell `[empty]="false"`
  (or explicit empty) when not using shell `series`. Category colors stay keyed to the
  full category list when legend items are hidden (same as other chart families).
- Bubble / scatter size uses `size` (fallback `value`) via `sizeScale`.
- Flow line width uses `link.value` via `lineWidthScale`. Curved arcs, arrowheads,
  endpoint markers, and a subtle halo clarify direction. Route uses a haloed polyline
  plus origin / waypoint / destination markers. Empty `links` + ordered `points`
  synthesizes one route.
- Heatmap intensity is `point.value`; `heatmapBlur` / `heatmapPointSize` map to
  ECharts `blurSize` / `pointSize`. Blur is kept ≥ ~1.75× point size. Theme merge
  injects a transparent edge stop plus the vivid upper token ramp into
  `visualMap.inRange` (soft kernels without washing mid/high intensity away).
  Dark scheme peaks tint toward light primary so density stays readable.
- `showValues: 'auto'` hides point labels above `PIXEL_CHART_MAP_AUTO_LABEL_MAX_POINTS` (40).
- Performance: prefer ≤ `PIXEL_CHART_MAP_MAX_HEATMAP_POINTS` (5 000) and
  ≤ `PIXEL_CHART_MAP_MAX_LINKS` (2 000); progressive drawing at
  `PIXEL_CHART_MAP_PROGRESSIVE_THRESHOLD` (1 000). Also on
  `PIXEL_CHART_MAX_POINTS.mapHeatmap` / `.mapLinks`.
- **Export:** shell PNG / SVG / PDF via `getChart`; CSV via
  `buildTable()` → shell `tableColumns` / `tableRows`
  (`buildMapTable` / `buildMapPointsTable` / `buildMapLinksTable`).
- **Drill-down (consumer-owned):** charts do not own navigation. Keep a
  `PixelChartMapDrillLevel[]` stack in the parent; on `regionClick`, load child
  GeoJSON + data and `pushMapDrillLevel` (map alias of the shared
  `pushDrillLevel` kit). Drive `pixel-breadcrumb` with
  `mapDrillLevelsToBreadcrumbItems` and truncate via `truncateMapDrillLevels` on
  `itemClick`. Optional `geoView` / `computeGeoJsonBoundingCoords` zoom into the
  child atlas. Prefer choropleth/area for region drill; put ids in breadcrumb
  `data`, not labels alone. Keyboard users drill via breadcrumb (canvas clicks
  are pointer-oriented). Cross-chart drill (bar / pie / bubble pack / linked facades)
  uses the same kit — see `pixel-chart` README. Set `drillable` for a pointer cursor.
- **Loading / empty / skeleton:** compose with `pixel-chart-shell` (`loading`,
  `showSkeleton`, `empty` / empty copy). Facade `loading` also marks the host busy.
- **Roam / keyboard:** pan/zoom is pointer-oriented (`roam`). Shell toolbar actions
  (download, fullscreen, legend toggles) remain keyboard-reachable. Screen-reader
  users get the live summary (variant, counts, value range) and CSV export — canvas
  is not region-/marker-navigable by keyboard.
- **High-contrast hatch** for choropleth: deferred (evaluate later); rely on
  palette contrast + visualMap text for now.
- Host escape hatch remains available for exotic geo options.
- **Appearance presets** (`appearance`: `minimal` | `soft` | `emphasis`, default
  `soft`) tune border weight and hover elevation. Ocean / land / border colors
  come from `--pixel-chart-map-*` tokens (resolved live for light/dark).
- **World framing:** docs demos bind `PIXEL_CHART_MAP_WORLD_GEO_VIEW` so landmasses
  fill the card; apps can reuse the helper or supply their own `geoView`.

### Locked product decisions

1. Engine = ECharts geo/map only (modular `ensureMapChart()`); no Leaflet/Mapbox in v1.
2. One component `pixel-chart-map` + `variant` (not nine packages).
3. GeoJSON supplied by app/docs — no atlas inside `pixel-ui`.
4. Legends hybrid: visualMap for ramps; shell for categories.
5. Region join via `regionKey: 'name' | 'id'` (default `'name'`).
6. Drill-down is consumer-owned (breadcrumb + GeoJSON swap); library provides helpers only.
7. Map chrome is token + appearance driven — no hardcoded rgba borders in product UI.
## Accessibility

- Host `role="img"`; prefer explicit `ariaLabel`.
- Live summary includes variant, map name, counts, and value range when present.
- Export CSV via table helpers / shell download.

## Theme customization

| Token | Role |
|-------|------|
| `--pixel-chart-map-no-data` | Fill for regions without data |
| `--pixel-chart-map-border` | Region stroke |
| `--pixel-chart-map-border-emphasis` | Hover / focus stroke |
| `--pixel-chart-map-shadow` | Hover elevation shadow |
| `--pixel-chart-map-ramp-*` | Choropleth / heatmap visualMap ramp |

Choropleth / heatmap ramps and point / flow colors come from the chart palette;
land / borders / no-data from map tokens. The plot canvas stays transparent (no
ocean fill) so the shell surface shows through. Dark scheme uses stronger coasts
and a primary→light peak so heatmaps stay readable without near-white lows
(hard kernel edges). `appearance` only changes chrome weights, not the token set.

## Breaking changes

- Map plot no longer fills with `--pixel-chart-map-ocean` / `oceanColor`; canvas
  background stays transparent so the shell surface shows through.

<!-- API-CONTRACT:START — generated by tools/generate-readme-api.mjs. Do NOT edit between these markers; run `npm run readme:api` instead. -->

## API contract

_Machine-generated from the component source. This is the behavioral API surface: any change
to it is a **breaking-change candidate** and must be deliberate. After modifying this
component, run `npm run readme:api` and review this section's diff as a regression check._

### Component `pixel-chart-map` (`PixelChartMapComponent`)

Geographic map facade (choropleth, area, point, bubble, scatter, symbol, heatmap, route, flow). Register GeoJSON with `registerPixelChartMap` or pass `[geoJson]` + `mapName`.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `PixelChartMapVariant` | `'choropleth'` | Map visualization mode. choropleth \| area \| point \| bubble \| scatter \| symbol \| heatmap \| route \| flow |
| `appearance` | `PixelChartMapAppearance` | `PIXEL_CHART_MAP_APPEARANCE_DEFAULT` | Visual density / hover elevation preset. minimal \| soft \| emphasis |
| `mapName` | `string` | `''` | Registered map name (`registerPixelChartMap` / ECharts `registerMap`). |
| `geoJson` | `object | null` | `null` | Optional GeoJSON — when set, registers under `mapName` before build. |
| `data` | `readonly PixelChartRegionDatum[]` | `[]` | Region rows joined to GeoJSON features (choropleth / area). |
| `points` | `readonly PixelChartGeoPoint[]` | `[]` | Lon/lat points (point layers, heatmap intensity, link id resolution). |
| `links` | `readonly PixelChartMapLink[]` | `[]` | Directed links for route / flow (`from` / `to` as coords or point ids). |
| `regionKey` | `PixelChartMapRegionKey` | `'name'` | Feature property used to join `data` names (`name` or `id`). |
| `valueScale` | `PixelChartMapValueScale | null` | `null` | Value scale for choropleth / heatmap `visualMap` (continuous or piecewise). |
| `sizeScale` | `PixelChartMapSizeScale | null` | `null` | Size domain / pixel range for bubble and scatter markers. |
| `lineWidthScale` | `PixelChartMapLineWidthScale | null` | `null` | Line width domain for flow (optional route). |
| `heatmapBlur` | `number` | `20` | Heatmap blur radius (ECharts `blurSize`). |
| `heatmapPointSize` | `number` | `18` | Heatmap point radius before blur (ECharts `pointSize`). |
| `showValues` | `PixelChartShowValues` | `false` | Region / point labels. `auto` soft-caps point labels by density. |
| `markerSize` | `number` | `10` | Fixed marker diameter for `point` (px). Also the fallback size. |
| `symbolMap` | `Readonly<Record<string, string>> | null` | `null` | Category → ECharts symbol for `symbol` variant. |
| `roam` | `boolean` | `true` | Allow pan / zoom (ECharts roam). |
| `palette` | `PixelChartPalette` | `'brand'` | Series color palette (choropleth ramp / categories / points). |
| `hiddenRegionIds` | `readonly string[]` | `[]` | Region ids hidden via legend (area). |
| `hiddenCategoryIds` | `readonly string[]` | `[]` | Category ids hidden via legend (area / scatter / symbol). |
| `geoView` | `PixelChartMapGeoView | null` | `null` | Optional map camera (boundingCoords / center / zoom) for drill-in. |
| `valueFormat` | `PixelChartNumberFormat | null` | `null` | Advanced number format for tooltips / labels. |
| `nullLabel` | `string` | `'—'` | Label for null values. |
| `ariaLabel` | `string` | `''` | Accessible name. |
| `id` | `string` | `''` | Optional id override. |
| `height` | `string | number` | `'360px'` | Plot height. |
| `loading` | `boolean` | `false` | Loading / busy. |
| `disabled` | `boolean` | `false` | Disabled (non-interactive). |
| `themeVersion` | `number` | `0` | Theme rebuild counter (docs theme toggle). |
| `syncGroup` | `string` | `''` | Cross-chart sync group (host). |

**Outputs**

| Output | Payload | Description |
| --- | --- | --- |
| `regionClick` | `PixelChartRegionClickEvent` | Region activated (choropleth / area). |
| `pointClick` | `PixelChartMapPointClickEvent` | Point activated (point layers / heatmap). |
| `linkClick` | `PixelChartMapLinkClickEvent` | Link activated (route / flow). |

### Exported types

| Type | Definition |
| --- | --- |
| `PixelChartRegionClickEvent` | `{ readonly regionId: string; readonly regionName: string; readonly value: number | null; readonly category?: string; readonly originalEvent: Event; }` |
| `PixelChartMapPointClickEvent` | `{ readonly pointId: string | null; readonly name: string; readonly lon: number; readonly lat: number; readonly value: number | null; readonly size: number | null; readonly category?: string; readonly originalEvent: Event; }` |
| `PixelChartMapLinkClickEvent` | `{ readonly linkId: string | null; readonly name: string; readonly fromLon: number; readonly fromLat: number; readonly toLon: number; readonly toLat: number; readonly value: number | null; readonly originalEvent: Event; }` |

<!-- API-CONTRACT:END -->
