import { createDocExample } from '../../shared/example-source.util';
import { ChartAreaBasicExample } from './chart-area-basic.example';
import { ChartAreaSkeletonExample } from './chart-area-skeleton.example';

export const CHART_AREA_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Area + shell',
    category: 'Setup',
    description: 'Area fill with overlay / stacked / percent modes. Streamgraph is Phase 2.',
    component: ChartAreaBasicExample,
    imports: ['PixelChartShellComponent', 'PixelChartAreaComponent'],
    html: `<pixel-chart-area [mode]="mode()" [series]="series()" [categories]="categories()" />`,
    typescript: `import { PixelChartAreaComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'skeleton',
    title: 'Loading skeletons',
    category: 'States',
    description:
      'Bind the same showSkeleton on shell (legend stubs) and the chart (plot silhouette) so they reveal together.',
    component: ChartAreaSkeletonExample,
    imports: ['PixelChartShellComponent', 'PixelChartAreaComponent', 'PixelButtonComponent'],
    html: `<pixel-chart-shell [showSkeleton]="showSkeleton()" …>
  <pixel-chart-area [showSkeleton]="showSkeleton()" … />
</pixel-chart-shell>`,
    typescript: `import { PixelChartAreaComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
];
