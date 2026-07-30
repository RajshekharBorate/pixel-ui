import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import type { EChartsType } from 'echarts/core';
import PixelChartHostComponent from '../pixel-chart/pixel-chart-host';
import {
  buildScatterChartOption,
  buildScatterStats,
  buildScatterTable,
} from '../pixel-chart/builders/scatter-option';
import { PIXEL_CHART_STATS_MAX_N } from '../pixel-chart/builders/scatter-stats';
import { ensureScatterChart } from '../pixel-chart/register/scatter.register';
import type { PixelChartDataZoomMode } from '../pixel-chart/builders/interaction-option';
import type { PixelChartPerformanceMode } from '../pixel-chart/builders/performance-option';
import type {
  PixelChartDataZoomEvent,
  PixelChartPalette,
  PixelChartPointClickEvent,
  PixelChartSeries,
  PixelChartShowValues,
} from '../pixel-chart/pixel-chart.types';

export { PIXEL_CHART_STATS_MAX_N };

let nextId = 0;

ensureScatterChart();

/**
 * Scatter chart facade with optional OLS trendline and Pearson r / R² stats.
 */
@Component({
  selector: 'pixel-chart-scatter',
  imports: [PixelChartHostComponent],
  templateUrl: './pixel-chart-scatter.html',
  styleUrl: './pixel-chart-scatter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-chart-scatter',
    '[id]': 'id() || fallbackId',
    '[attr.data-trendline]': 'showTrendline() ? "" : null',
    '[attr.data-stats]': 'showStats() ? "" : null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
  },
})
export default class PixelChartScatterComponent {
  protected readonly fallbackId = `pixel-chart-scatter-${++nextId}`;

  private readonly host = viewChild(PixelChartHostComponent);

  /**
   * Scatter series (`data` as `[x,y]` points via `PixelChartPoint`).
   *
   * @type {readonly PixelChartSeries[]}
   * @default []
   */
  readonly series = input<readonly PixelChartSeries[]>([]);

  /**
   * Draw OLS trendline across visible points.
   *
   * @type {boolean}
   * @default false
   */
  readonly showTrendline = input(false, { transform: booleanAttribute });

  /**
   * Show r / R² / n footer (subsampled above {@link PIXEL_CHART_STATS_MAX_N}).
   *
   * @type {boolean}
   * @default false
   */
  readonly showStats = input(false, { transform: booleanAttribute });

  /**
   * Value / point labels. Prefer point `label` when present; otherwise y.
   *
   * @type {boolean | 'auto'}
   * @default 'auto'
   * @description `auto` hides labels when the point cloud is dense.
   */
  readonly showValues = input<PixelChartShowValues>('auto');

  /**
   * X-axis title.
   *
   * @type {string}
   * @default ''
   */
  readonly xAxisName = input('');

  /**
   * Y-axis title.
   *
   * @type {string}
   * @default ''
   */
  readonly yAxisName = input('');

  /**
   * Series color palette.
   *
   * @type {PixelChartPalette}
   * @default 'brand'
   */
  readonly palette = input<PixelChartPalette>('brand');

  /**
   * Series ids hidden via legend toggle.
   *
   * @type {readonly string[]}
   * @default []
   */
  readonly hiddenSeriesIds = input<readonly string[]>([]);

  /**
   * Accessible name.
   *
   * @type {string}
   * @default ''
   */
  readonly ariaLabel = input('');

  /**
   * Optional id override.
   *
   * @type {string}
   * @default ''
   */
  readonly id = input('');

  /**
   * Plot height.
   *
   * @type {string | number}
   * @default '320px'
   */
  readonly height = input<string | number>('320px');

  /**
   * Non-interactive muted state.
   *
   * @type {boolean}
   * @default false
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Busy flag.
   *
   * @type {boolean}
   * @default false
   */
  readonly loading = input(false, { transform: booleanAttribute });

  /**
   * Theme rebuild counter.
   *
   * @type {number}
   * @default 0
   */
  readonly themeVersion = input(0);

  /**
   * Zoom: `false` | `inside` | `slider` | `both` | `selection` | `auto`.
   *
   * @type {PixelChartDataZoomMode | 'auto'}
   * @default 'auto'
   */
  readonly dataZoom = input<PixelChartDataZoomMode | 'auto'>('auto');

  /**
   * Progressive rendering for large point clouds.
   *
   * @type {PixelChartPerformanceMode}
   * @default 'auto'
   */
  readonly performance = input<PixelChartPerformanceMode>('auto');

  readonly pointClick = output<PixelChartPointClickEvent>();

  /** dataZoom range changed. */
  readonly dataZoomChange = output<PixelChartDataZoomEvent>();

  protected readonly option = computed(() =>
    buildScatterChartOption({
      series: this.series(),
      showTrendline: this.showTrendline(),
      showValues: this.showValues(),
      hiddenSeriesIds: new Set(this.hiddenSeriesIds()),
      palette: this.palette(),
      xAxisName: this.xAxisName(),
      yAxisName: this.yAxisName(),
      dataZoom: this.dataZoom(),
      performance: this.performance(),
    }),
  );

  protected readonly stats = computed(() =>
    this.showStats()
      ? buildScatterStats(this.series(), new Set(this.hiddenSeriesIds()))
      : null,
  );

  protected readonly statsDisplay = computed(() => {
    const st = this.stats();
    if (!st) {
      return null;
    }
    return {
      n: st.n,
      r: st.r.toFixed(3),
      r2: st.r2.toFixed(3),
    };
  });

  protected readonly summary = computed(() => {
    const n = this.series().reduce((sum, s) => sum + s.data.length, 0);
    const parts = [`${this.series().length} series`, `${n} points`];
    const st = this.stats();
    if (st) {
      parts.push(`r ${st.r.toFixed(3)}`, `R² ${st.r2.toFixed(3)}`);
    }
    return parts.join(', ') + '.';
  });

  protected readonly resolvedAriaLabel = computed(
    () => this.ariaLabel().trim() || this.summary(),
  );

  tableModel(): ReturnType<typeof buildScatterTable> {
    return buildScatterTable(this.series());
  }

  getChart(): EChartsType | null {
    return this.host()?.getChart() ?? null;
  }

  protected onChartClick(event: unknown): void {
    if (this.disabled()) {
      return;
    }
    const e = event as {
      seriesId?: string;
      seriesName?: string;
      dataIndex?: number;
      value?: number[];
      event?: Event;
    };
    if (e.dataIndex == null || !e.value || e.seriesId === '__trendline') {
      return;
    }
    this.pointClick.emit({
      seriesId: String(e.seriesId ?? ''),
      seriesName: e.seriesName ?? '',
      pointIndex: e.dataIndex,
      x: e.value[0] ?? e.dataIndex,
      y: e.value[1] ?? null,
      source: 'mouse',
      originalEvent: e.event ?? new Event('click'),
    });
  }
}
