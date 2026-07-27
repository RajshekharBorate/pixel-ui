import { DocComponentMeta } from '../types';
import { CHART_BUBBLE_EXAMPLES } from '../../examples/pixel-chart-bubble';

export const CHART_BUBBLE_META: DocComponentMeta = {
  id: 'pixel-chart-bubble',
  title: 'Chart — Bubble',
  selector: 'pixel-chart-bubble',
  category: 'data-display',
  status: 'experimental',
  summary: 'Cartesian bubble charts with x / y / size and a paginated table.',
  overview: [
    'pixel-chart-bubble encodes magnitude via point size.',
    'Includes pixel-paginator table and View all. Packed layout is Phase 2.',
    'Import from pixel-ui/charts; optional peer echarts.',
  ],
  useCases: ['Market bubbles', 'Size comparisons', 'Tabular drill-down'],
  themingNotes: ['Bubble fill from palette with soft opacity.'],
  accessibilityNotes: [
    'role="img" with ariaLabel; built-in table caption.',
    'Prefer shell legend via bubbleSeriesToLegendSeries.',
  ],
  imports: ['PixelChartBubbleComponent', 'PixelChartShellComponent'],
  inputs: [
    { name: 'series', type: 'readonly PixelChartBubbleSeries[]', defaultValue: '[]', description: 'Bubble series.' },
    { name: 'showTable', type: 'boolean', defaultValue: 'true', description: 'Paginated point table.' },
    { name: 'pageSize', type: 'number', defaultValue: '5', description: 'Table page size.' },
  ],
  outputs: [{ name: 'pointClick', type: 'PixelChartPointClickEvent', description: 'Bubble activated.' }],
  examples: CHART_BUBBLE_EXAMPLES,
};
