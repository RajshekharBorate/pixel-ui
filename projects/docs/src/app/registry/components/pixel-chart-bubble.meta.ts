import { DocComponentMeta } from '../types';
import { CHART_BUBBLE_EXAMPLES } from '../../examples/pixel-chart-bubble';

export const CHART_BUBBLE_META: DocComponentMeta = {
  id: 'pixel-chart-bubble',
  title: 'Chart — Bubble',
  selector: 'pixel-chart-bubble',
  category: 'charts',
  status: 'stable',
  summary: 'Cartesian bubble charts with x / y / size encoding, or hierarchical pack layout.',
  overview: [
    'pixel-chart-bubble encodes magnitude via point size.',
    'layout="pack" runs a hierarchical circle pack.',
    'Pair with shell [(showValues)] for labels; optional cartesian axis titles.',
    'Import from pixel-ui/charts; optional peer echarts.',
  ],
  useCases: ['Market bubbles', 'Size comparisons', 'Nested portfolio packs'],
  themingNotes: ['Bubble fill from palette with soft opacity.'],
  accessibilityNotes: [
    'role="img" with ariaLabel.',
    'Prefer shell legend via bubbleSeriesToLegendSeries.',
  ],
  imports: ['PixelChartBubbleComponent', 'PixelChartShellComponent'],
  inputs: [
    { name: 'series', type: 'readonly PixelChartBubbleSeries[]', defaultValue: '[]', description: 'Bubble series.' },
    { name: 'layout', type: "'cartesian' | 'pack'", defaultValue: "'cartesian'", description: 'Layout mode.' },
    { name: 'showValues', type: "boolean | 'auto'", defaultValue: "'auto'", description: 'Point / leaf labels.' },
    { name: 'xAxisName', type: 'string', defaultValue: "''", description: 'X-axis title (cartesian).' },
    { name: 'yAxisName', type: 'string', defaultValue: "''", description: 'Y-axis title (cartesian).' },
  ],
  outputs: [{ name: 'pointClick', type: 'PixelChartPointClickEvent', description: 'Bubble activated.' }],
  examples: CHART_BUBBLE_EXAMPLES,
};
