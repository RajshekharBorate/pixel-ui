import { createDocExample } from '../../shared/example-source.util';
import { ChartLineBasicExample } from './chart-line-basic.example';
import { ChartLineEnterpriseExample } from './chart-line-enterprise.example';
import { ChartLinePerformanceExample } from './chart-line-performance.example';
import { ChartLinePolishExample } from './chart-line-polish.example';
import { ChartLineSkeletonExample } from './chart-line-skeleton.example';
import { ChartLineTimeExample } from './chart-line-time.example';

export const CHART_LINE_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Line + shell',
    category: 'Setup',
    description: 'Multi-series line with straight / smooth / step modes inside the chart shell.',
    component: ChartLineBasicExample,
    imports: ['PixelChartShellComponent', 'PixelChartLineComponent'],
    html: `<pixel-chart-line [mode]="mode()" [series]="series()" [categories]="categories()" />`,
    typescript: `import { PixelChartLineComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'skeleton',
    title: 'Loading skeletons',
    category: 'States',
    description:
      'Bind showSkeleton on the chart facade (select-style). Shell keeps title/legend; the plot shows a type-specific silhouette.',
    component: ChartLineSkeletonExample,
    imports: ['PixelChartShellComponent', 'PixelChartLineComponent', 'PixelButtonComponent'],
    html: `<pixel-chart-shell …>
  <pixel-chart-line [showSkeleton]="showSkeleton()" … />
</pixel-chart-shell>`,
    typescript: `import { PixelChartLineComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'enterprise-formatting',
    title: 'Enterprise formatting',
    category: 'Customization',
    description:
      'Currency labels, target and warning-zone annotations, plus a crosshair pointer. Matching syncGroup values link chart hosts.',
    component: ChartLineEnterpriseExample,
    imports: ['PixelChartShellComponent', 'PixelChartLineComponent'],
    html: `<pixel-chart-line [valueFormat]="currencyFormat" [referenceLines]="referenceLines" [referenceBands]="referenceBands" axisPointer="cross" syncGroup="docs-line-sync" />`,
    typescript: `import { PixelChartLineComponent, type PixelChartReferenceLine } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'polish',
    title: 'Visual polish',
    category: 'Customization',
    description:
      'Phase 1 knobs: gridLines, lineWidth, markerSize, boundaryGap, and axis titles.',
    component: ChartLinePolishExample,
    imports: ['PixelChartShellComponent', 'PixelChartLineComponent'],
    html: `<pixel-chart-line [gridLines]="gridLines()" [lineWidth]="lineWidth()" [markerSize]="10" />`,
    typescript: `import { PixelChartLineComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'performance',
    title: 'Performance (1k / 10k)',
    category: 'Performance',
    description:
      'Stress page for progressive rendering and LTTB sampling. Toggle point count and performance mode.',
    component: ChartLinePerformanceExample,
    imports: ['PixelChartShellComponent', 'PixelChartLineComponent'],
    html: `<pixel-chart-line [series]="series()" [categories]="categories()" [performance]="performance()" />`,
    typescript: `import { PIXEL_CHART_MAX_POINTS } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'time',
    title: 'Time-series axis',
    category: 'Axes',
    description: 'xAxisType="time" with Date categories; optional PixelDateAdapter for labels.',
    component: ChartLineTimeExample,
    imports: ['PixelChartShellComponent', 'PixelChartLineComponent', 'provideNativeDateAdapter'],
    html: `<pixel-chart-line [categories]="categories()" xAxisType="time" />`,
    typescript: `providers: [provideNativeDateAdapter()]`,
  }),
];
