import { createDocExample } from '../../shared/example-source.util';
import { ChartAreaBasicExample } from './chart-area-basic.example';

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
];
