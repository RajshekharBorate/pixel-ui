import { createDocExample } from '../../shared/example-source.util';
import { ChartPieBasicExample } from './chart-pie-basic.example';
import { ChartPieDrilldownExample } from './chart-pie-drilldown.example';

const IMPORTS = ['PixelChartShellComponent', 'PixelChartPieComponent', 'PixelButtonComponent'] as const;

export const CHART_PIE_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Pie / donut / semi',
    category: 'Setup',
    description:
      'Part-to-whole with shell legend; CSV via download menu. Toggle Show skeleton to preview loading placeholders.',
    component: ChartPieBasicExample,
    imports: [...IMPORTS],
    html: `<pixel-chart-shell [showSkeleton]="showSkeleton()" [series]="legendSeries()" …>
  <pixel-chart-pie [showSkeleton]="showSkeleton()" [slices]="slices()" [mode]="mode()" … />
</pixel-chart-shell>`,
    typescript: `import { PixelChartPieComponent, PixelChartShellComponent, buildPieTable, pieSlicesToLegendSeries } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'drilldown',
    title: 'Pie → bar drill-down',
    category: 'Interaction',
    description:
      'Mixed chart types in one stack: slice click opens a bar breakdown; breadcrumb returns to the pie. Toggle Show skeleton to preview loading placeholders.',
    component: ChartPieDrilldownExample,
    imports: [...IMPORTS, 'PixelChartBarComponent', 'PixelBreadcrumbComponent'],
    html: `<pixel-chart-shell [showSkeleton]="showSkeleton()">
  @if (current().data.kind === 'pie') {
    <pixel-chart-pie [showSkeleton]="showSkeleton()" (pointClick)="onSliceClick($event)" … />
  } @else {
    <pixel-chart-bar [showSkeleton]="showSkeleton()" … />
  }
</pixel-chart-shell>`,
    typescript: `import {
  drillLevelsToBreadcrumbItems,
  pushDrillLevel,
  truncateDrillLevels,
} from 'pixel-ui/charts';`,
  }),
];
