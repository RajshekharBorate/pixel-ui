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
  PixelChartBarComponent,
  PixelChartShellComponent,
  drillLevelsToBreadcrumbItems,
  pushDrillLevel,
  truncateDrillLevels,
  type PixelChartDrillLevel,
  type PixelChartPointClickEvent,
  type PixelChartSeries,
} from 'pixel-ui/charts';

type BarDrillData = {
  readonly categories: readonly string[];
  readonly series: readonly PixelChartSeries[];
  readonly xAxisName: string;
  readonly yAxisName: string;
};

type BarDrillLevel = PixelChartDrillLevel<BarDrillData>;

const ROOT: BarDrillLevel = {
  id: 'regions',
  label: 'Regions',
  data: {
    categories: ['West', 'East', 'Central', 'South'],
    series: [{ id: 'revenue', name: 'Revenue', data: [420, 380, 310, 290] }],
    xAxisName: 'Region',
    yAxisName: 'Revenue (K)',
  },
};

const CHILDREN: Readonly<Record<string, BarDrillLevel>> = {
  West: {
    id: 'west',
    label: 'West',
    parentId: 'regions',
    data: {
      categories: ['SF', 'LA', 'Seattle', 'Denver'],
      series: [{ id: 'revenue', name: 'Revenue', data: [140, 120, 95, 65] }],
      xAxisName: 'City',
      yAxisName: 'Revenue (K)',
    },
  },
  East: {
    id: 'east',
    label: 'East',
    parentId: 'regions',
    data: {
      categories: ['NYC', 'Boston', 'DC', 'Atlanta'],
      series: [{ id: 'revenue', name: 'Revenue', data: [150, 90, 80, 60] }],
      xAxisName: 'City',
      yAxisName: 'Revenue (K)',
    },
  },
  Central: {
    id: 'central',
    label: 'Central',
    parentId: 'regions',
    data: {
      categories: ['Chicago', 'Dallas', 'Minneapolis'],
      series: [{ id: 'revenue', name: 'Revenue', data: [130, 100, 80] }],
      xAxisName: 'City',
      yAxisName: 'Revenue (K)',
    },
  },
  South: {
    id: 'south',
    label: 'South',
    parentId: 'regions',
    data: {
      categories: ['Miami', 'Houston', 'Austin'],
      series: [{ id: 'revenue', name: 'Revenue', data: [110, 100, 80] }],
      xAxisName: 'City',
      yAxisName: 'Revenue (K)',
    },
  },
};

@Component({
  selector: 'docs-chart-bar-drilldown-example',
  imports: [PixelBreadcrumbComponent, PixelChartShellComponent, PixelChartBarComponent],
  template: `
    <pixel-chart-shell
      title="Category drill-down"
      description="Click a region column to open cities. Breadcrumb drills up; export trail follows the stack."
      [series]="current().data.series"
      [categories]="current().data.categories"
      [empty]="false"
      [getChart]="chartGetter"
      [exportBreadcrumb]="exportBreadcrumb()"
      exportFileName="bar-category-drilldown"
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

      <pixel-chart-bar
        #bar
        [series]="current().data.series"
        [categories]="current().data.categories"
        mode="single"
        orientation="vertical"
        [xAxisName]="current().data.xAxisName"
        [yAxisName]="current().data.yAxisName"
        valueSuffix="K"
        ariaLabel="Revenue by category drill-down"
        drillable
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
export class ChartBarDrilldownExample {
  private readonly bar = viewChild.required(PixelChartBarComponent);

  readonly levels = signal<readonly BarDrillLevel[]>([ROOT]);
  readonly status = signal('Showing regions. Click a column to drill in.');

  readonly current = computed(() => {
    const stack = this.levels();
    return stack[stack.length - 1] ?? ROOT;
  });

  readonly breadcrumbItems = computed(() => drillLevelsToBreadcrumbItems(this.levels()));

  readonly exportBreadcrumb = computed(() =>
    this.levels().length > 1 ? this.levels().map((level) => level.label) : [],
  );

  readonly chartGetter = () => this.bar()?.getChart() ?? null;

  protected onPointClick(event: PixelChartPointClickEvent): void {
    if (this.levels().length > 1) {
      return;
    }
    const key = String(event.x);
    const child = CHILDREN[key];
    if (!child) {
      this.status.set(`No drill-in for ${key}.`);
      return;
    }
    this.levels.set(pushDrillLevel(this.levels(), child));
    this.status.set(`Showing ${child.label} cities.`);
  }

  protected onBreadcrumb(event: PixelBreadcrumbClickEvent): void {
    if (event.isLast) {
      return;
    }
    this.levels.set(truncateDrillLevels(this.levels(), event.index));
    const current = this.levels()[this.levels().length - 1];
    this.status.set(
      this.levels().length > 1
        ? `Showing ${current?.label ?? ''} cities.`
        : 'Showing regions. Click a column to drill in.',
    );
  }
}
