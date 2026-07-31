import { createDocExample } from '../../shared/example-source.util';
import { ChartBarBasicExample } from './chart-bar-basic.example';
import { ChartBarDrilldownExample } from './chart-bar-drilldown.example';
import { ChartBarLinkedDrilldownExample } from './chart-bar-linked-drilldown.example';
import { ChartBarModesExample } from './chart-bar-modes.example';
import { ChartBarSkeletonExample } from './chart-bar-skeleton.example';

const IMPORTS = ['PixelChartShellComponent', 'PixelChartBarComponent'] as const;

export const CHART_BAR_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Column + shell',
    category: 'Setup',
    description: 'Single-series vertical bars inside pixel-chart-shell (legend, export).',
    component: ChartBarBasicExample,
    imports: [...IMPORTS],
    html: `<pixel-chart-shell title="Sales" [series]="series()" [categories]="categories()" [(hiddenSeriesIds)]="hidden" [getChart]="chartGetter">
  <pixel-chart-bar #bar [series]="series()" [categories]="categories()" [hiddenSeriesIds]="hidden()" mode="single" />
</pixel-chart-shell>`,
    typescript: `import { PixelChartBarComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'skeleton',
    title: 'Loading skeletons',
    category: 'States',
    description:
      'Bind showSkeleton on the chart facade (select-style). Shell keeps title/legend; the plot shows a type-specific silhouette.',
    component: ChartBarSkeletonExample,
    imports: [...IMPORTS, 'PixelButtonComponent'],
    html: `<pixel-chart-shell ?>
  <pixel-chart-bar [showSkeleton]="showSkeleton()" ? />
</pixel-chart-shell>`,
    typescript: `import { PixelChartBarComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'modes',
    title: 'Modes & orientation',
    category: 'Variants',
    description: 'grouped / stacked / percent and horizontal bars.',
    component: ChartBarModesExample,
    imports: [...IMPORTS],
    html: `<pixel-chart-bar [mode]="mode()" [orientation]="orientation()" ? />`,
    typescript: `import { PixelChartBarComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'drilldown',
    title: 'Category drill-down',
    category: 'Interaction',
    description:
      'Consumer-owned stack: click a region bar to open cities; breadcrumb drills up.',
    component: ChartBarDrilldownExample,
    imports: [...IMPORTS, 'PixelBreadcrumbComponent'],
    html: `<pixel-chart-shell [exportBreadcrumb]="exportBreadcrumb()">
  <pixel-breadcrumb pixelChartHeader ? (itemClick)="onBreadcrumb($event)" />
  <pixel-chart-bar drillable (pointClick)="onPointClick($event)" ? />
</pixel-chart-shell>`,
    typescript: `import {
  drillLevelsToBreadcrumbItems,
  pushDrillLevel,
  truncateDrillLevels,
} from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'linked-drilldown',
    title: 'Linked bar + pie',
    category: 'Interaction',
    description:
      'One shared drill stack updates both a bar and a pie. Legend toggles sync; PNG/PDF export stitches both plots.',
    component: ChartBarLinkedDrilldownExample,
    imports: [...IMPORTS, 'PixelChartPieComponent', 'PixelBreadcrumbComponent'],
    html: `<pixel-chart-shell [getCharts]="chartsGetter" [(hiddenSeriesIds)]="hidden">
  <pixel-chart-bar mode="stacked" drillable ? />
  <pixel-chart-pie drillable ? />
</pixel-chart-shell>`,
    typescript: `import { pushDrillLevel, truncateDrillLevels, exportChartsPng } from 'pixel-ui/charts';`,
  }),
];
