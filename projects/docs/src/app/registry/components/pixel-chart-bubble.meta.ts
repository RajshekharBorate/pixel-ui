import { DocComponentMeta } from '../types';
import { CHART_BUBBLE_EXAMPLES } from '../../examples/pixel-chart-bubble';

export const CHART_BUBBLE_META: DocComponentMeta = {
  id: 'pixel-chart-bubble',
  title: 'Chart — Bubble',
  selector: 'pixel-chart-bubble',
  category: 'data-display',
  status: 'experimental',
  summary: 'Cartesian bubble charts with x / y / size encoding.',
  overview: [
    'pixel-chart-bubble encodes magnitude via point size.',
    'Packed layout is Phase 2. Import from pixel-ui/charts; optional peer echarts.',
  ],
  useCases: ['Market bubbles', 'Size comparisons'],
  themingNotes: ['Bubble fill from palette with soft opacity.'],
  accessibilityNotes: [
    'role="img" with ariaLabel.',
    'Prefer shell legend via bubbleSeriesToLegendSeries.',
  ],
  imports: ['PixelChartBubbleComponent', 'PixelChartShellComponent'],
  inputs: [
    { name: 'series', type: 'readonly PixelChartBubbleSeries[]', defaultValue: '[]', description: 'Bubble series.' },
    { name: 'xAxisName', type: 'string', defaultValue: "''", description: 'X-axis title.' },
    { name: 'yAxisName', type: 'string', defaultValue: "''", description: 'Y-axis title.' },
  ],
  outputs: [{ name: 'pointClick', type: 'PixelChartPointClickEvent', description: 'Bubble activated.' }],
  examples: CHART_BUBBLE_EXAMPLES,
};
