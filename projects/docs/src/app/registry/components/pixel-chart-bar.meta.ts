import { DocComponentMeta } from '../types';
import { CHART_BAR_EXAMPLES } from '../../examples/pixel-chart-bar';

export const CHART_BAR_META: DocComponentMeta = {
  id: 'pixel-chart-bar',
  title: 'Chart — Bar / Column',
  selector: 'pixel-chart-bar',
  category: 'data-display',
  status: 'experimental',
  summary:
    'Bar and column charts (single, grouped, stacked, 100% stacked) with Pixel theming via ECharts.',
  overview: [
    'pixel-chart-bar is the bar/column facade over the shared chart host.',
    'Use orientation="vertical" for columns and orientation="horizontal" for bars.',
    'Pair with pixel-chart-shell for card chrome, legend, data table, and PNG/CSV export.',
    'Install optional peer echarts and import from pixel-ui/charts.',
  ],
  useCases: [
    'Quarterly / categorical comparisons',
    'Multi-series grouped or stacked composition',
    'Horizontal ranking charts with long labels',
  ],
  themingNotes: [
    'Series colors follow palette or --pixel-sys-primary via the chart theme bridge.',
    'Shell tokens: --pixel-chart-shell-* on pixel-chart-shell.',
  ],
  accessibilityNotes: [
    'Plot uses role="img" with ariaLabel; a live summary is announced.',
    'Shell data table is the primary keyboard-accessible data path.',
    'Legend buttons toggle series visibility (aria-pressed).',
  ],
  imports: ['PixelChartBarComponent', 'PixelChartShellComponent'],
  inputs: [
    { name: 'series', type: 'readonly PixelChartSeries[]', defaultValue: '[]', description: 'Data series.' },
    { name: 'categories', type: 'readonly string[]', defaultValue: '[]', description: 'Category axis labels.' },
    { name: 'mode', type: "'single' | 'grouped' | 'stacked' | 'percent'", defaultValue: "'grouped'", description: 'Layout mode.' },
    { name: 'orientation', type: "'vertical' | 'horizontal'", defaultValue: "'vertical'", description: 'Bar direction.' },
    { name: 'showValues', type: "boolean | 'auto'", defaultValue: "'auto'", description: 'Value labels.' },
    { name: 'palette', type: 'PixelChartPalette', defaultValue: "'brand'", description: 'Color palette.' },
    { name: 'hiddenSeriesIds', type: 'readonly string[]', defaultValue: '[]', description: 'Hidden series ids.' },
    { name: 'ariaLabel', type: 'string', defaultValue: "''", description: 'Accessible name.' },
    { name: 'height', type: 'string | number', defaultValue: "'280px'", description: 'Plot height.' },
  ],
  outputs: [
    { name: 'pointClick', type: 'PixelChartPointClickEvent', description: 'Bar segment activated.' },
  ],
  examples: CHART_BAR_EXAMPLES,
};
