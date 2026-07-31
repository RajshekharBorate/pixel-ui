import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  booleanAttribute,
  computed,
  inject,
  input,
  numberAttribute,
  output,
  viewChild,
} from '@angular/core';
import type { EChartsType } from 'echarts/core';
import PixelChartHostComponent from '../pixel-chart/pixel-chart-host';
import {
  buildScatterChartOption,
  buildScatterTable,
} from '../pixel-chart/builders/scatter-option';
import { ensureScatterChart } from '../pixel-chart/register/scatter.register';
import type { PixelChartDataZoomMode } from '../pixel-chart/builders/interaction-option';
import type { PixelChartPerformanceMode } from '../pixel-chart/builders/performance-option';
import type {
  PixelChartAxisLines,
  PixelChartAxisPointer,
  PixelChartDataZoomEvent,
  PixelChartGridLines,
  PixelChartNumberFormat,
  PixelChartPalette,
  PixelChartPlotPadding,
  PixelChartPointClickEvent,
  PixelChartReferenceBand,
  PixelChartReferenceLine,
  PixelChartSeries,
  PixelChartShowValues,
} from '../pixel-chart/pixel-chart.types';

let nextId = 0;

ensureScatterChart();

/**
 * Scatter chart facade with optional OLS trendline.
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
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
  },
})
export default class PixelChartScatterComponent {
  protected readonly fallbackId = `pixel-chart-scatter-${++nextId}`;

  private readonly host = viewChild(PixelChartHostComponent);
  private readonly locale = inject(LOCALE_ID);

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
   * Pointer cursor when the plot supports drill / click navigation.
   *
   * @type {boolean}
   * @default false
   */
  readonly drillable = input(false, { transform: booleanAttribute });

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

  /**
   * Marker diameter in pixels.
   *
   * @type {number}
   * @default 10
   */
  readonly markerSize = input(10, { transform: numberAttribute });

  /**
   * Plot grid guides.
   *
   * @type {PixelChartGridLines}
   * @default 'on'
   */
  readonly gridLines = input<PixelChartGridLines>('on');

  /**
   * Axis baselines.
   *
   * @type {PixelChartAxisLines}
   * @default 'on'
   */
  readonly axisLines = input<PixelChartAxisLines>('on');

  /**
   * Optional plot grid inset overrides (px).
   *
   * @type {PixelChartPlotPadding | null}
   * @default null
   */
  readonly plotPadding = input<PixelChartPlotPadding | null>(null);

  /**
   * Advanced number format for labels and tooltips.
   *
   * @type {PixelChartNumberFormat | null}
   * @default null
   * @description Uses the application locale unless the format supplies one.
   */
  readonly valueFormat = input<PixelChartNumberFormat | null>(null);

  /**
   * Number format for value-axis tick labels. Falls back to `valueFormat`.
   *
   * @type {PixelChartNumberFormat | null}
   * @default null
   * @description Use for axis-only precision or currency formatting.
   */
  readonly axisValueFormat = input<PixelChartNumberFormat | null>(null);

  /**
   * Display text for null or empty values.
   *
   * @type {string}
   * @default '—'
   * @description Used by labels and tooltips when a datum has no value.
   */
  readonly nullLabel = input('—');

  /**
   * Horizontal or vertical SLA / target annotations.
   *
   * @type {readonly PixelChartReferenceLine[] | null}
   * @default null
   * @description Attached to the first drawable series.
   */
  readonly referenceLines = input<readonly PixelChartReferenceLine[] | null>(null);

  /**
   * Horizontal or vertical warning / acceptable-range annotations.
   *
   * @type {readonly PixelChartReferenceBand[] | null}
   * @default null
   * @description Attached to the first drawable series.
   */
  readonly referenceBands = input<readonly PixelChartReferenceBand[] | null>(null);

  /**
   * Tooltip axis pointer style.
   *
   * @type {PixelChartAxisPointer}
   * @default 'cross'
   * @description Controls the pointer shown in the plot tooltip.
   */
  readonly axisPointer = input<PixelChartAxisPointer>('cross');

  /**
   * Cross-chart synchronization group.
   *
   * @type {string}
   * @default ''
   * @description Hosts sharing a non-empty group synchronize ECharts interactions.
   */
  readonly syncGroup = input('');

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
      markerSize: this.markerSize(),
      gridLines: this.gridLines(),
      axisLines: this.axisLines(),
      plotPadding: this.plotPadding() ?? undefined,
      valueFormat: this.valueFormat(),
      axisValueFormat: this.axisValueFormat(),
      nullLabel: this.nullLabel(),
      locale: this.locale,
      referenceLines: this.referenceLines(),
      referenceBands: this.referenceBands(),
      axisPointer: this.axisPointer(),
    }),
  );

  protected readonly summary = computed(() => {
    const n = this.series().reduce((sum, s) => sum + s.data.length, 0);
    return `${this.series().length} series, ${n} points.`;
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
