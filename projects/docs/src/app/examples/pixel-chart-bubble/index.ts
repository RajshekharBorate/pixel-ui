import { createDocExample } from '../../shared/example-source.util';
import { ChartBubbleBasicExample } from './chart-bubble-basic.example';

export const CHART_BUBBLE_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Bubble + table',
    category: 'Setup',
    description: 'x / y / size bubbles with paginated table and View all.',
    component: ChartBubbleBasicExample,
    imports: ['PixelChartShellComponent', 'PixelChartBubbleComponent'],
    html: `<pixel-chart-shell [series]="legendSeries()" [showTable]="false" [getChart]="chartGetter">
  <pixel-chart-bubble #bubble [series]="series()" [pageSize]="4" />
</pixel-chart-shell>`,
    typescript: `import { PixelChartBubbleComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
];
