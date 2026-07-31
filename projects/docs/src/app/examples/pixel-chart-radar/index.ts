import { createDocExample } from '../../shared/example-source.util';
import { ChartRadarBasicExample } from './chart-radar-basic.example';

export const CHART_RADAR_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Radar modes',
    category: 'Setup',
    description:
      'line / filled / markers / target with multi-series overlay. Toggle Show skeleton to preview loading placeholders.',
    component: ChartRadarBasicExample,
    imports: ['PixelChartShellComponent', 'PixelChartRadarComponent', 'PixelButtonComponent'],
    html: `<pixel-chart-shell [showSkeleton]="showSkeleton()" [series]="series()" …>
  <pixel-chart-radar [showSkeleton]="showSkeleton()" [indicators]="indicators" [mode]="mode()" … />
</pixel-chart-shell>`,
    typescript: `import { PixelChartRadarComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
];
