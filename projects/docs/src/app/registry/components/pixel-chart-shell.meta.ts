import { DocComponentMeta } from '../types';
import { CHART_BAR_EXAMPLES } from '../../examples/pixel-chart-bar';

export const CHART_SHELL_META: DocComponentMeta = {
  id: 'pixel-chart-shell',
  title: 'Chart — Shell',
  selector: 'pixel-chart-shell',
  category: 'data-display',
  status: 'experimental',
  summary:
    'Dashboard card chrome for charts: title, export/expand actions, legend, data table, loading and empty states.',
  overview: [
    'pixel-chart-shell wraps any plot (e.g. pixel-chart-bar) with enterprise card chrome from the chart mockups.',
    'Expand uses the Fullscreen API on the shell host (Escape exits).',
    'PNG export needs getChart pointing at the plot’s getChart().',
    'Table CSV uses PixelExportService.',
  ],
  useCases: [
    'Dashboard chart cards',
    'Accessible data table companion to a canvas chart',
    'Consistent export / expand actions across chart types',
  ],
  themingNotes: [
    'Override --pixel-chart-shell-bg, --pixel-chart-shell-border, --pixel-chart-shell-padding.',
    'Uses container queries for toolbar wrapping on narrow cards.',
  ],
  accessibilityNotes: [
    'Legend items are buttons with aria-pressed.',
    'Data table includes a caption; collapse via More menu.',
    'Action icons expose aria-label; ≥44px hit targets.',
  ],
  imports: ['PixelChartShellComponent'],
  inputs: [
    { name: 'title', type: 'string', defaultValue: "''", description: 'Card title.' },
    { name: 'description', type: 'string', defaultValue: "''", description: 'Subtitle.' },
    { name: 'series', type: 'readonly PixelChartSeries[]', defaultValue: '[]', description: 'Legend + table series.' },
    { name: 'categories', type: 'readonly string[]', defaultValue: '[]', description: 'Table categories.' },
    { name: 'showTable', type: 'boolean', defaultValue: 'true', description: 'Show data table.' },
    { name: 'loading', type: 'boolean', defaultValue: 'false', description: 'Loader overlay.' },
    { name: 'showSkeleton', type: 'boolean', defaultValue: 'false', description: 'Skeleton placeholder.' },
    { name: 'getChart', type: '() => EChartsType | null', defaultValue: '() => null', description: 'PNG export source.' },
  ],
  outputs: [
    { name: 'legendToggle', type: 'PixelChartLegendToggleEvent', description: 'Series visibility changed.' },
  ],
  examples: CHART_BAR_EXAMPLES,
};
