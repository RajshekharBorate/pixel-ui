import { createDocExample } from '../../shared/example-source.util';
import { ChartLineBasicExample } from './chart-line-basic.example';
import { ChartLineEnterpriseExample } from './chart-line-enterprise.example';
import { ChartLinePerformanceExample } from './chart-line-performance.example';
import { ChartLinePolishExample } from './chart-line-polish.example';
import { ChartLineTimeExample } from './chart-line-time.example';

export const CHART_LINE_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Line + shell',
    category: 'Setup',
    description:
      'Multi-series line with straight / smooth / step modes. Toggle Show skeleton to preview loading placeholders.',
    component: ChartLineBasicExample,
    imports: ['PixelChartShellComponent', 'PixelChartLineComponent', 'PixelButtonComponent'],
    html: `<pixel-chart-shell [showSkeleton]="showSkeleton()" …>
  <pixel-chart-line [showSkeleton]="showSkeleton()" [mode]="mode()" … />
</pixel-chart-shell>`,
    typescript: `import { PixelChartLineComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'enterprise-formatting',
    title: 'Enterprise formatting',
    category: 'Customization',
    description:
      'Currency labels, target and warning-zone annotations, plus a crosshair pointer. Toggle Show skeleton to preview loading placeholders.',
    component: ChartLineEnterpriseExample,
    imports: ['PixelChartShellComponent', 'PixelChartLineComponent', 'PixelButtonComponent'],
    html: `<pixel-chart-line [showSkeleton]="showSkeleton()" [valueFormat]="currencyFormat" … />`,
    typescript: `import { PixelChartLineComponent, type PixelChartReferenceLine } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'polish',
    title: 'Visual polish',
    category: 'Customization',
    description:
      'Phase 1 knobs: gridLines, lineWidth, markerSize, boundaryGap, and axis titles. Toggle Show skeleton to preview loading placeholders.',
    component: ChartLinePolishExample,
    imports: ['PixelChartShellComponent', 'PixelChartLineComponent', 'PixelButtonComponent'],
    html: `<pixel-chart-line [showSkeleton]="showSkeleton()" [gridLines]="gridLines()" … />`,
    typescript: `import { PixelChartLineComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'performance',
    title: 'Performance (1k / 10k)',
    category: 'Performance',
    description:
      'Stress page for progressive rendering and LTTB sampling. Toggle Show skeleton to preview loading placeholders.',
    component: ChartLinePerformanceExample,
    imports: ['PixelChartShellComponent', 'PixelChartLineComponent', 'PixelButtonComponent'],
    html: `<pixel-chart-line [showSkeleton]="showSkeleton()" [performance]="performance()" … />`,
    typescript: `import { PIXEL_CHART_MAX_POINTS } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'time',
    title: 'Time-series axis',
    category: 'Axes',
    description:
      'xAxisType="time" with Date categories. Toggle Show skeleton to preview loading placeholders.',
    component: ChartLineTimeExample,
    imports: [
      'PixelChartShellComponent',
      'PixelChartLineComponent',
      'provideNativeDateAdapter',
      'PixelButtonComponent',
    ],
    html: `<pixel-chart-line [showSkeleton]="showSkeleton()" [categories]="categories()" xAxisType="time" />`,
    typescript: `providers: [provideNativeDateAdapter()]`,
  }),
];
