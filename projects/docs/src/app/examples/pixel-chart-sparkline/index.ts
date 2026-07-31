import { createDocExample } from '../../shared/example-source.util';
import { ChartSparklineBasicExample } from './chart-sparkline-basic.example';

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
];
