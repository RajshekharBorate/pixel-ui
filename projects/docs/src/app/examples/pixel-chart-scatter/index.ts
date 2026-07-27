import { createDocExample } from '../../shared/example-source.util';
import { ChartScatterBasicExample } from './chart-scatter-basic.example';

export const CHART_SCATTER_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Scatter + stats',
    category: 'Setup',
    description: 'Multi-series scatter with trendline and r / R² footer.',
    component: ChartScatterBasicExample,
    imports: ['PixelChartShellComponent', 'PixelChartScatterComponent'],
    html: `<pixel-chart-shell [series]="series()" [tableColumns]="…" [tableRows]="…" [getChart]="chartGetter">
  <pixel-chart-scatter #scatter showTrendline showStats [series]="series()" />
</pixel-chart-shell>`,
    typescript: `import { PixelChartScatterComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
];
