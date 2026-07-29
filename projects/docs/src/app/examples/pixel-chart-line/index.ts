import { createDocExample } from '../../shared/example-source.util';
import { ChartLineBasicExample } from './chart-line-basic.example';
import { ChartLinePerformanceExample } from './chart-line-performance.example';
import { ChartLineTimeExample } from './chart-line-time.example';

export const CHART_LINE_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Line + shell',
    category: 'Setup',
    description: 'Multi-series line with straight / smooth / step modes inside the chart shell.',
    component: ChartLineBasicExample,
    imports: ['PixelChartShellComponent', 'PixelChartLineComponent'],
    html: `<pixel-chart-line [mode]="mode()" [series]="series()" [categories]="categories()" />`,
    typescript: `import { PixelChartLineComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'performance',
    title: 'Performance (1k / 10k)',
    category: 'Performance',
    description:
      'Stress page for progressive rendering and LTTB sampling. Toggle point count and performance mode.',
    component: ChartLinePerformanceExample,
    imports: ['PixelChartShellComponent', 'PixelChartLineComponent'],
    html: `<pixel-chart-line [series]="series()" [categories]="categories()" [performance]="performance()" />`,
    typescript: `import { PIXEL_CHART_MAX_POINTS } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'time',
    title: 'Time-series axis',
    category: 'Axes',
    description: 'xAxisType="time" with Date categories; optional PixelDateAdapter for labels.',
    component: ChartLineTimeExample,
    imports: ['PixelChartShellComponent', 'PixelChartLineComponent', 'provideNativeDateAdapter'],
    html: `<pixel-chart-line [categories]="categories()" xAxisType="time" />`,
    typescript: `providers: [provideNativeDateAdapter()]`,
  }),
];
