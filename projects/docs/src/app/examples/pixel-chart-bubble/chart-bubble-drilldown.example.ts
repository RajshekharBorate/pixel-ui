import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import {
  PixelBreadcrumbComponent,
  type PixelBreadcrumbClickEvent,
} from 'pixel-ui';
import {
  PixelChartBubbleComponent,
  PixelChartShellComponent,
  drillLevelsToBreadcrumbItems,
  findBubbleHierarchyNode,
  pushDrillLevel,
  truncateDrillLevels,
  type PixelChartBubbleHierarchyNode,
  type PixelChartDrillLevel,
  type PixelChartPointClickEvent,
} from 'pixel-ui/charts';

type PackDrillData = {
  readonly hierarchy: readonly PixelChartBubbleHierarchyNode[];
};

type PackDrillLevel = PixelChartDrillLevel<PackDrillData>;

const PORTFOLIO: readonly PixelChartBubbleHierarchyNode[] = [
  {
    id: 'portfolio',
    name: 'Portfolio',
    children: [
      {
        id: 'growth',
        name: 'Growth',
        children: [
          { id: 'alpha', name: 'Alpha', value: 40 },
          { id: 'beta', name: 'Beta', value: 70 },
          { id: 'gamma', name: 'Gamma', value: 55 },
        ],
      },
      {
        id: 'core',
        name: 'Core',
        children: [
          { id: 'delta', name: 'Delta', value: 90 },
          { id: 'epsilon', name: 'Epsilon', value: 35 },
          { id: 'zeta', name: 'Zeta', value: 48 },
        ],
      },
    ],
  },
];

const ROOT: PackDrillLevel = {
  id: 'portfolio',
  label: 'Portfolio',
  data: { hierarchy: PORTFOLIO },
};

@Component({
  selector: 'docs-chart-bubble-drilldown-example',
  imports: [PixelBreadcrumbComponent, PixelChartShellComponent, PixelChartBubbleComponent],
  template: `
    <pixel-chart-shell
      title="Pack hierarchy drill-down"
      description="Click Growth or Core to focus that subtree. Leaves stay put. Breadcrumb drills up."
      [series]="[]"
      [(showValues)]="showValues"
      [empty]="false"
      [getChart]="chartGetter"
      [exportBreadcrumb]="exportBreadcrumb()"
      exportFileName="bubble-pack-drilldown"
    >
      @if (levels().length > 1) {
        <div pixelChartHeader class="drill-navigation">
          <pixel-breadcrumb
            type="collapsed"
            size="sm"
            [items]="breadcrumbItems()"
            [maxVisibleItems]="4"
            (itemClick)="onBreadcrumb($event)"
          />
        </div>
      }

      <pixel-chart-bubble
        #bubble
        layout="pack"
        drillable
        [hierarchy]="current().data.hierarchy"
        [series]="[]"
        [showValues]="showValues()"
        height="400px"
        ariaLabel="Portfolio pack drill-down"
        (pointClick)="onPointClick($event)"
      />
    </pixel-chart-shell>
    <span class="status-announcement" role="status">{{ status() }}</span>
  `,
  styles: `
    .drill-navigation {
      display: block;
    }

    .status-announcement {
      position: absolute;
      inline-size: 0;
      block-size: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartBubbleDrilldownExample {
  private readonly bubble = viewChild.required(PixelChartBubbleComponent);

  readonly levels = signal<readonly PackDrillLevel[]>([ROOT]);
  readonly showValues = signal(false);
  readonly status = signal('Showing portfolio. Click a group ring to drill in.');

  readonly current = computed(() => {
    const stack = this.levels();
    return stack[stack.length - 1] ?? ROOT;
  });

  readonly breadcrumbItems = computed(() => drillLevelsToBreadcrumbItems(this.levels()));

  readonly exportBreadcrumb = computed(() =>
    this.levels().length > 1 ? this.levels().map((level) => level.label) : [],
  );

  readonly chartGetter = () => this.bubble()?.getChart() ?? null;

  protected onPointClick(event: PixelChartPointClickEvent): void {
    const roots = this.current().data.hierarchy;
    const node = findBubbleHierarchyNode(roots, event.seriesId);
    if (!node?.children?.length) {
      this.status.set(
        `${event.seriesName || event.seriesId} is a leaf — no further drill levels.`,
      );
      return;
    }
    const next: PackDrillLevel = {
      id: node.id ?? node.name,
      label: node.name,
      parentId: this.current().id,
      data: { hierarchy: node.children },
    };
    this.levels.set(pushDrillLevel(this.levels(), next));
    this.status.set(`Showing ${node.name} subtree.`);
  }

  protected onBreadcrumb(event: PixelBreadcrumbClickEvent): void {
    if (event.isLast) {
      return;
    }
    this.levels.set(truncateDrillLevels(this.levels(), event.index));
    this.status.set(
      this.levels().length > 1
        ? `Showing ${this.current().label} subtree.`
        : 'Showing portfolio. Click a group ring to drill in.',
    );
  }
}
