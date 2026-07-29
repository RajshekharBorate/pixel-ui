import { DocComponentMeta } from '../types';
import { CHART_PIE_EXAMPLES } from '../../examples/pixel-chart-pie';

export const CHART_PIE_META: DocComponentMeta = {
  id: 'pixel-chart-pie',
  title: 'Chart — Pie',
  selector: 'pixel-chart-pie',
  category: 'data-display',
  status: 'stable',
  summary: 'Pie, donut, and semi-donut part-to-whole charts.',
  overview: [
    'pixel-chart-pie renders category share from a slices array.',
    'Modes: pie, donut, semi. Pair with pixel-chart-shell via pieSlicesToLegendSeries and buildPieTable.',
    'Import from pixel-ui/charts; optional peer echarts.',
  ],
  useCases: ['Category share', 'Donut KPI with center total', 'Semi-donut composition'],
  themingNotes: ['Slice colors from palette; center label uses theme text.'],
  accessibilityNotes: [
    'role="img" with ariaLabel; live summary.',
    'Use shell data table (buildPieTable) for keyboard access.',
  ],
  imports: ['PixelChartPieComponent', 'PixelChartShellComponent'],
  inputs: [
    { name: 'slices', type: 'readonly PixelChartPieSlice[]', defaultValue: '[]', description: 'Name + value slices.' },
    { name: 'mode', type: "'pie' | 'donut' | 'semi'", defaultValue: "'pie'", description: 'Layout mode.' },
    { name: 'showValues', type: "boolean | 'auto'", defaultValue: "'auto'", description: 'Percentage labels.' },
    { name: 'showCenterLabel', type: 'boolean', defaultValue: 'true', description: 'Center total (donut/semi).' },
    { name: 'hiddenSliceIds', type: 'readonly string[]', defaultValue: '[]', description: 'Legend-hidden slices.' },
  ],
  outputs: [{ name: 'pointClick', type: 'PixelChartPointClickEvent', description: 'Slice activated.' }],
  examples: CHART_PIE_EXAMPLES,
};
