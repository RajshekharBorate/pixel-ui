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
  buildBarChartOption,
  type PixelChartBarMode,
  type PixelChartBarOrientation,
} from '../pixel-chart/builders/bar-option';
import { ensureBarChart } from '../pixel-chart/register/bar.register';
import type { PixelChartDataZoomMode } from '../pixel-chart/builders/interaction-option';
import type { PixelChartPerformanceMode } from '../pixel-chart/builders/performance-option';
import type {
  PixelChartDataZoomEvent,
  PixelChartPalette,
  PixelChartPointClickEvent,
  PixelChartSeries,
  PixelChartShowValues,
} from '../pixel-chart/pixel-chart.types';

export type { PixelChartBarMode, PixelChartBarOrientation };

let nextId = 0;

ensureBarChart();

/**
 * Bar / column chart facade (vertical or horizontal; single, grouped, stacked, percent).
 *
 * Compose with `pixel-chart-shell` for card chrome, or use bare in a grid cell.
 */
@Component({
  selector: 'pixel-chart-bar',
  imports: [PixelChartHostComponent],
  templateUrl: './pixel-chart-bar.html',
  styleUrl: './pixel-chart-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-chart-bar',
    '[id]': 'id() || fallbackId',
    '[attr.data-mode]': 'mode()',
    '[attr.data-orientation]': 'orientation()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
  },
})
export default class PixelChartBarComponent {
  protected readonly fallbackId = `pixel-chart-bar-${++nextId}`;

  private readonly host = viewChild(PixelChartHostComponent);

  /**
   * Data series (numeric arrays align to `categories` by index).
   *
   * @type {readonly PixelChartSeries[]}
   * @default []
   */
  readonly series = input<readonly PixelChartSeries[]>([]);

  /**
   * Category labels for the category axis.
   *
   * @type {readonly string[]}
   * @default []
   */
  readonly categories = input<readonly string[]>([]);

  /**
   * Layout mode.
   *
   * @type {'single' | 'grouped' | 'stacked' | 'percent'}
   * @default 'grouped'
   * @description `single` is best with one series; `percent` is 100% stacked.
   */
  readonly mode = input<PixelChartBarMode>('grouped');

  /**
   * Bar direction (`vertical` = column chart).
   *
   * @type {'vertical' | 'horizontal'}
   * @default 'vertical'
   */
  readonly orientation = input<PixelChartBarOrientation>('vertical');

  /**
   * Value labels on bars.
   *
   * @type {boolean | 'auto'}
   * @default 'auto'
   * @description `auto` hides labels when the chart is dense.
   */
  readonly showValues = input<PixelChartShowValues>('auto');

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
   * Hatch pattern fills (high-contrast / color-blind friendly).
   *
   * @type {boolean}
   * @default false
   */
  readonly patternFill = input(false, { transform: booleanAttribute });

  /**
   * Zoom: `false` | `inside` | `slider` | `both` | `selection` | `auto`.
   *
   * @type {PixelChartDataZoomMode | 'auto'}
   * @default 'auto'
   */
  readonly dataZoom = input<PixelChartDataZoomMode | 'auto'>('auto');

  /**
   * Progressive rendering for large category sets (no LTTB — bars need exact values).
   *
   * @type {PixelChartPerformanceMode}
   * @default 'auto'
   */
  readonly performance = input<PixelChartPerformanceMode>('auto');

  /** Point activation (mouse). Keyboard users should use the data table. */
  readonly pointClick = output<PixelChartPointClickEvent>();

  /** dataZoom range changed. */
  readonly dataZoomChange = output<PixelChartDataZoomEvent>();

  protected readonly option = computed(() =>
    buildBarChartOption({
      series: this.series(),
      categories: this.categories(),
      mode: this.mode(),
      orientation: this.orientation(),
      showValues: this.showValues(),
      hiddenSeriesIds: new Set(this.hiddenSeriesIds()),
      patternFill: this.patternFill(),
      dataZoom: this.dataZoom(),
      performance: this.performance(),
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

  /** Live ECharts instance for export / shell. */
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
