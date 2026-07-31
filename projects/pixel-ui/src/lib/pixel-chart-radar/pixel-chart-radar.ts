import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  numberAttribute,
  output,
  viewChild,
} from '@angular/core';
import type { EChartsType } from 'echarts/core';
import PixelChartHostComponent from '../pixel-chart/pixel-chart-host';
import {
  buildRadarChartOption,
  buildRadarTable,
  type PixelChartRadarIndicator,
  type PixelChartRadarMode,
} from '../pixel-chart/builders/radar-option';
import { ensureRadarChart } from '../pixel-chart/register/radar.register';
import type {
  PixelChartGridLines,
  PixelChartPalette,
  PixelChartPointClickEvent,
  PixelChartSeries,
  PixelChartShowValues,
} from '../pixel-chart/pixel-chart.types';

export type { PixelChartRadarIndicator, PixelChartRadarMode };

let nextId = 0;

ensureRadarChart();

/**
 * Radar chart facade — line, filled, markers, target (Phase 1c) plus range,
 * threshold, and polar-area (Phase 2). Multi-series is an overlay, not a stack.
 * Indicators may include optional `group` for multi-level axis labels.
 */
@Component({
  selector: 'pixel-chart-radar',
  imports: [PixelChartHostComponent],
  templateUrl: './pixel-chart-radar.html',
  styleUrl: './pixel-chart-radar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-chart-radar',
    '[id]': 'id() || fallbackId',
    '[attr.data-mode]': 'mode()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
  },
})
export default class PixelChartRadarComponent {
  protected readonly fallbackId = `pixel-chart-radar-${++nextId}`;

  private readonly host = viewChild(PixelChartHostComponent);

  /**
   * Axis indicators (name + max).
   *
   * @type {readonly PixelChartRadarIndicator[]}
   * @default []
   */
  readonly indicators = input<readonly PixelChartRadarIndicator[]>([]);

  /**
   * Series values aligned to `indicators` by index.
   *
   * @type {readonly PixelChartSeries[]}
   * @default []
   */
  readonly series = input<readonly PixelChartSeries[]>([]);

  /**
   * Visual mode.
   *
   * @type {PixelChartRadarMode}
   * @default 'line'
   * @description line | filled | markers | target | range | threshold | polar-area.
   *   Multi-series overlays; there is no stack mode.
   */
  readonly mode = input<PixelChartRadarMode>('line');

  /**
   * Value labels on vertices (or polar bars).
   *
   * @type {PixelChartShowValues}
   * @default 'auto'
   */
  readonly showValues = input<PixelChartShowValues>('auto');

  /**
   * Target values (same length as indicators). Shown in `target` mode or when set.
   *
   * @type {readonly number[] | null}
   * @default null
   */
  readonly target = input<readonly number[] | null>(null);

  /**
   * Legend name for the target ring.
   *
   * @type {string}
   * @default 'Target'
   */
  readonly targetName = input('Target');

  /**
   * Lower bound of the acceptable band (`range` mode).
   *
   * @type {readonly number[] | null}
   * @default null
   */
  readonly rangeLow = input<readonly number[] | null>(null);

  /**
   * Upper bound of the acceptable band (`range` mode).
   *
   * @type {readonly number[] | null}
   * @default null
   */
  readonly rangeHigh = input<readonly number[] | null>(null);

  /**
   * Concentric threshold rings (`threshold` mode) — absolute values per indicator max.
   *
   * @type {readonly number[] | null}
   * @default null
   */
  readonly thresholds = input<readonly number[] | null>(null);

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
   * Radar outline stroke width.
   *
   * @type {number}
   * @default 2
   */
  readonly lineWidth = input(2, { transform: numberAttribute });

  /**
   * Fill opacity for `filled` mode.
   *
   * @type {number}
   * @default 0.22
   */
  readonly areaOpacity = input(0.22, { transform: numberAttribute });

  /**
   * Vertex marker size when markers are shown.
   *
   * @type {number}
   * @default 8
   */
  readonly markerSize = input(8, { transform: numberAttribute });

  /**
   * Radial / concentric guides.
   *
   * @type {PixelChartGridLines}
   * @default 'on'
   */
  readonly gridLines = input<PixelChartGridLines>('on');

  readonly pointClick = output<PixelChartPointClickEvent>();

  protected readonly option = computed(() =>
    buildRadarChartOption({
      indicators: this.indicators(),
      series: this.series(),
      mode: this.mode(),
      showValues: this.showValues(),
      target: this.target(),
      targetName: this.targetName(),
      rangeLow: this.rangeLow(),
      rangeHigh: this.rangeHigh(),
      thresholds: this.thresholds(),
      hiddenSeriesIds: new Set(this.hiddenSeriesIds()),
      palette: this.palette(),
      lineWidth: this.lineWidth(),
      areaOpacity: this.areaOpacity(),
      markerSize: this.markerSize(),
      gridLines: this.gridLines(),
    }),
  );

  protected readonly summary = computed(() => {
    return `${this.series().length} series across ${this.indicators().length} indicators.`;
  });

  protected readonly resolvedAriaLabel = computed(
    () => this.ariaLabel().trim() || this.summary(),
  );

  tableModel(): ReturnType<typeof buildRadarTable> {
    return buildRadarTable(this.indicators(), this.series(), this.target());
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
      event?: Event;
    };
    if (e.dataIndex == null || e.seriesId === '__target') {
      return;
    }
    this.pointClick.emit({
      seriesId: String(e.seriesId ?? ''),
      seriesName: e.seriesName ?? '',
      pointIndex: e.dataIndex,
      x: e.seriesName ?? e.dataIndex,
      y: null,
      source: 'mouse',
      originalEvent: e.event ?? new Event('click'),
    });
  }
}
