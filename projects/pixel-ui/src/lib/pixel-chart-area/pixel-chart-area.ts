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
  buildAreaChartOption,
  type PixelChartAreaMode,
} from '../pixel-chart/builders/area-option';
import type { PixelChartDataZoomMode } from '../pixel-chart/builders/interaction-option';
import type { PixelChartPerformanceMode } from '../pixel-chart/builders/performance-option';
import { ensureAreaChart } from '../pixel-chart/register/area.register';
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

export type { PixelChartAreaMode };

let nextId = 0;

ensureAreaChart();

/**
 * Area chart facade (overlay, stacked, 100% stacked, or experimental streamgraph).
 *
 * For unfilled lines, use `pixel-chart-line`.
 */
@Component({
  selector: 'pixel-chart-area',
  imports: [PixelChartHostComponent],
  templateUrl: './pixel-chart-area.html',
  styleUrl: './pixel-chart-area.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-chart-area',
    '[id]': 'id() || fallbackId',
    '[attr.data-mode]': 'mode()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
  },
})
export default class PixelChartAreaComponent {
  protected readonly fallbackId = `pixel-chart-area-${++nextId}`;

  private readonly host = viewChild(PixelChartHostComponent);
  private readonly locale = inject(LOCALE_ID);

  /**
   * Data series (numeric arrays align to `categories` by index).
   *
   * @type {readonly PixelChartSeries[]}
   * @default []
   */
  readonly series = input<readonly PixelChartSeries[]>([]);

  /**
   * Category labels for the x-axis.
   *
   * @type {readonly string[]}
   * @default []
   */
  readonly categories = input<readonly string[]>([]);

  /**
   * Area layout.
   *
   * @type {PixelChartAreaMode}
   * @default 'overlay'
   * @description overlay | stacked | percent (100% stacked) | stream (centered streamgraph).
   */
  readonly mode = input<PixelChartAreaMode>('overlay');

  /**
   * Value labels on points / segments.
   *
   * @type {boolean | 'auto'}
   * @default 'auto'
   */
  readonly showValues = input<PixelChartShowValues>('auto');

  /**
   * Draw markers at each point.
   *
   * @type {boolean}
   * @default false
   */
  readonly showMarkers = input(false, { transform: booleanAttribute });

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
   * Pointer cursor when the plot supports drill / click navigation.
   *
   * @type {boolean}
   * @default false
   */
  readonly drillable = input(false, { transform: booleanAttribute });

  /**
   * Theme rebuild counter (docs theme toggle).
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
   * Progressive rendering / LTTB sampling for large series.
   *
   * @type {PixelChartPerformanceMode}
   * @default 'auto'
   */
  readonly performance = input<PixelChartPerformanceMode>('auto');

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
   * Suffix for absolute value labels / tooltips (e.g. `K` → `85K`). Ignored in percent mode.
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
   * Area outline stroke width in pixels.
   *
   * @type {number}
   * @default 2
   */
  readonly lineWidth = input(2, { transform: numberAttribute });

  /**
   * Fill opacity (0–1). When unset, mode defaults apply (overlay 0.35, stacked 0.75, stream 0.85).
   *
   * @type {number | null}
   * @default null
   */
  readonly areaOpacity = input<number | null>(null);

  /**
   * Marker diameter in pixels.
   *
   * @type {number}
   * @default 6
   */
  readonly markerSize = input(6, { transform: numberAttribute });

  /**
   * Leave a gap before the first / after the last category.
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

  protected readonly option = computed(() =>
    buildAreaChartOption({
      series: this.series(),
      categories: this.categories(),
      mode: this.mode(),
      showValues: this.showValues(),
      showMarkers: this.showMarkers(),
      hiddenSeriesIds: new Set(this.hiddenSeriesIds()),
      dataZoom: this.dataZoom(),
      performance: this.performance(),
      xAxisName: this.xAxisName(),
      yAxisName: this.yAxisName(),
      valueSuffix: this.valueSuffix(),
      valueFormat: this.valueFormat(),
      axisValueFormat: this.axisValueFormat(),
      nullLabel: this.nullLabel(),
      locale: this.locale,
      referenceLines: this.referenceLines(),
      referenceBands: this.referenceBands(),
      axisPointer: this.axisPointer(),
      lineWidth: this.lineWidth(),
      areaOpacity: this.areaOpacity() ?? undefined,
      markerSize: this.markerSize(),
      boundaryGap: this.boundaryGap(),
      gridLines: this.gridLines(),
      axisLines: this.axisLines(),
      plotPadding: this.plotPadding() ?? undefined,
    }),
  );

  protected readonly summary = computed(() =>
    buildChartSummary({
      series: this.series(),
      categories: this.categories(),
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
