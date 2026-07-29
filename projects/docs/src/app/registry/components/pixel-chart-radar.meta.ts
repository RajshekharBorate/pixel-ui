import { DocComponentMeta } from '../types';
import { CHART_RADAR_EXAMPLES } from '../../examples/pixel-chart-radar';

export const CHART_RADAR_META: DocComponentMeta = {
  id: 'pixel-chart-radar',
  title: 'Chart — Radar',
  selector: 'pixel-chart-radar',
  category: 'data-display',
  status: 'stable',
  summary: 'Radar charts — line, filled, markers, and target overlay.',
  overview: [
    'pixel-chart-radar compares series across named indicators.',
    'Multi-series is an overlay (not a stack). Modes: line, filled, markers, target.',
    'Import from pixel-ui/charts; optional peer echarts.',
  ],
  useCases: ['Skill profiles', 'Scorecards', 'Actual vs target'],
  themingNotes: ['Series colors from palette; target uses secondary palette color.'],
  accessibilityNotes: [
    'role="img" with ariaLabel; live summary.',
    'Use buildRadarTable with shell for keyboard access.',
  ],
  imports: ['PixelChartRadarComponent', 'PixelChartShellComponent'],
  inputs: [
    { name: 'indicators', type: 'readonly PixelChartRadarIndicator[]', defaultValue: '[]', description: 'Axes.' },
    { name: 'series', type: 'readonly PixelChartSeries[]', defaultValue: '[]', description: 'Values per indicator.' },
    {
      name: 'mode',
      type: "'line' | 'filled' | 'markers' | 'target'",
      defaultValue: "'line'",
      description: 'Visual mode.',
    },
    { name: 'target', type: 'readonly number[] | null', defaultValue: 'null', description: 'Target ring values.' },
  ],
  outputs: [{ name: 'pointClick', type: 'PixelChartPointClickEvent', description: 'Series activated.' }],
  examples: CHART_RADAR_EXAMPLES,
};
