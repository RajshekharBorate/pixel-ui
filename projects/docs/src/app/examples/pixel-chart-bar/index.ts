import { createDocExample } from '../../shared/example-source.util';
import { ChartBarBasicExample } from './chart-bar-basic.example';
import { ChartBarDrilldownExample } from './chart-bar-drilldown.example';
import { ChartBarLinkedDrilldownExample } from './chart-bar-linked-drilldown.example';
import { ChartBarModesExample } from './chart-bar-modes.example';

const IMPORTS = ['PixelChartShellComponent', 'PixelChartBarComponent', 'PixelButtonComponent'] as const;

export const CHART_BAR_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Column + shell',
    category: 'Setup',
    description:
      'Single-series vertical bars inside pixel-chart-shell (legend, export). Toggle Show skeleton to preview loading placeholders.',
    component: ChartBarBasicExample,
    imports: [...IMPORTS],
    html: `<pixel-chart-shell [showSkeleton]="showSkeleton()" title="Sales" …>
  <pixel-chart-bar [showSkeleton]="showSkeleton()" mode="single" … />
</pixel-chart-shell>`,
    typescript: `import { PixelChartBarComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'modes',
    title: 'Modes & orientation',
    category: 'Variants',
    description: 'grouped / stacked / percent and horizontal bars. Toggle Show skeleton to preview loading placeholders.',
    component: ChartBarModesExample,
    imports: [...IMPORTS],
    html: `<pixel-chart-bar [showSkeleton]="showSkeleton()" [mode]="mode()" [orientation]="orientation()" … />`,
    typescript: `import { PixelChartBarComponent, PixelChartShellComponent } from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'drilldown',
    title: 'Category drill-down',
    category: 'Interaction',
    description:
      'Consumer-owned stack: click a region bar to open cities; breadcrumb drills up. Toggle Show skeleton to preview loading placeholders.',
    component: ChartBarDrilldownExample,
    imports: [...IMPORTS, 'PixelBreadcrumbComponent'],
    html: `<pixel-chart-shell [showSkeleton]="showSkeleton()" [exportBreadcrumb]="exportBreadcrumb()">
  <pixel-breadcrumb pixelChartHeader … (itemClick)="onBreadcrumb($event)" />
  <pixel-chart-bar [showSkeleton]="showSkeleton()" drillable (pointClick)="onPointClick($event)" … />
</pixel-chart-shell>`,
    typescript: `import {
  drillLevelsToBreadcrumbItems,
  pushDrillLevel,
  truncateDrillLevels,
} from 'pixel-ui/charts';`,
  }),
  createDocExample({
    id: 'linked-drilldown',
    title: 'Linked bar + pie',
    category: 'Interaction',
    description:
      'One shared drill stack updates both a bar and a pie. Legend toggles sync; PNG/PDF export stitches both plots. Toggle Show skeleton to preview loading placeholders.',
    component: ChartBarLinkedDrilldownExample,
    imports: [...IMPORTS, 'PixelChartPieComponent', 'PixelBreadcrumbComponent'],
    html: `<pixel-chart-shell [showSkeleton]="showSkeleton()" [getCharts]="chartsGetter" …>
  <pixel-chart-bar [showSkeleton]="showSkeleton()" mode="stacked" drillable … />
  <pixel-chart-pie [showSkeleton]="showSkeleton()" drillable … />
</pixel-chart-shell>`,
    typescript: `import { pushDrillLevel, truncateDrillLevels, exportChartsPng } from 'pixel-ui/charts';`,
  }),
];
