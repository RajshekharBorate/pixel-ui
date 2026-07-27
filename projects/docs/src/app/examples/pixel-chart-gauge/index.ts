import { createDocExample } from '../../shared/example-source.util';
import { ChartGaugeBasicExample } from './chart-gauge-basic.example';

const IMPORTS = ['PixelChartShellComponent', 'PixelChartGaugeComponent'] as const;

export const CHART_GAUGE_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Gauge variants',
    category: 'Setup',
    description: 'radial / semi / donut / linear / bullet with min–max–value footer.',
    component: ChartGaugeBasicExample,
    imports: [...IMPORTS],
    html: `<pixel-chart-shell title="KPI" [empty]="false" [showTable]="false" [getChart]="chartGetter">
  <pixel-chart-gauge #gauge [value]="72" variant="radial" label="Performance" />
</pixel-chart-shell>`,
    typescript: `import { PixelChartGaugeComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
];
