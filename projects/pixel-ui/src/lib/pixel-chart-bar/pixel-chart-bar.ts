import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  numberAttribute,
  output,
  viewChild,
} from '@angular/core';
import { LOCALE_ID } from '@angular/core';
import type { EChartsType } from 'echarts/core';
import PixelChartHostComponent from '../pixel-chart/pixel-chart-host';
import { buildChartSummary } from '../pixel-chart/a11y/chart-summary';
import {
  buildBarChartOption,
  type PixelChartBarMode,
  type PixelChartBarOrientation,
} from '../pixel-chart/builders/bar-option';
import { buildSkeletonBarLayout } from '../pixel-chart/builders/skeleton-bar-layout';
import { ensureBarChart } from '../pixel-chart/register/bar.register';
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
  private readonly locale = inject(LOCALE_ID);

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
   * Replace the plot with a type-specific skeleton (no ECharts). Primary loading API —
   * bind like `pixel-select` `showSkeleton`; prefer over shell `showSkeleton` when projected.
   *
   * @type {boolean}
   * @default false
   */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

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

  /**
   * Optional X-axis title (e.g. `Quarter`).
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
   * @default 'shadow'
   */
  readonly axisPointer = input<PixelChartAxisPointer>('shadow');

  /**
   * Cross-chart synchronization group.
   *
   * @type {string}
   * @default ''
   * @description Hosts sharing a non-empty group synchronize ECharts interactions.
   */
  readonly syncGroup = input('');

  /**
   * Max bar thickness in pixels.
   *
   * @type {number}
   * @default 48
   */
  readonly barMaxWidth = input(48, { transform: numberAttribute });

  /**
   * Corner radius for bars (px).
   *
   * @type {number}
   * @default 0
   */
  readonly barBorderRadius = input(0, { transform: numberAttribute });

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
      palette: this.palette(),
      patternFill: this.patternFill(),
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
      barMaxWidth: this.barMaxWidth(),
      barBorderRadius: this.barBorderRadius(),
      gridLines: this.gridLines(),
      axisLines: this.axisLines(),
      plotPadding: this.plotPadding() ?? undefined,
    }),
  );

  /** Proportions for the plot skeleton so stubs match live bar sizes. */
  protected readonly skeletonBarLayout = computed(() =>
    buildSkeletonBarLayout({
      series: this.series(),
      categories: this.categories(),
      mode: this.mode(),
      hiddenSeriesIds: this.hiddenSeriesIds(),
      barMaxWidth: this.barMaxWidth(),
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
