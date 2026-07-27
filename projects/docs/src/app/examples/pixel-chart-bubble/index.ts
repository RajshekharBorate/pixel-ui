import { createDocExample } from '../../shared/example-source.util';
import { ChartBubbleBasicExample } from './chart-bubble-basic.example';

export const CHART_BUBBLE_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Bubble',
    category: 'Setup',
    description: 'x / y / size bubbles with shell legend and export.',
    component: ChartBubbleBasicExample,
    imports: ['PixelChartShellComponent', 'PixelChartBubbleComponent'],
    html: `<pixel-chart-shell [series]="legendSeries()" [getChart]="chartGetter">
  <pixel-chart-bubble #bubble [series]="series()" />
</pixel-chart-shell>`,
    typescript: `import { PixelChartBubbleComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
];
