import { createDocExample } from '../../shared/example-source.util';
import { ChartMapBasicExample } from './chart-map-basic.example';
import { ChartMapPointsExample } from './chart-map-points.example';
import { ChartMapDensityExample } from './chart-map-density.example';
import { ChartMapGalleryExample } from './chart-map-gallery.example';
import { ChartMapDrilldownExample } from './chart-map-drilldown.example';
import { ChartMapSkeletonExample } from './chart-map-skeleton.example';

export const CHART_MAP_EXAMPLES = [
  createDocExample({
    id: 'gallery',
    title: 'All variants gallery',
    category: 'Setup',
    description:
      'Switch across all nine map variants with shell export, loading/empty states, categorical legends, and CSV via buildTable().',
    component: ChartMapGalleryExample,
    imports: [
      'PixelChartShellComponent',
      'PixelChartMapComponent',
      'mapRegionsToLegendSeries',
      'mapPointsToLegendSeries',
    ],
    html: `<pixel-chart-map [variant]="variant()" [appearance]="appearance()" mapName="world" [geoJson]="geoJson" [geoView]="worldView" />`,
    typescript: `import { PixelChartMapComponent, PIXEL_CHART_MAP_WORLD_GEO_VIEW } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'skeleton',
    title: 'Loading skeletons',
    category: 'States',
    description:
      'Bind the same showSkeleton on shell (legend stubs) and the chart (plot silhouette) so they reveal together.',
    component: ChartMapSkeletonExample,
    imports: ['PixelChartShellComponent', 'PixelChartMapComponent', 'PixelButtonComponent'],
    html: `<pixel-chart-shell [empty]="false" [showSkeleton]="showSkeleton()" …>
  <pixel-chart-map [showSkeleton]="showSkeleton()" … />
</pixel-chart-shell>`,
    typescript: `import { PixelChartMapComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'drilldown',
    title: 'Drill-down + breadcrumb',
    category: 'Setup',
    description:
      'Consumer-owned drill stack: regionClick pushes a child GeoJSON level; pixel-breadcrumb drills up. Optional geoView zooms to bounds.',
    component: ChartMapDrilldownExample,
    imports: [
      'PixelBreadcrumbComponent',
      'PixelChartShellComponent',
      'PixelChartMapComponent',
      'mapDrillLevelsToBreadcrumbItems',
      'pushMapDrillLevel',
      'truncateMapDrillLevels',
      'computeGeoJsonBoundingCoords',
    ],
    html: `<pixel-chart-shell title="Geographic drill-down" [exportBreadcrumb]="exportBreadcrumb()">
  @if (levels().length > 1) {
    <pixel-breadcrumb pixelChartHeader [items]="breadcrumbItems()" (itemClick)="onBreadcrumb($event)" />
  }
  <pixel-chart-map variant="choropleth" [mapName]="level.mapName" [geoJson]="level.geoJson" [data]="level.data" [geoView]="level.geoView" (regionClick)="onRegionClick($event)" />
</pixel-chart-shell>`,
    typescript: `import { PixelBreadcrumbComponent } from 'pixel-ui';
import { PixelChartMapComponent, mapDrillLevelsToBreadcrumbItems } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'basic',
    title: 'Choropleth + area',
    category: 'Setup',
    description:
      'Register docs GeoJSON under mapName, then bind region data. Choropleth uses visualMap; area uses categorical fills + shell legend.',
    component: ChartMapBasicExample,
    imports: [
      'PixelChartShellComponent',
      'PixelChartMapComponent',
      'registerPixelChartMap',
      'mapRegionsToLegendSeries',
    ],
    html: `<pixel-chart-map mapName="docs-demo" [geoJson]="geoJson" [data]="data()" [variant]="variant()" [appearance]="appearance()" [geoView]="worldView" />`,
    typescript: `import { PixelChartMapComponent, PIXEL_CHART_MAP_WORLD_GEO_VIEW, registerPixelChartMap } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'points',
    title: 'Point layers',
    category: 'Setup',
    description:
      'Point, bubble (size), scatter (size + category color), and symbol markers. Shell legend toggles categories for scatter/symbol.',
    component: ChartMapPointsExample,
    imports: [
      'PixelChartShellComponent',
      'PixelChartMapComponent',
      'mapPointsToLegendSeries',
    ],
    html: `<pixel-chart-map variant="bubble" mapName="world" [geoJson]="geoJson" [points]="points" />`,
    typescript: `import { PixelChartMapComponent, mapPointsToLegendSeries } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'density',
    title: 'Heatmap · route · flow',
    category: 'Setup',
    description:
      'Heatmap intensity, route polylines with stop markers, and curved flow links sized by volume.',
    component: ChartMapDensityExample,
    imports: ['PixelChartShellComponent', 'PixelChartMapComponent'],
    html: `<pixel-chart-map variant="flow" mapName="world" [geoJson]="geoJson" [points]="hubs" [links]="flowLinks" />`,
    typescript: `import { PixelChartMapComponent } from 'pixel-ui/charts';`,
  }),
];
