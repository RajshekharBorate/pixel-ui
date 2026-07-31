import { createDocExample } from '../../shared/example-source.util';
import { ChartScatterBasicExample } from './chart-scatter-basic.example';

export const CHART_SCATTER_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Scatter + trendline',
    category: 'Setup',
    description:
      'Multi-series scatter with an optional trendline. Toggle Show skeleton to preview loading placeholders.',
    component: ChartScatterBasicExample,
    imports: ['PixelChartShellComponent', 'PixelChartScatterComponent', 'PixelButtonComponent'],
    html: `<pixel-chart-shell [showSkeleton]="showSkeleton()" [series]="series()" …>
  <pixel-chart-scatter [showSkeleton]="showSkeleton()" showTrendline [series]="series()" … />
</pixel-chart-shell>`,
    typescript: `import { PixelChartScatterComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
];
