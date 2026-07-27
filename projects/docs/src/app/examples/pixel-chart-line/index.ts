import { createDocExample } from '../../shared/example-source.util';
import { ChartLineBasicExample } from './chart-line-basic.example';

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
];
