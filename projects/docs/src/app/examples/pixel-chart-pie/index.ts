import { createDocExample } from '../../shared/example-source.util';
import { ChartPieBasicExample } from './chart-pie-basic.example';
import { ChartPieDrilldownExample } from './chart-pie-drilldown.example';
import { ChartPieSkeletonExample } from './chart-pie-skeleton.example';

const IMPORTS = ['PixelChartShellComponent', 'PixelChartPieComponent'] as const;

export const CHART_PIE_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Pie / donut / semi',
    category: 'Setup',
    description: 'Part-to-whole with shell legend; CSV via download menu.',
    component: ChartPieBasicExample,
    imports: [...IMPORTS],
    html: `<pixel-chart-shell [series]="legendSeries()" [tableColumns]="table().columns" [tableRows]="table().rows" [(hiddenSeriesIds)]="hidden" [getChart]="chartGetter">
  <pixel-chart-pie #pie [slices]="slices()" [mode]="mode()" [hiddenSliceIds]="hidden()" />
</pixel-chart-shell>`,
    typescript: `import { PixelChartPieComponent, PixelChartShellComponent, buildPieTable, pieSlicesToLegendSeries } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'skeleton',
    title: 'Loading skeletons',
    category: 'States',
    description:
      'Bind showSkeleton on the chart facade (select-style). Shell keeps title/legend; the plot shows a type-specific silhouette.',
    component: ChartPieSkeletonExample,
    imports: [...IMPORTS, 'PixelButtonComponent'],
    html: `<pixel-chart-shell …>
  <pixel-chart-pie [showSkeleton]="showSkeleton()" … />
</pixel-chart-shell>`,
    typescript: `import { PixelChartPieComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'drilldown',
    title: 'Pie → bar drill-down',
    category: 'Interaction',
    description:
      'Mixed chart types in one stack: slice click opens a bar breakdown; breadcrumb returns to the pie.',
    component: ChartPieDrilldownExample,
    imports: [...IMPORTS, 'PixelChartBarComponent', 'PixelBreadcrumbComponent'],
    html: `<pixel-chart-shell>
  @if (current().data.kind === 'pie') {
    <pixel-chart-pie (pointClick)="onSliceClick($event)" … />
  } @else {
    <pixel-chart-bar … />
  }
</pixel-chart-shell>`,
    typescript: `import {
  drillLevelsToBreadcrumbItems,
  pushDrillLevel,
  truncateDrillLevels,
} from 'pixel-ui/charts';`,
  }),
];
