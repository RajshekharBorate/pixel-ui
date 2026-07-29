import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import type { EChartsType } from 'echarts/core';
import PixelChartHostComponent from '../pixel-chart/pixel-chart-host';
import { buildChartSummary } from '../pixel-chart/a11y/chart-summary';
import {
  buildLineChartOption,
  type PixelChartLineMode,
} from '../pixel-chart/builders/line-option';
import type { PixelChartDataZoomMode } from '../pixel-chart/builders/interaction-option';
import type { PixelChartPerformanceMode } from '../pixel-chart/builders/performance-option';
import {
  formatChartAxisLabel,
  type PixelChartAxisValue,
  type PixelChartXAxisType,
} from '../pixel-chart/builders/time-axis';
import { ensureLineChart } from '../pixel-chart/register/line.register';
import type {
  PixelChartDataZoomEvent,
  PixelChartPalette,
  PixelChartPointClickEvent,
  PixelChartSeries,
  PixelChartShowValues,
} from '../pixel-chart/pixel-chart.types';
import { PIXEL_DATE_ADAPTER, type PixelDateAdapter } from '../shared/datetime/pixel-date-adapter';

export type { PixelChartLineMode };

let nextId = 0;

ensureLineChart();

/**
 * Line chart facade (straight, smooth, or step; single or multi-series).
 *
 * For filled area under the line, use `pixel-chart-area`.
 */
@Component({
  selector: 'pixel-chart-line',
  imports: [PixelChartHostComponent],
  templateUrl: './pixel-chart-line.html',
  styleUrl: './pixel-chart-line.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-chart-line',
    '[id]': 'id() || fallbackId',
    '[attr.data-mode]': 'mode()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
  },
})
export default class PixelChartLineComponent {
  protected readonly fallbackId = `pixel-chart-line-${++nextId}`;

  private readonly host = viewChild(PixelChartHostComponent);
  private readonly dateAdapter = inject<PixelDateAdapter<Date> | null>(PIXEL_DATE_ADAPTER, {
    optional: true,
  });

  /**
   * Data series (numeric arrays align to `categories` by index).
   *
   * @type {readonly PixelChartSeries[]}
   * @default []
   */
  readonly series = input<readonly PixelChartSeries[]>([]);

  /**
   * Category / time labels for the x-axis (`string` | `number` | `Date`).
   *
   * @type {readonly PixelChartAxisValue[]}
   * @default []
   */
  readonly categories = input<readonly PixelChartAxisValue[]>([]);

  /**
   * Line interpolation.
   *
   * @type {'straight' | 'smooth' | 'step'}
   * @default 'straight'
   */
  readonly mode = input<PixelChartLineMode>('straight');

  /**
   * Value labels on points.
   *
   * @type {boolean | 'auto'}
   * @default 'auto'
   */
  readonly showValues = input<PixelChartShowValues>('auto');

  /**
   * Draw markers at each point.
   *
   * @type {boolean}
   * @default true
   */
  readonly showMarkers = input(true, { transform: booleanAttribute });

  /**
   * Series color palette.
   *
   * @type {PixelChartPalette}
   * @default 'brand'
   */
  readonly palette = input<PixelChartPalette>('brand');

  /**
   * Series ids hidden via legend toggle (shell).
   *
   * @type {readonly string[]}
   * @default []
   */
  readonly hiddenSeriesIds = input<readonly string[]>([]);

  /**
   * Accessible name for the plot.
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
   * @default '280px'
   */
  readonly height = input<string | number>('280px');

  /**
   * Non-interactive muted state.
   *
   * @type {boolean}
   * @default false
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Busy flag passed to the host (`aria-busy`).
   *
   * @type {boolean}
   * @default false
   */
  readonly loading = input(false, { transform: booleanAttribute });

  /**
   * Theme rebuild counter (docs theme toggle).
   *
   * @type {number}
   * @default 0
   */
  readonly themeVersion = input(0);

  /**
   * Zoom: `false` | `inside` | `slider` | `both` | `selection` | `auto`.
   * `auto` enables `selection` when categories ≥ zoom threshold.
   *
   * @type {PixelChartDataZoomMode | 'auto'}
   * @default 'auto'
   */
  readonly dataZoom = input<PixelChartDataZoomMode | 'auto'>('auto');

  /**
   * Progressive rendering / LTTB sampling for large series.
   *
   * @type {PixelChartPerformanceMode}
   * @default 'auto'
   */
  readonly performance = input<PixelChartPerformanceMode>('auto');

  /**
   * X-axis kind. `time` when categories are dates/timestamps.
   *
   * @type {'category' | 'time'}
   * @default 'category'
   */
  readonly xAxisType = input<PixelChartXAxisType>('category');

  /** Point activation (mouse). */
  readonly pointClick = output<PixelChartPointClickEvent>();

  /** dataZoom range changed. */
  readonly dataZoomChange = output<PixelChartDataZoomEvent>();

  protected readonly option = computed(() => {
    const adapter = this.dateAdapter;
    return buildLineChartOption({
      series: this.series(),
      categories: this.categories(),
      mode: this.mode(),
      showValues: this.showValues(),
      showMarkers: this.showMarkers(),
      hiddenSeriesIds: new Set(this.hiddenSeriesIds()),
      dataZoom: this.dataZoom(),
      performance: this.performance(),
      xAxisType: this.xAxisType(),
      formatCategory: adapter
        ? (v) => formatChartAxisLabel(v, { adapter })
        : undefined,
    });
  });

  protected readonly summary = computed(() =>
    buildChartSummary({
      series: this.series(),
      categories: this.categories().map(String),
    }),
  );

  protected readonly resolvedAriaLabel = computed(
    () => this.ariaLabel().trim() || this.summary(),
  );

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
      name?: string;
      value?: number | null;
      event?: Event;
    };
    if (e.dataIndex == null || e.seriesId == null) {
      return;
    }
    this.pointClick.emit({
      seriesId: String(e.seriesId),
      seriesName: e.seriesName ?? '',
      pointIndex: e.dataIndex,
      x: e.name ?? this.categories()[e.dataIndex] ?? e.dataIndex,
      y: e.value ?? null,
      source: 'mouse',
      originalEvent: e.event ?? new Event('click'),
    });
  }
}
