import { DocComponentMeta } from '../types';
import { CHART_AREA_EXAMPLES } from '../../examples/pixel-chart-area';

export const CHART_AREA_META: DocComponentMeta = {
  id: 'pixel-chart-area',
  title: 'Chart — Area',
  selector: 'pixel-chart-area',
  category: 'charts',
  status: 'stable',
  summary: 'Area charts with overlay, stacked, 100% stacked, or experimental stream fills.',
  overview: [
    'pixel-chart-area fills under smooth lines for magnitude and composition.',
    'Modes: overlay, stacked, percent, stream (centered streamgraph).',
    'Optional axis titles, valueSuffix, showMarkers, and shell showValues toggle.',
    'Import from pixel-ui/charts; optional peer echarts.',
  ],
  useCases: [
    'Filled trends',
    'Stacked composition over time',
    '100% stacked share',
    'Streamgraph composition',
  ],
  themingNotes: ['Area opacity differs for overlay vs stacked; series colors from palette.'],
  accessibilityNotes: [
    'role="img" with ariaLabel; live summary.',
    'Use pixel-chart-shell CSV export for keyboard-accessible data.',
  ],
  imports: ['PixelChartAreaComponent', 'PixelChartShellComponent'],
  inputs: [
    { name: 'series', type: 'readonly PixelChartSeries[]', defaultValue: '[]', description: 'Data series.' },
    { name: 'categories', type: 'readonly string[]', defaultValue: '[]', description: 'X-axis labels.' },
    {
      name: 'mode',
      type: "'overlay' | 'stacked' | 'percent' | 'stream'",
      defaultValue: "'overlay'",
      description: 'Layout mode.',
    },
    { name: 'showValues', type: "boolean | 'auto'", defaultValue: "'auto'", description: 'Value labels.' },
    { name: 'showMarkers', type: 'boolean', defaultValue: 'false', description: 'Point markers.' },
    { name: 'xAxisName', type: 'string', defaultValue: "''", description: 'X-axis title.' },
    { name: 'yAxisName', type: 'string', defaultValue: "''", description: 'Y-axis title.' },
    { name: 'valueSuffix', type: 'string', defaultValue: "''", description: 'Absolute value suffix (e.g. K).' },
  ],
  outputs: [{ name: 'pointClick', type: 'PixelChartPointClickEvent', description: 'Point activated.' }],
  examples: CHART_AREA_EXAMPLES,
};
