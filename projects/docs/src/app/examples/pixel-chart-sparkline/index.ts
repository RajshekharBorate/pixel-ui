import { createDocExample } from '../../shared/example-source.util';
import { ChartSparklineBasicExample } from './chart-sparkline-basic.example';
import { ChartSparklineSkeletonExample } from './chart-sparkline-skeleton.example';

export const CHART_SPARKLINE_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Inline sparklines',
    category: 'Setup',
    description: 'Custom SVG micro-charts (no ECharts) for KPI rows and dense tables.',
    component: ChartSparklineBasicExample,
    imports: ['PixelChartSparklineComponent'],
    html: `<pixel-chart-sparkline [values]="up" variant="area" tone="success" ariaLabel="Revenue" />`,
    typescript: `import { PixelChartSparklineComponent } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'skeleton',
    title: 'Loading skeletons',
    category: 'States',
    description:
      'Bind showSkeleton on the sparkline (select-style). No shell — line-shaped silhouette.',
    component: ChartSparklineSkeletonExample,
    imports: ['PixelChartSparklineComponent', 'PixelButtonComponent'],
    html: `<pixel-chart-sparkline [values]="up" [showSkeleton]="showSkeleton()" … />`,
    typescript: `import { PixelChartSparklineComponent } from 'pixel-ui/charts';`,
  }),
];
