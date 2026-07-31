import { createDocExample } from '../../shared/example-source.util';
import { ChartGaugeBasicExample } from './chart-gauge-basic.example';

const IMPORTS = [
  'PixelChartShellComponent',
  'PixelChartGaugeComponent',
  'PixelButtonComponent',
] as const;

export const CHART_GAUGE_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Gauge variants',
    category: 'Setup',
    description:
      'All gauge variants with min / max / value. Toggle Show skeleton to preview loading placeholders.',
    component: ChartGaugeBasicExample,
    imports: [...IMPORTS],
    html: `<pixel-chart-shell [showSkeleton]="showSkeleton()" title="KPI" [empty]="false" …>
  <pixel-chart-gauge [showSkeleton]="showSkeleton()" [value]="72" variant="radial" … />
</pixel-chart-shell>`,
    typescript: `import { PixelChartGaugeComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
];
