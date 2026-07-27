import { DocComponentMeta } from '../types';
import { CHART_SCATTER_EXAMPLES } from '../../examples/pixel-chart-scatter';

export const CHART_SCATTER_META: DocComponentMeta = {
  id: 'pixel-chart-scatter',
  title: 'Chart — Scatter',
  selector: 'pixel-chart-scatter',
  category: 'data-display',
  status: 'experimental',
  summary: 'Scatter plots with optional trendline and r / R² stats.',
  overview: [
    'pixel-chart-scatter plots numeric x/y points with multi-series overlays.',
    'Optional OLS trendline and Pearson stats footer (subsampled above 5000 points).',
    'Import from pixel-ui/charts; optional peer echarts.',
  ],
  useCases: ['Correlation', 'Multi-series overlays', 'Trend + stats'],
  themingNotes: ['Point colors from palette; trendline uses primary series color.'],
  accessibilityNotes: [
    'role="img" with ariaLabel; live summary.',
    'Use shell table via buildScatterTable for keyboard access.',
  ],
  imports: ['PixelChartScatterComponent', 'PixelChartShellComponent'],
  inputs: [
    { name: 'series', type: 'readonly PixelChartSeries[]', defaultValue: '[]', description: 'Point series.' },
    { name: 'showTrendline', type: 'boolean', defaultValue: 'false', description: 'OLS trendline.' },
    { name: 'showStats', type: 'boolean', defaultValue: 'false', description: 'n / r / R² footer.' },
  ],
  outputs: [{ name: 'pointClick', type: 'PixelChartPointClickEvent', description: 'Point activated.' }],
  examples: CHART_SCATTER_EXAMPLES,
};
