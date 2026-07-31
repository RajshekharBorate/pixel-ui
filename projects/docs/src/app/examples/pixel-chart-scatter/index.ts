import { createDocExample } from '../../shared/example-source.util';
import { ChartScatterBasicExample } from './chart-scatter-basic.example';
import { ChartScatterSkeletonExample } from './chart-scatter-skeleton.example';

export const CHART_SCATTER_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Scatter + trendline',
    category: 'Setup',
    description: 'Multi-series scatter with an optional trendline.',
    component: ChartScatterBasicExample,
    imports: ['PixelChartShellComponent', 'PixelChartScatterComponent'],
    html: `<pixel-chart-shell [series]="series()" [tableColumns]="…" [tableRows]="…" [getChart]="chartGetter">
  <pixel-chart-scatter #scatter showTrendline [series]="series()" />
</pixel-chart-shell>`,
    typescript: `import { PixelChartScatterComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'skeleton',
    title: 'Loading skeletons',
    category: 'States',
    description:
      'Bind the same showSkeleton on shell (legend stubs) and the chart (plot silhouette) so they reveal together.',
    component: ChartScatterSkeletonExample,
    imports: ['PixelChartShellComponent', 'PixelChartScatterComponent', 'PixelButtonComponent'],
    html: `<pixel-chart-shell [showSkeleton]="showSkeleton()" …>
  <pixel-chart-scatter [showSkeleton]="showSkeleton()" … />
</pixel-chart-shell>`,
    typescript: `import { PixelChartScatterComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
];
