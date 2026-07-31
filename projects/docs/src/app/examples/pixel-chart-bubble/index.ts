import { createDocExample } from '../../shared/example-source.util';
import { ChartBubbleBasicExample } from './chart-bubble-basic.example';
import { ChartBubbleDrilldownExample } from './chart-bubble-drilldown.example';

export const CHART_BUBBLE_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Bubble',
    category: 'Setup',
    description:
      'x / y / size bubbles with shell legend and export. Toggle Show skeleton to preview loading placeholders.',
    component: ChartBubbleBasicExample,
    imports: ['PixelChartShellComponent', 'PixelChartBubbleComponent', 'PixelButtonComponent'],
    html: `<pixel-chart-shell [showSkeleton]="showSkeleton()" [series]="legendSeries()" …>
  <pixel-chart-bubble [showSkeleton]="showSkeleton()" [series]="series()" … />
</pixel-chart-shell>`,
    typescript: `import { PixelChartBubbleComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'drilldown',
    title: 'Pack hierarchy drill-down',
    category: 'Interaction',
    description:
      'Click a pack group to focus its children; breadcrumb drills up. Leaves do not drill. Toggle Show skeleton to preview loading placeholders.',
    component: ChartBubbleDrilldownExample,
    imports: [
      'PixelChartShellComponent',
      'PixelChartBubbleComponent',
      'PixelBreadcrumbComponent',
      'PixelButtonComponent',
    ],
    html: `<pixel-chart-bubble [showSkeleton]="showSkeleton()" layout="pack" drillable … />`,
    typescript: `import {
  findBubbleHierarchyNode,
  pushDrillLevel,
  truncateDrillLevels,
} from 'pixel-ui/charts';`,
  }),
];
