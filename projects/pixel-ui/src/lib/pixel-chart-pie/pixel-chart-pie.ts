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
  buildPieChartOption,
  buildPieTable,
  pieSlicesToLegendSeries,
  type PixelChartPieMode,
  type PixelChartPieSlice,
} from '../pixel-chart/builders/pie-option';
import { ensurePieChart } from '../pixel-chart/register/pie.register';
import type {
  PixelChartPalette,
  PixelChartPointClickEvent,
  PixelChartShowValues,
} from '../pixel-chart/pixel-chart.types';

export type { PixelChartPieMode, PixelChartPieSlice };

let nextId = 0;

ensurePieChart();

/**
 * Pie / donut / semi-donut chart facade.
 *
 * Pass `slices` for part-to-whole data. Use `buildPieTable` / `pieSlicesToLegendSeries`
 * with `pixel-chart-shell` for legend + accessible table.
 */
@Component({
  selector: 'pixel-chart-pie',
  imports: [PixelChartHostComponent],
  templateUrl: './pixel-chart-pie.html',
  styleUrl: './pixel-chart-pie.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-chart-pie',
    '[id]': 'id() || fallbackId',
    '[attr.data-mode]': 'mode()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
  },
})
export default class PixelChartPieComponent {
  protected readonly fallbackId = `pixel-chart-pie-${++nextId}`;

  private readonly host = viewChild(PixelChartHostComponent);

  /**
   * Pie slices (name + value).
   *
   * @type {readonly PixelChartPieSlice[]}
   * @default []
   */
  readonly slices = input<readonly PixelChartPieSlice[]>([]);

  /**
   * Layout mode.
   *
   * @type {'pie' | 'donut' | 'semi'}
   * @default 'pie'
   */
  readonly mode = input<PixelChartPieMode>('pie');

  /**
   * Slice percentage labels.
   *
   * @type {boolean | 'auto'}
   * @default 'auto'
   */
  readonly showValues = input<PixelChartShowValues>('auto');

  /**
   * Show center total label (donut / semi).
   *
   * @type {boolean}
   * @default true for donut/semi
   */
  readonly showCenterLabel = input(true, { transform: booleanAttribute });

  /**
   * Override center label text.
   *
   * @type {string}
   * @default ''
   */
  readonly centerLabel = input('');

  /**
   * Series color palette.
   *
   * @type {PixelChartPalette}
   * @default 'brand'
   */
  readonly palette = input<PixelChartPalette>('brand');

  /**
   * Slice ids hidden via legend toggle.
   *
   * @type {readonly string[]}
   * @default []
   */
  readonly hiddenSliceIds = input<readonly string[]>([]);

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

  readonly pointClick = output<PixelChartPointClickEvent>();

  protected readonly option = computed(() =>
    buildPieChartOption({
      slices: this.slices(),
      mode: this.mode(),
      showValues: this.showValues(),
      showCenterLabel: this.showCenterLabel(),
      centerLabel: this.centerLabel(),
      hiddenSliceIds: new Set(this.hiddenSliceIds()),
      palette: this.palette(),
    }),
  );

  protected readonly summary = computed(() => {
    const slices = this.slices();
    const total = slices.reduce((s, x) => s + x.value, 0);
    return `${slices.length} categories, total ${total}.`;
  });

  protected readonly resolvedAriaLabel = computed(
    () => this.ariaLabel().trim() || this.summary(),
  );

  /** Legend series helper for shell binding. */
  legendSeries(): ReturnType<typeof pieSlicesToLegendSeries> {
    return pieSlicesToLegendSeries(this.slices());
  }

  /** Table helper for shell binding. */
  tableModel(): ReturnType<typeof buildPieTable> {
    return buildPieTable(this.slices());
  }

  getChart(): EChartsType | null {
    return this.host()?.getChart() ?? null;
  }

  protected onChartClick(event: unknown): void {
    if (this.disabled()) {
      return;
    }
    const e = event as {
      data?: { id?: string; name?: string; value?: number };
      dataIndex?: number;
      event?: Event;
    };
    const data = e.data;
    if (!data || e.dataIndex == null) {
      return;
    }
    this.pointClick.emit({
      seriesId: String(data.id ?? e.dataIndex),
      seriesName: data.name ?? '',
      pointIndex: e.dataIndex,
      x: data.name ?? e.dataIndex,
      y: data.value ?? null,
      source: 'mouse',
      originalEvent: e.event ?? new Event('click'),
    });
  }
}
