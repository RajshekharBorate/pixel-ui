import { DocComponentMeta } from '../types';
import { CHART_GAUGE_EXAMPLES } from '../../examples/pixel-chart-gauge';

export const CHART_GAUGE_META: DocComponentMeta = {
  id: 'pixel-chart-gauge',
  title: 'Chart — Gauge',
  selector: 'pixel-chart-gauge',
  category: 'data-display',
  status: 'experimental',
  summary: 'KPI gauges — radial, semi, donut, linear, and bullet.',
  overview: [
    'pixel-chart-gauge shows a single value against min/max with a Min / Max / Value footer.',
    'Phase 1b variants: radial, semi, linear, donut, bullet. Advanced gauges land in Phase 2.',
    'Import from pixel-ui/charts; optional peer echarts.',
    'When wrapped in pixel-chart-shell, set [empty]="false" because gauges do not use shell series.',
  ],
  useCases: ['Arc / donut KPI', 'Linear completion', 'Bullet actual vs target'],
  themingNotes: [
    'Progress uses palette primary; bullet ranges default to error / warning / success fallbacks.',
  ],
  accessibilityNotes: [
    'role="img" with ariaLabel; live summary includes value and range.',
    'Footer repeats min / max / value visually.',
  ],
  imports: ['PixelChartGaugeComponent', 'PixelChartShellComponent'],
  inputs: [
    { name: 'value', type: 'number', defaultValue: '0', description: 'Current value.' },
    { name: 'min', type: 'number', defaultValue: '0', description: 'Scale minimum.' },
    { name: 'max', type: 'number', defaultValue: '100', description: 'Scale maximum.' },
    { name: 'target', type: 'number | null', defaultValue: 'null', description: 'Bullet target.' },
    {
      name: 'variant',
      type: "'radial' | 'semi' | 'linear' | 'donut' | 'bullet'",
      defaultValue: "'radial'",
      description: 'Visual variant.',
    },
    { name: 'label', type: 'string', defaultValue: "''", description: 'Center / axis label.' },
  ],
  outputs: [],
  examples: CHART_GAUGE_EXAMPLES,
};
