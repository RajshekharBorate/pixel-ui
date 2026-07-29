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
import { buildChartSummary } from '../pixel-chart/a11y/chart-summary';
import {
  buildAreaChartOption,
  type PixelChartAreaMode,
} from '../pixel-chart/builders/area-option';
import type { PixelChartDataZoomMode } from '../pixel-chart/builders/interaction-option';
import { ensureAreaChart } from '../pixel-chart/register/area.register';
import type {
  PixelChartDataZoomEvent,
  PixelChartPalette,
  PixelChartPointClickEvent,
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
   * Theme rebuild counter (docs theme toggle).
   *
   * @type {number}
   * @default 0
   */
  readonly themeVersion = input(0);

  /**
   * Enable dataZoom (inside / slider / both). Cartesian modes only.
   *
   * @type {PixelChartDataZoomMode}
   * @default false
   */
  readonly dataZoom = input<PixelChartDataZoomMode>(false);

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
