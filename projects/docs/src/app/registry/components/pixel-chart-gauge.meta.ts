import { DocComponentMeta } from '../types';
import { CHART_GAUGE_EXAMPLES } from '../../examples/pixel-chart-gauge';

export const CHART_GAUGE_META: DocComponentMeta = {
  id: 'pixel-chart-gauge',
  title: 'Chart — Gauge',
  selector: 'pixel-chart-gauge',
  category: 'charts',
  status: 'stable',
  summary:
    'KPI gauges — radial, semi, donut, linear, bullet, solid, multi-range, dual, tick, and vertical.',
  overview: [
    'pixel-chart-gauge shows a single value against min/max directly inside the plot.',
    'Arc variants place scale values outside the gauge; linear variants place endpoints on their axes.',
    'Multi-range and tick use tapered needles with raised circular hubs.',
    'There is no separate Min / Max / Value footer.',
    'Import from pixel-ui/charts; optional peer echarts.',
    'When wrapped in pixel-chart-shell, set [empty]="false" because gauges do not use shell series.',
  ],
  useCases: [
    'Arc / donut KPI',
    'Qualitative multi-range and tick gauges',
    'Linear / vertical completion',
    'Bullet actual vs target',
  ],
  themingNotes: [
    'Progress uses palette primary; bullet ranges default to error / warning / success fallbacks.',
  ],
  accessibilityNotes: [
    'role="img" with ariaLabel; live summary includes value and range.',
    'Min, max, and current value are presented within the gauge plot.',
  ],
  imports: ['PixelChartGaugeComponent', 'PixelChartShellComponent'],
  inputs: [
    { name: 'value', type: 'number', defaultValue: '0', description: 'Current value.' },
    { name: 'min', type: 'number', defaultValue: '0', description: 'Scale minimum.' },
    { name: 'max', type: 'number', defaultValue: '100', description: 'Scale maximum.' },
    { name: 'target', type: 'number | null', defaultValue: 'null', description: 'Bullet target.' },
    {
      name: 'variant',
      type:
        "'radial' | 'semi' | 'linear' | 'donut' | 'bullet' | 'solid' | 'multi-range' | 'dual' | 'tick' | 'vertical'",
      defaultValue: "'radial'",
      description: 'Visual variant.',
    },
    { name: 'label', type: 'string', defaultValue: "''", description: 'Center / axis label.' },
  ],
  outputs: [],
  examples: CHART_GAUGE_EXAMPLES,
};
