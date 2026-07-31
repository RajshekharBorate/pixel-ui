import { createDocExample } from '../../shared/example-source.util';
import { ChartMapBasicExample } from './chart-map-basic.example';
import { ChartMapPointsExample } from './chart-map-points.example';
import { ChartMapDensityExample } from './chart-map-density.example';
import { ChartMapGalleryExample } from './chart-map-gallery.example';
import { ChartMapDrilldownExample } from './chart-map-drilldown.example';

export const CHART_MAP_EXAMPLES = [
  createDocExample({
    id: 'gallery',
    title: 'All variants gallery',
    category: 'Setup',
    description:
      'Switch across all nine map variants. Toggle Show skeleton to preview loading placeholders.',
    component: ChartMapGalleryExample,
    imports: [
      'PixelChartShellComponent',
      'PixelChartMapComponent',
      'PixelButtonComponent',
      'mapRegionsToLegendSeries',
      'mapPointsToLegendSeries',
    ],
    html: `<pixel-chart-shell [showSkeleton]="showSkeleton()" …>
  <pixel-chart-map [showSkeleton]="showSkeleton()" [variant]="variant()" … />
</pixel-chart-shell>`,
    typescript: `import { PixelChartMapComponent, PIXEL_CHART_MAP_WORLD_GEO_VIEW } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'drilldown',
    title: 'Drill-down + breadcrumb',
    category: 'Setup',
    description:
      'Consumer-owned drill stack with breadcrumb. Toggle Show skeleton to preview loading placeholders.',
    component: ChartMapDrilldownExample,
    imports: [
      'PixelBreadcrumbComponent',
      'PixelChartShellComponent',
      'PixelChartMapComponent',
      'PixelButtonComponent',
      'mapDrillLevelsToBreadcrumbItems',
      'pushMapDrillLevel',
      'truncateMapDrillLevels',
      'computeGeoJsonBoundingCoords',
    ],
    html: `<pixel-chart-shell [showSkeleton]="showSkeleton()" …>
  <pixel-chart-map [showSkeleton]="showSkeleton()" … />
</pixel-chart-shell>`,
    typescript: `import { PixelBreadcrumbComponent } from 'pixel-ui';
import { PixelChartMapComponent, mapDrillLevelsToBreadcrumbItems } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'basic',
    title: 'Choropleth + area',
    category: 'Setup',
    description:
      'Choropleth uses visualMap; area uses categorical fills + shell legend. Toggle Show skeleton to preview loading placeholders.',
    component: ChartMapBasicExample,
    imports: [
      'PixelChartShellComponent',
      'PixelChartMapComponent',
      'PixelButtonComponent',
      'registerPixelChartMap',
      'mapRegionsToLegendSeries',
    ],
    html: `<pixel-chart-shell [showSkeleton]="showSkeleton()" …>
  <pixel-chart-map [showSkeleton]="showSkeleton()" [variant]="variant()" … />
</pixel-chart-shell>`,
    typescript: `import { PixelChartMapComponent, PIXEL_CHART_MAP_WORLD_GEO_VIEW, registerPixelChartMap } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'points',
    title: 'Point layers',
    category: 'Setup',
    description:
      'Point, bubble, scatter, and symbol markers. Toggle Show skeleton to preview loading placeholders.',
    component: ChartMapPointsExample,
    imports: [
      'PixelChartShellComponent',
      'PixelChartMapComponent',
      'PixelButtonComponent',
      'mapPointsToLegendSeries',
    ],
    html: `<pixel-chart-map [showSkeleton]="showSkeleton()" variant="bubble" … />`,
    typescript: `import { PixelChartMapComponent, mapPointsToLegendSeries } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'density',
    title: 'Heatmap · route · flow',
    category: 'Setup',
    description:
      'Heatmap, route, and flow variants. Toggle Show skeleton to preview loading placeholders.',
    component: ChartMapDensityExample,
    imports: ['PixelChartShellComponent', 'PixelChartMapComponent', 'PixelButtonComponent'],
    html: `<pixel-chart-map [showSkeleton]="showSkeleton()" variant="flow" … />`,
    typescript: `import { PixelChartMapComponent } from 'pixel-ui/charts';`,
  }),
];
