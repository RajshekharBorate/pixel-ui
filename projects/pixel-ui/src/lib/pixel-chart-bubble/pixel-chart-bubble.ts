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
  type PixelChartBubbleHierarchyNode,
  type PixelChartBubbleLayout,
  type PixelChartBubbleSeries,
} from '../pixel-chart/builders/bubble-option';
import { ensureBubbleChart } from '../pixel-chart/register/bubble.register';
import type {
  PixelChartPalette,
  PixelChartPointClickEvent,
  PixelChartShowValues,
} from '../pixel-chart/pixel-chart.types';

export type {
  PixelChartBubbleSeries,
  PixelChartBubblePoint,
  PixelChartBubbleLayout,
  PixelChartBubbleHierarchyNode,
} from '../pixel-chart/builders/bubble-option';

let nextId = 0;

ensureBubbleChart();

/**
 * Bubble chart facade — cartesian x/y/size or hierarchical pack layout.
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
    '[attr.data-layout]': 'layout()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
  },
})
export default class PixelChartBubbleComponent {
  protected readonly fallbackId = `pixel-chart-bubble-${++nextId}`;

  private readonly host = viewChild(PixelChartHostComponent);

  /**
   * Bubble series (x, y, size per point). Also used to synthesize pack groups when
   * `hierarchy` is empty.
   *
   * @type {readonly PixelChartBubbleSeries[]}
   * @default []
   */
  readonly series = input<readonly PixelChartBubbleSeries[]>([]);

  /**
   * Layout mode.
   *
   * @type {PixelChartBubbleLayout}
   * @default 'cartesian'
   * @description cartesian | pack (hierarchical circle packing).
   */
  readonly layout = input<PixelChartBubbleLayout>('cartesian');

  /**
   * Hierarchy for pack layout. When empty, groups are synthesized from `series`.
   *
   * @type {readonly PixelChartBubbleHierarchyNode[]}
   * @default []
   */
  readonly hierarchy = input<readonly PixelChartBubbleHierarchyNode[]>([]);

  /**
   * Value / point labels. Prefer point `label` when present; otherwise size (cartesian)
   * or leaf names (pack).
   *
   * @type {boolean | 'auto'}
   * @default 'auto'
   * @description `auto` hides labels when the chart is dense.
   */
  readonly showValues = input<PixelChartShowValues>('auto');

  /**
   * X-axis title (cartesian only).
   *
   * @type {string}
   * @default ''
   */
  readonly xAxisName = input('');

  /**
   * Y-axis title (cartesian only).
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
      layout: this.layout(),
      hierarchy: this.hierarchy(),
      showValues: this.showValues(),
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
      name?: string;
      value?: number[];
      data?: {
        id?: string;
        name?: string;
        label?: string;
        value?: number[];
      };
      event?: Event;
    };
    if (e.dataIndex == null) {
      return;
    }

    // Pack custom series: identify nodes by data.id / name (seriesId is always `pack`).
    if (this.layout() === 'pack') {
      const data = e.data;
      if (!data) {
        return;
      }
      this.pointClick.emit({
        seriesId: String(data.id ?? data.name ?? e.dataIndex),
        seriesName: data.name ?? '',
        pointIndex: e.dataIndex,
        x: data.name ?? e.dataIndex,
        y: data.value?.[3] ?? null,
        source: 'mouse',
        originalEvent: e.event ?? new Event('click'),
      });
      return;
    }

    if (!e.value) {
      return;
    }
    this.pointClick.emit({
      seriesId: String(e.seriesId ?? ''),
      seriesName: e.seriesName ?? '',
      pointIndex: e.dataIndex,
      x: e.data?.label ?? e.value[0] ?? e.dataIndex,
      y: e.value[1] ?? null,
      source: 'mouse',
      originalEvent: e.event ?? new Event('click'),
    });
  }
}
