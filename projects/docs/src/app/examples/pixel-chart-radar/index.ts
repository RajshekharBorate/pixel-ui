import { createDocExample } from '../../shared/example-source.util';
import { ChartRadarBasicExample } from './chart-radar-basic.example';
import { ChartRadarSkeletonExample } from './chart-radar-skeleton.example';

export const CHART_RADAR_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Radar modes',
    category: 'Setup',
    description: 'line / filled / markers / target with multi-series overlay.',
    component: ChartRadarBasicExample,
    imports: ['PixelChartShellComponent', 'PixelChartRadarComponent'],
    html: `<pixel-chart-shell [series]="series()" [getChart]="chartGetter">
  <pixel-chart-radar #radar [indicators]="indicators" [series]="series()" [mode]="mode()" [target]="target" />
</pixel-chart-shell>`,
    typescript: `import { PixelChartRadarComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'skeleton',
    title: 'Loading skeletons',
    category: 'States',
    description:
      'Bind the same showSkeleton on shell (legend stubs) and the chart (plot silhouette) so they reveal together.',
    component: ChartRadarSkeletonExample,
    imports: ['PixelChartShellComponent', 'PixelChartRadarComponent', 'PixelButtonComponent'],
    html: `<pixel-chart-shell [showSkeleton]="showSkeleton()" …>
  <pixel-chart-radar [showSkeleton]="showSkeleton()" … />
</pixel-chart-shell>`,
    typescript: `import { PixelChartRadarComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
];
