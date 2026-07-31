import { DocComponentMeta } from '../types';
import { CHART_BAR_EXAMPLES } from '../../examples/pixel-chart-bar';

export const CHART_SHELL_META: DocComponentMeta = {
  id: 'pixel-chart-shell',
  title: 'Chart — Shell',
  selector: 'pixel-chart-shell',
  category: 'charts',
  status: 'stable',
  summary:
    'Dashboard card chrome for charts: title, actions, legend, loading/empty. Pair showSkeleton with the projected chart for legend stubs + plot silhouette.',
  overview: [
    'pixel-chart-shell wraps any plot (e.g. pixel-chart-bar) in a pixel-card with enterprise chart chrome.',
    'Bind showSkeleton on both the shell (legend stubs) and the chart facade (plot) so they reveal together.',
    'Expand uses the Fullscreen API on the shell host (Escape exits). Overlay menus remount under fullscreen.',
    'PNG / SVG export needs getChart pointing at the plot’s getChart(). CSV is download-only (no inline table).',
    'The ⋯ menu toggles showValues for area, line, bar, pie, radar, scatter, and bubble.',
  ],
  useCases: [
    'Dashboard chart cards',
    'Consistent export / expand actions across chart types',
  ],
  themingNotes: [
    'Override --pixel-chart-shell-bg, --pixel-chart-shell-border, --pixel-chart-shell-padding.',
    'Typography uses --pixel-sys-font-family / label tokens.',
  ],
  accessibilityNotes: [
    'Legend items are buttons with aria-pressed.',
    'Download and fullscreen are icon buttons with aria-label; ≥44px hit targets.',
  ],
  imports: ['PixelChartShellComponent'],
  inputs: [
    { name: 'title', type: 'string', defaultValue: "''", description: 'Card title.' },
    { name: 'description', type: 'string', defaultValue: "''", description: 'Subtitle.' },
    { name: 'series', type: 'readonly PixelChartSeries[]', defaultValue: '[]', description: 'Legend (+ CSV) series.' },
    { name: 'categories', type: 'readonly string[]', defaultValue: '[]', description: 'CSV categories.' },
    { name: 'appearance', type: "'outlined' | 'elevated' | 'filled'", defaultValue: "'outlined'", description: 'Card appearance.' },
    { name: 'showMoreMenu', type: 'boolean', defaultValue: 'true', description: 'Show ⋯ display options menu.' },
    { name: 'showValueToggle', type: 'boolean', defaultValue: 'true', description: 'Show values item in more menu.' },
    { name: 'showValues', type: 'boolean', defaultValue: 'false', description: 'Two-way plot value labels.' },
    { name: 'loading', type: 'boolean', defaultValue: 'false', description: 'Loader overlay.' },
    { name: 'showSkeleton', type: 'boolean', defaultValue: 'false', description: 'Legend chip stubs; pair with facade showSkeleton for coordinated reveal.' },
    { name: 'skeletonVariant', type: 'PixelSkeletonChartVariant', defaultValue: "'bar'", description: 'Deprecated / unused — plot silhouette is on the facade.' },
    { name: 'getChart', type: '() => EChartsType | null', defaultValue: '() => null', description: 'Image export source.' },
  ],
  outputs: [
    { name: 'legendToggle', type: 'PixelChartLegendToggleEvent', description: 'Series visibility changed.' },
  ],
  examples: CHART_BAR_EXAMPLES,
};
