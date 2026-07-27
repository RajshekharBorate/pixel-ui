import { createDocExample } from '../../shared/example-source.util';
import { ChartBarBasicExample } from './chart-bar-basic.example';
import { ChartBarModesExample } from './chart-bar-modes.example';

const IMPORTS = ['PixelChartShellComponent', 'PixelChartBarComponent'] as const;

export const CHART_BAR_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Column + shell',
    category: 'Setup',
    description: 'Single-series vertical bars inside pixel-chart-shell (legend, export).',
    component: ChartBarBasicExample,
    imports: [...IMPORTS],
    html: `<pixel-chart-shell title="Sales" [series]="series()" [categories]="categories()" [(hiddenSeriesIds)]="hidden" [getChart]="chartGetter">
  <pixel-chart-bar #bar [series]="series()" [categories]="categories()" [hiddenSeriesIds]="hidden()" mode="single" />
</pixel-chart-shell>`,
    typescript: `import { PixelChartBarComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'modes',
    title: 'Modes & orientation',
    category: 'Variants',
    description: 'grouped / stacked / percent and horizontal bars.',
    component: ChartBarModesExample,
    imports: [...IMPORTS],
    html: `<pixel-chart-bar [mode]="mode()" [orientation]="orientation()" … />`,
    typescript: `import { PixelChartBarComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
];
