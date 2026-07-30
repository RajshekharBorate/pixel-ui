import { DocComponentMeta } from '../types';
import { CHART_AREA_EXAMPLES } from '../../examples/pixel-chart-area';

export const CHART_AREA_META: DocComponentMeta = {
  id: 'pixel-chart-area',
  title: 'Chart — Area',
  selector: 'pixel-chart-area',
  category: 'charts',
  status: 'stable',
  summary: 'Area charts with overlay, stacked, or 100% stacked fills.',
  overview: [
    'pixel-chart-area fills under smooth lines for magnitude and composition.',
    'Modes: overlay, stacked, percent. Streamgraph is planned for Phase 2.',
    'Import from pixel-ui/charts; optional peer echarts.',
  ],
  useCases: ['Filled trends', 'Stacked composition over time', '100% stacked share'],
  themingNotes: ['Area opacity differs for overlay vs stacked; series colors from palette.'],
  accessibilityNotes: [
    'role="img" with ariaLabel; live summary.',
    'Use pixel-chart-shell data table for keyboard access.',
  ],
  imports: ['PixelChartAreaComponent', 'PixelChartShellComponent'],
  inputs: [
    { name: 'series', type: 'readonly PixelChartSeries[]', defaultValue: '[]', description: 'Data series.' },
    { name: 'categories', type: 'readonly string[]', defaultValue: '[]', description: 'X-axis labels.' },
    { name: 'mode', type: "'overlay' | 'stacked' | 'percent'", defaultValue: "'overlay'", description: 'Layout mode.' },
    { name: 'showValues', type: "boolean | 'auto'", defaultValue: "'auto'", description: 'Labels.' },
  ],
  outputs: [{ name: 'pointClick', type: 'PixelChartPointClickEvent', description: 'Point activated.' }],
  examples: CHART_AREA_EXAMPLES,
};
