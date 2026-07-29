import { DocComponentMeta } from '../types';
import { CHART_SPARKLINE_EXAMPLES } from '../../examples/pixel-chart-sparkline';

export const CHART_SPARKLINE_META: DocComponentMeta = {
  id: 'pixel-chart-sparkline',
  title: 'Chart — Sparkline',
  selector: 'pixel-chart-sparkline',
  category: 'data-display',
  status: 'stable',
  summary: 'Tiny inline SVG trend charts without ECharts — for KPIs and dense tables.',
  overview: [
    'pixel-chart-sparkline is a custom SVG micro-chart (Phase 3 decision: no ECharts subset).',
    'Import from pixel-ui/charts. Prefer full pixel-chart-line for interactive plots.',
  ],
  useCases: ['KPI deltas', 'Table cell trends', 'Dense dashboard strips'],
  themingNotes: [
    'Override --pixel-chart-sparkline-color / --pixel-chart-sparkline-fill.',
    'tone maps to success / warning / error system colors.',
  ],
  accessibilityNotes: [
    'role="img" with ariaLabel (auto summary if omitted).',
  ],
  imports: ['PixelChartSparklineComponent'],
  inputs: [
    { name: 'values', type: 'readonly (number | null)[]', defaultValue: '[]', description: 'Samples.' },
    { name: 'variant', type: "'line' | 'area'", defaultValue: "'line'", description: 'Stroke vs area.' },
    { name: 'tone', type: "'default' | 'success' | 'warning' | 'error'", defaultValue: "'default'", description: 'Color tone.' },
  ],
  outputs: [],
  examples: CHART_SPARKLINE_EXAMPLES,
};
