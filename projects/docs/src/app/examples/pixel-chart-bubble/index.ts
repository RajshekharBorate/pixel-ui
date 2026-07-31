import { createDocExample } from '../../shared/example-source.util';
import { ChartBubbleBasicExample } from './chart-bubble-basic.example';
import { ChartBubbleDrilldownExample } from './chart-bubble-drilldown.example';
import { ChartBubbleSkeletonExample } from './chart-bubble-skeleton.example';

export const CHART_BUBBLE_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Bubble',
    category: 'Setup',
    description: 'x / y / size bubbles with shell legend and export.',
    component: ChartBubbleBasicExample,
    imports: ['PixelChartShellComponent', 'PixelChartBubbleComponent'],
    html: `<pixel-chart-shell [series]="legendSeries()" [getChart]="chartGetter">
  <pixel-chart-bubble #bubble [series]="series()" />
</pixel-chart-shell>`,
    typescript: `import { PixelChartBubbleComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'skeleton',
    title: 'Loading skeletons',
    category: 'States',
    description:
      'Bind the same showSkeleton on shell (legend stubs) and the chart (plot silhouette) so they reveal together.',
    component: ChartBubbleSkeletonExample,
    imports: ['PixelChartShellComponent', 'PixelChartBubbleComponent', 'PixelButtonComponent'],
    html: `<pixel-chart-shell [showSkeleton]="showSkeleton()" …>
  <pixel-chart-bubble [showSkeleton]="showSkeleton()" … />
</pixel-chart-shell>`,
    typescript: `import { PixelChartBubbleComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'drilldown',
    title: 'Pack hierarchy drill-down',
    category: 'Interaction',
    description:
      'Click a pack group to focus its children; breadcrumb drills up. Leaves do not drill.',
    component: ChartBubbleDrilldownExample,
    imports: ['PixelChartShellComponent', 'PixelChartBubbleComponent', 'PixelBreadcrumbComponent'],
    html: `<pixel-chart-bubble layout="pack" drillable [hierarchy]="…" (pointClick)="onPointClick($event)" />`,
    typescript: `import {
  findBubbleHierarchyNode,
  pushDrillLevel,
  truncateDrillLevels,
} from 'pixel-ui/charts';`,
  }),
];
