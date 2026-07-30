import { DocComponentMeta } from '../types';
import { CHART_SCATTER_EXAMPLES } from '../../examples/pixel-chart-scatter';

export const CHART_SCATTER_META: DocComponentMeta = {
  id: 'pixel-chart-scatter',
  title: 'Chart — Scatter',
  selector: 'pixel-chart-scatter',
  category: 'charts',
  status: 'stable',
  summary: 'Scatter plots with optional trendline and point labels.',
  overview: [
    'pixel-chart-scatter plots numeric x/y points with multi-series overlays.',
    'Optional OLS trendline; no separate regression-statistics footer.',
    'Pair with shell [(showValues)] for point labels; optional axis titles.',
    'Import from pixel-ui/charts; optional peer echarts.',
  ],
  useCases: ['Correlation', 'Multi-series overlays', 'Trendline analysis'],
  themingNotes: ['Point colors from palette; trendline uses primary series color.'],
  accessibilityNotes: [
    'role="img" with ariaLabel; live summary.',
    'Use shell table via buildScatterTable for keyboard access.',
  ],
  imports: ['PixelChartScatterComponent', 'PixelChartShellComponent'],
  inputs: [
    { name: 'series', type: 'readonly PixelChartSeries[]', defaultValue: '[]', description: 'Point series.' },
    { name: 'showTrendline', type: 'boolean', defaultValue: 'false', description: 'OLS trendline.' },
    { name: 'showValues', type: "boolean | 'auto'", defaultValue: "'auto'", description: 'Point labels.' },
    { name: 'xAxisName', type: 'string', defaultValue: "''", description: 'X-axis title.' },
    { name: 'yAxisName', type: 'string', defaultValue: "''", description: 'Y-axis title.' },
  ],
  outputs: [{ name: 'pointClick', type: 'PixelChartPointClickEvent', description: 'Point activated.' }],
  examples: CHART_SCATTER_EXAMPLES,
};
