import { createDocExample } from '../../shared/example-source.util';
import { ChartAreaBasicExample } from './chart-area-basic.example';

export const CHART_AREA_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Area + shell',
    category: 'Setup',
    description:
      'Area fill with overlay / stacked / percent modes. Toggle Show skeleton to preview loading placeholders.',
    component: ChartAreaBasicExample,
    imports: ['PixelChartShellComponent', 'PixelChartAreaComponent', 'PixelButtonComponent'],
    html: `<pixel-chart-shell [showSkeleton]="showSkeleton()" …>
  <pixel-chart-area [showSkeleton]="showSkeleton()" [mode]="mode()" … />
</pixel-chart-shell>`,
    typescript: `import { PixelChartAreaComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
];
