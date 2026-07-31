import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { PixelButtonComponent, PixelBreadcrumbComponent,
  type PixelBreadcrumbClickEvent,
 } from 'pixel-ui';
import {
  PixelChartBarComponent,
  PixelChartPieComponent,
  PixelChartShellComponent,
  buildPieTable,
  drillLevelsToBreadcrumbItems,
  pieSlicesToLegendSeries,
  pushDrillLevel,
  truncateDrillLevels,
  type PixelChartDrillLevel,
  type PixelChartPieSlice,
  type PixelChartPointClickEvent,
  type PixelChartSeries,
} from 'pixel-ui/charts';

type PieLevelData = {
  readonly kind: 'pie';
  readonly slices: readonly PixelChartPieSlice[];
};

type BarLevelData = {
  readonly kind: 'bar';
  readonly categories: readonly string[];
  readonly series: readonly PixelChartSeries[];
  readonly xAxisName: string;
  readonly yAxisName: string;
};

type MixDrillLevel = PixelChartDrillLevel<PieLevelData | BarLevelData>;

const ROOT: MixDrillLevel = {
  id: 'channels',
  label: 'Channels',
  data: {
    kind: 'pie',
    slices: [
      { id: 'cloud', name: 'Cloud', value: 38 },
      { id: 'onprem', name: 'On-prem', value: 27 },
      { id: 'saas', name: 'SaaS', value: 22 },
      { id: 'other', name: 'Other', value: 13 },
    ],
  },
};

const BAR_CHILDREN: Readonly<Record<string, MixDrillLevel>> = {
  cloud: {
    id: 'cloud',
    label: 'Cloud',
    parentId: 'channels',
    data: {
      kind: 'bar',
      categories: ['Compute', 'Storage', 'Network', 'Support'],
      series: [{ id: 'share', name: 'Share', data: [16, 10, 7, 5] }],
      xAxisName: 'Line',
      yAxisName: 'Share',
    },
  },
  onprem: {
    id: 'onprem',
    label: 'On-prem',
    parentId: 'channels',
    data: {
      kind: 'bar',
      categories: ['Hardware', 'Licenses', 'Services'],
      series: [{ id: 'share', name: 'Share', data: [12, 9, 6] }],
      xAxisName: 'Line',
      yAxisName: 'Share',
    },
  },
  saas: {
    id: 'saas',
    label: 'SaaS',
    parentId: 'channels',
    data: {
      kind: 'bar',
      categories: ['Seats', 'Add-ons', 'Usage'],
      series: [{ id: 'share', name: 'Share', data: [11, 6, 5] }],
      xAxisName: 'Line',
      yAxisName: 'Share',
    },
  },
  other: {
    id: 'other',
    label: 'Other',
    parentId: 'channels',
    data: {
      kind: 'bar',
      categories: ['Partners', 'Misc'],
      series: [{ id: 'share', name: 'Share', data: [8, 5] }],
      xAxisName: 'Line',
      yAxisName: 'Share',
    },
  },
};

@Component({
  selector: 'docs-chart-pie-drilldown-example',
  imports: [PixelButtonComponent, PixelBreadcrumbComponent,
    PixelChartShellComponent,
    PixelChartPieComponent,
    PixelChartBarComponent,],
  template: `
    <div class="docs-chart-skeleton-demo">

    <pixel-button size="sm" appearance="outline" (click)="showSkeleton.update((v) => !v)">
        {{ showSkeleton() ? 'Hide skeleton' : 'Show skeleton' }}
      </pixel-button>

    <pixel-chart-shell
      title="Pie → bar drill-down"
      description="Click a slice to open a bar breakdown for that channel. Levels may use different chart types."
      [series]="legendSeries()"
      [categories]="barCategories()"
      [tableColumns]="table().columns"
      [tableRows]="table().rows"
      [(hiddenSeriesIds)]="hidden"
      [(showValues)]="showValues"
      [empty]="false"
      [getChart]="chartGetter"
      [exportBreadcrumb]="exportBreadcrumb()"
      exportFileName="pie-bar-drilldown"
     [showSkeleton]="showSkeleton()">
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

      @if (current().data.kind === 'pie') {
        <pixel-chart-pie
          #pie
          [slices]="pieSlices()"
          [hiddenSliceIds]="hidden()"
          [showValues]="showValues()"
          mode="donut"
          drillable
          ariaLabel="Channel share"
          (pointClick)="onSliceClick($event)"
         [showSkeleton]="showSkeleton()" />
      } @else {
        <pixel-chart-bar
          #bar
          [series]="barSeries()"
          [categories]="barCategories()"
          [hiddenSeriesIds]="hidden()"
          [showValues]="showValues()"
          mode="single"
          orientation="vertical"
          [xAxisName]="barAxisNames().x"
          [yAxisName]="barAxisNames().y"
          ariaLabel="Channel line breakdown"
         [showSkeleton]="showSkeleton()" />
      }
    </pixel-chart-shell>
    <span class="status-announcement" role="status">{{ status() }}</span>
    </div>
  `,
  styles: `
    .docs-chart-skeleton-demo {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
      position: relative;
    }

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
export class ChartPieDrilldownExample {
  readonly showSkeleton = signal(false);

  private readonly pie = viewChild(PixelChartPieComponent);
  private readonly bar = viewChild(PixelChartBarComponent);

  readonly levels = signal<readonly MixDrillLevel[]>([ROOT]);
  readonly hidden = signal<readonly string[]>([]);
  readonly showValues = signal(false);
  readonly status = signal('Showing channels. Click a slice to drill into a bar breakdown.');

  readonly current = computed(() => {
    const stack = this.levels();
    return stack[stack.length - 1] ?? ROOT;
  });

  readonly breadcrumbItems = computed(() => drillLevelsToBreadcrumbItems(this.levels()));

  readonly exportBreadcrumb = computed(() =>
    this.levels().length > 1 ? this.levels().map((level) => level.label) : [],
  );

  readonly pieSlices = computed(() => {
    const data = this.current().data;
    return data.kind === 'pie' ? data.slices : [];
  });

  readonly barCategories = computed(() => {
    const data = this.current().data;
    return data.kind === 'bar' ? data.categories : [];
  });

  readonly barSeries = computed(() => {
    const data = this.current().data;
    return data.kind === 'bar' ? data.series : [];
  });

  readonly barAxisNames = computed(() => {
    const data = this.current().data;
    return data.kind === 'bar'
      ? { x: data.xAxisName, y: data.yAxisName }
      : { x: '', y: '' };
  });

  readonly legendSeries = computed(() => {
    const data = this.current().data;
    if (data.kind === 'pie') {
      return pieSlicesToLegendSeries(data.slices);
    }
    return data.series;
  });

  readonly table = computed(() => {
    const data = this.current().data;
    if (data.kind === 'pie') {
      return buildPieTable(data.slices);
    }
    return {
      columns: [
        { key: 'category', header: 'Category' },
        { key: 'value', header: 'Value' },
      ],
      rows: data.categories.map((category, index) => ({
        category,
        value: (data.series[0]?.data[index] as number | null | undefined) ?? null,
      })),
    };
  });

  readonly chartGetter = () =>
    this.current().data.kind === 'pie'
      ? (this.pie()?.getChart() ?? null)
      : (this.bar()?.getChart() ?? null);

  protected onSliceClick(event: PixelChartPointClickEvent): void {
    const child = BAR_CHILDREN[event.seriesId];
    if (!child) {
      this.status.set(`No drill-in for ${event.seriesName || event.seriesId}.`);
      return;
    }
    this.hidden.set([]);
    this.levels.set(pushDrillLevel(this.levels(), child));
    this.status.set(`Showing ${child.label} as a bar breakdown.`);
  }

  protected onBreadcrumb(event: PixelBreadcrumbClickEvent): void {
    if (event.isLast) {
      return;
    }
    this.hidden.set([]);
    this.levels.set(truncateDrillLevels(this.levels(), event.index));
    this.status.set(
      this.levels().length > 1
        ? `Showing ${this.current().label} as a bar breakdown.`
        : 'Showing channels. Click a slice to drill into a bar breakdown.',
    );
  }
}
