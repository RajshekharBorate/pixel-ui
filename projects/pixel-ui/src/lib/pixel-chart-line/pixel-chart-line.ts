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
  PixelChartAxisLines,
  PixelChartAxisPointer,
  PixelChartDataZoomEvent,
  PixelChartDateFormat,
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
  private readonly locale = inject(LOCALE_ID);

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

  /**
   * Optional X-axis title (e.g. `Month`).
   *
   * @type {string}
   * @default ''
   */
  readonly xAxisName = input('');

  /**
   * Optional Y-axis title (e.g. `Sales (in K)`).
   *
   * @type {string}
   * @default ''
   */
  readonly yAxisName = input('');

  /**
   * Suffix for absolute value labels / tooltips (e.g. `K` → `85K`).
   *
   * @type {string}
   * @default ''
   */
  readonly valueSuffix = input('');

  /**
   * Advanced number format for labels / tooltips. `valueSuffix` stays the simple shorthand.
   *
   * @type {PixelChartNumberFormat | null}
   * @default null
   * @description Use for axis-only precision or currency formatting.
   */
  readonly valueFormat = input<PixelChartNumberFormat | null>(null);

  /**
   * Number format for value-axis tick labels. Falls back to `valueFormat`.
   *
   * @type {PixelChartNumberFormat | null}
   * @default null
   */
  readonly axisValueFormat = input<PixelChartNumberFormat | null>(null);

  /**
   * Date format for category or time-axis labels.
   *
   * @type {PixelChartDateFormat | null}
   * @default null
   * @description The injected date adapter takes precedence when available.
   */
  readonly categoryFormat = input<PixelChartDateFormat | null>(null);

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
   * @default 'line'
   * @description Controls the pointer shown in the plot tooltip.
   */
  readonly axisPointer = input<PixelChartAxisPointer>('line');

  /**
   * Cross-chart synchronization group.
   *
   * @type {string}
   * @default ''
   * @description Hosts sharing a non-empty group synchronize ECharts interactions.
   */
  readonly syncGroup = input('');

  /**
   * Line stroke width in pixels.
   *
   * @type {number}
   * @default 2
   */
  readonly lineWidth = input(2, { transform: numberAttribute });

  /**
   * Marker diameter in pixels.
   *
   * @type {number}
   * @default 8
   */
  readonly markerSize = input(8, { transform: numberAttribute });

  /**
   * Leave a gap before the first / after the last category (time axes use 2%).
   *
   * @type {boolean}
   * @default true
   */
  readonly boundaryGap = input(true, { transform: booleanAttribute });

  /**
   * Plot grid guides (`on` = value-axis guides).
   *
   * @type {PixelChartGridLines}
   * @default 'on'
   */
  readonly gridLines = input<PixelChartGridLines>('on');

  /**
   * Axis baselines (`on` | `off` | `x` | `y`).
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
      xAxisName: this.xAxisName(),
      yAxisName: this.yAxisName(),
      valueSuffix: this.valueSuffix(),
      valueFormat: this.valueFormat(),
      axisValueFormat: this.axisValueFormat(),
      categoryFormat: this.categoryFormat(),
      nullLabel: this.nullLabel(),
      locale: this.locale,
      referenceLines: this.referenceLines(),
      referenceBands: this.referenceBands(),
      axisPointer: this.axisPointer(),
      lineWidth: this.lineWidth(),
      markerSize: this.markerSize(),
      boundaryGap: this.boundaryGap(),
      gridLines: this.gridLines(),
      axisLines: this.axisLines(),
      plotPadding: this.plotPadding() ?? undefined,
      formatCategory:
        adapter || this.categoryFormat()
          ? (v) =>
              formatChartAxisLabel(v, {
                adapter,
                locale: this.categoryFormat()?.locale ?? this.locale,
                dateStyle: this.categoryFormat()?.dateStyle,
              })
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
