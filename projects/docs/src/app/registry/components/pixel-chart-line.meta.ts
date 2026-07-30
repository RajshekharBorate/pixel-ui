import { DocComponentMeta } from '../types';
import { CHART_LINE_EXAMPLES } from '../../examples/pixel-chart-line';

export const CHART_LINE_META: DocComponentMeta = {
  id: 'pixel-chart-line',
  title: 'Chart — Line',
  selector: 'pixel-chart-line',
  category: 'charts',
  status: 'stable',
  summary: 'Line charts with straight, smooth, or step interpolation over categories.',
  overview: [
    'pixel-chart-line is the line facade over the shared chart host.',
    'Modes: straight, smooth, step. Multi-series supported.',
    'Optional axis titles, valueSuffix, and shell showValues toggle.',
    'Performance presets (auto progressive / LTTB) and optional time axis.',
    'For filled area charts use pixel-chart-area.',
    'Import from pixel-ui/charts; optional peer echarts.',
  ],
  useCases: [
    'Trend lines',
    'Multi-product comparison over time',
    'Step charts for discrete changes',
    'Large series (1k–10k) with sampling',
  ],
  themingNotes: ['Series colors from palette / --pixel-sys-primary via chart theme bridge.'],
  accessibilityNotes: [
    'role="img" with ariaLabel; live summary.',
    'Use pixel-chart-shell CSV export for keyboard-accessible data.',
  ],
  imports: ['PixelChartLineComponent', 'PixelChartShellComponent'],
  inputs: [
    { name: 'series', type: 'readonly PixelChartSeries[]', defaultValue: '[]', description: 'Data series.' },
    { name: 'categories', type: 'readonly string[]', defaultValue: '[]', description: 'X-axis labels.' },
    { name: 'mode', type: "'straight' | 'smooth' | 'step'", defaultValue: "'straight'", description: 'Interpolation.' },
    { name: 'showValues', type: "boolean | 'auto'", defaultValue: "'auto'", description: 'Point labels.' },
    { name: 'showMarkers', type: 'boolean', defaultValue: 'true', description: 'Point markers.' },
    { name: 'xAxisName', type: 'string', defaultValue: "''", description: 'X-axis title.' },
    { name: 'yAxisName', type: 'string', defaultValue: "''", description: 'Y-axis title.' },
    { name: 'valueSuffix', type: 'string', defaultValue: "''", description: 'Absolute value suffix (e.g. K).' },
  ],
  outputs: [{ name: 'pointClick', type: 'PixelChartPointClickEvent', description: 'Point activated.' }],
  examples: CHART_LINE_EXAMPLES,
};
