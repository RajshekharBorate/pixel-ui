import { createDocExample } from '../../shared/example-source.util';
import { ChartPieBasicExample } from './chart-pie-basic.example';

const IMPORTS = ['PixelChartShellComponent', 'PixelChartPieComponent'] as const;

export const CHART_PIE_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Pie / donut / semi',
    category: 'Setup',
    description: 'Part-to-whole with shell legend; CSV via download menu.',
    component: ChartPieBasicExample,
    imports: [...IMPORTS],
    html: `<pixel-chart-shell [series]="legendSeries()" [tableColumns]="table().columns" [tableRows]="table().rows" [(hiddenSeriesIds)]="hidden" [getChart]="chartGetter">
  <pixel-chart-pie #pie [slices]="slices()" [mode]="mode()" [hiddenSliceIds]="hidden()" />
</pixel-chart-shell>`,
    typescript: `import { PixelChartPieComponent, PixelChartShellComponent, buildPieTable, pieSlicesToLegendSeries } from 'pixel-ui/charts';`,
  }),
];
