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
  buildBubbleChartOption,
  bubbleSeriesToLegendSeries,
  type PixelChartBubbleSeries,
} from '../pixel-chart/builders/bubble-option';
import { ensureBubbleChart } from '../pixel-chart/register/bubble.register';
import type {
  PixelChartPalette,
  PixelChartPointClickEvent,
} from '../pixel-chart/pixel-chart.types';

export type {
  PixelChartBubbleSeries,
  PixelChartBubblePoint,
} from '../pixel-chart/builders/bubble-option';

let nextId = 0;

ensureBubbleChart();

/**
 * Cartesian bubble chart (x / y / size). Packed layout is Phase 2.
 */
@Component({
  selector: 'pixel-chart-bubble',
  imports: [PixelChartHostComponent],
  templateUrl: './pixel-chart-bubble.html',
  styleUrl: './pixel-chart-bubble.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-chart-bubble',
    '[id]': 'id() || fallbackId',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
  },
})
export default class PixelChartBubbleComponent {
  protected readonly fallbackId = `pixel-chart-bubble-${++nextId}`;

  private readonly host = viewChild(PixelChartHostComponent);

  /**
   * Bubble series (x, y, size per point).
   *
   * @type {readonly PixelChartBubbleSeries[]}
   * @default []
   */
  readonly series = input<readonly PixelChartBubbleSeries[]>([]);

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

  readonly pointClick = output<PixelChartPointClickEvent>();

  protected readonly option = computed(() =>
    buildBubbleChartOption({
      series: this.series(),
      hiddenSeriesIds: new Set(this.hiddenSeriesIds()),
      palette: this.palette(),
      xAxisName: this.xAxisName(),
      yAxisName: this.yAxisName(),
    }),
  );

  protected readonly summary = computed(() => {
    const n = this.series().reduce((sum, s) => sum + s.data.length, 0);
    return `${this.series().length} series, ${n} bubbles.`;
  });

  protected readonly resolvedAriaLabel = computed(
    () => this.ariaLabel().trim() || this.summary(),
  );

  /** Legend helper for shell binding. */
  legendSeries(): ReturnType<typeof bubbleSeriesToLegendSeries> {
    return bubbleSeriesToLegendSeries(this.series());
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
    if (e.dataIndex == null || !e.value) {
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
