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
  PixelChartPieComponent,
  PixelChartShellComponent,
  buildPieTable,
  drillLevelsToBreadcrumbItems,
  pieSlicesToLegendSeries,
  pushDrillLevel,
  resolvePixelChartPaletteColors,
  truncateDrillLevels,
  type PixelChartDrillLevel,
  type PixelChartPieSlice,
  type PixelChartPointClickEvent,
  type PixelChartSeries,
} from 'pixel-ui/charts';

type LinkedData = {
  readonly categories: readonly string[];
  /** One series per category so legend ids / colors match the pie slices. */
  readonly series: readonly PixelChartSeries[];
  readonly slices: readonly PixelChartPieSlice[];
  readonly xAxisName: string;
};

type LinkedLevel = PixelChartDrillLevel<LinkedData>;

const PALETTE = resolvePixelChartPaletteColors('brand');

function levelFromPairs(
  id: string,
  label: string,
  pairs: readonly { id: string; name: string; value: number }[],
  xAxisName: string,
  parentId?: string,
): LinkedLevel {
  const categories = pairs.map((p) => p.name);
  const slices: PixelChartPieSlice[] = pairs.map((p, index) => ({
    id: p.id,
    name: p.name,
    value: p.value,
    color: PALETTE[index % PALETTE.length],
  }));
  // Stacked columns with a single non-zero cell → per-category colors + legend sync.
  const series: PixelChartSeries[] = pairs.map((p, index) => ({
    id: p.id,
    name: p.name,
    color: PALETTE[index % PALETTE.length],
    data: pairs.map((_, j) => (j === index ? p.value : 0)),
  }));
  return {
    id,
    label,
    parentId,
    data: { categories, series, slices, xAxisName },
  };
}

const ROOT = levelFromPairs(
  'regions',
  'Regions',
  [
    { id: 'West', name: 'West', value: 420 },
    { id: 'East', name: 'East', value: 380 },
    { id: 'Central', name: 'Central', value: 310 },
  ],
  'Region',
);

const CHILDREN: Readonly<Record<string, LinkedLevel>> = {
  West: levelFromPairs(
    'west',
    'West',
    [
      { id: 'SF', name: 'SF', value: 160 },
      { id: 'LA', name: 'LA', value: 140 },
      { id: 'Seattle', name: 'Seattle', value: 120 },
    ],
    'City',
    'regions',
  ),
  East: levelFromPairs(
    'east',
    'East',
    [
      { id: 'NYC', name: 'NYC', value: 170 },
      { id: 'Boston', name: 'Boston', value: 120 },
      { id: 'DC', name: 'DC', value: 90 },
    ],
    'City',
    'regions',
  ),
  Central: levelFromPairs(
    'central',
    'Central',
    [
      { id: 'Chicago', name: 'Chicago', value: 130 },
      { id: 'Dallas', name: 'Dallas', value: 100 },
      { id: 'Minneapolis', name: 'Minneapolis', value: 80 },
    ],
    'City',
    'regions',
  ),
};

@Component({
  selector: 'docs-chart-bar-linked-drilldown-example',
  imports: [
    PixelBreadcrumbComponent,
    PixelChartShellComponent,
    PixelChartBarComponent,
    PixelChartPieComponent,
  ],
  template: `
    <pixel-chart-shell
      title="Linked bar + pie drill-down"
      description="One shared stack drives both plots. Click either chart to drill; breadcrumb updates both. PNG/PDF/SVG export stitches both plots."
      [series]="legendSeries()"
      [categories]="current().data.categories"
      [tableColumns]="table().columns"
      [tableRows]="table().rows"
      [(hiddenSeriesIds)]="hidden"
      [empty]="false"
      [getChart]="chartGetter"
      [getCharts]="chartsGetter"
      [exportBreadcrumb]="exportBreadcrumb()"
      exportFileName="linked-bar-pie-drilldown"
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

      <div class="linked-plots">
        <pixel-chart-bar
          #bar
          drillable
          mode="stacked"
          orientation="vertical"
          [series]="current().data.series"
          [categories]="current().data.categories"
          [hiddenSeriesIds]="hidden()"
          [xAxisName]="current().data.xAxisName"
          yAxisName="Revenue (K)"
          valueSuffix="K"
          height="280px"
          ariaLabel="Revenue bars for linked drill-down"
          (pointClick)="onBarClick($event)"
        />
        <pixel-chart-pie
          #pie
          drillable
          mode="donut"
          [slices]="current().data.slices"
          [hiddenSliceIds]="hidden()"
          height="280px"
          ariaLabel="Revenue share for linked drill-down"
          (pointClick)="onPieClick($event)"
        />
      </div>
    </pixel-chart-shell>
    <span class="status-announcement" role="status">{{ status() }}</span>
  `,
  styles: `
    .drill-navigation {
      display: block;
    }

    .linked-plots {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
      gap: var(--pixel-sys-space-md, 1rem);
      align-items: stretch;
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
export class ChartBarLinkedDrilldownExample {
  private readonly bar = viewChild.required(PixelChartBarComponent);
  private readonly pie = viewChild(PixelChartPieComponent);

  readonly levels = signal<readonly LinkedLevel[]>([ROOT]);
  readonly hidden = signal<readonly string[]>([]);
  readonly status = signal('Showing regions on both charts. Click either to drill in.');

  readonly current = computed(() => {
    const stack = this.levels();
    return stack[stack.length - 1] ?? ROOT;
  });

  readonly breadcrumbItems = computed(() => drillLevelsToBreadcrumbItems(this.levels()));

  readonly exportBreadcrumb = computed(() =>
    this.levels().length > 1 ? this.levels().map((level) => level.label) : [],
  );

  readonly legendSeries = computed(() => pieSlicesToLegendSeries(this.current().data.slices));

  readonly table = computed(() => buildPieTable(this.current().data.slices));

  readonly chartGetter = () => this.bar()?.getChart() ?? this.pie()?.getChart() ?? null;

  readonly chartsGetter = () => [this.bar()?.getChart() ?? null, this.pie()?.getChart() ?? null];

  protected onBarClick(event: PixelChartPointClickEvent): void {
    this.drillTo(event.seriesId || String(event.x));
  }

  protected onPieClick(event: PixelChartPointClickEvent): void {
    this.drillTo(event.seriesId || String(event.x));
  }

  protected onBreadcrumb(event: PixelBreadcrumbClickEvent): void {
    if (event.isLast) {
      return;
    }
    this.hidden.set([]);
    this.levels.set(truncateDrillLevels(this.levels(), event.index));
    this.status.set(
      this.levels().length > 1
        ? `Showing ${this.current().label} on both charts.`
        : 'Showing regions on both charts. Click either to drill in.',
    );
  }

  private drillTo(key: string): void {
    if (this.levels().length > 1) {
      return;
    }
    const child = CHILDREN[key];
    if (!child) {
      this.status.set(`No linked drill for ${key}.`);
      return;
    }
    this.hidden.set([]);
    this.levels.set(pushDrillLevel(this.levels(), child));
    this.status.set(`Showing ${child.label} on both charts.`);
  }
}
