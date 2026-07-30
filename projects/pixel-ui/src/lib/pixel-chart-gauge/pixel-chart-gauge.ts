import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  numberAttribute,
  viewChild,
} from '@angular/core';
import type { EChartsType } from 'echarts/core';
import PixelChartHostComponent from '../pixel-chart/pixel-chart-host';
import {
  buildGaugeChartOption,
  type PixelChartGaugeRange,
  type PixelChartGaugeVariant,
} from '../pixel-chart/builders/gauge-option';
import { ensureGaugeChart } from '../pixel-chart/register/gauge.register';
import type { PixelChartPalette } from '../pixel-chart/pixel-chart.types';

export type { PixelChartGaugeVariant, PixelChartGaugeRange };

let nextId = 0;

ensureGaugeChart();

/**
 * KPI gauge facade — radial, semi, linear, donut, bullet (Phase 1b) plus
 * solid, multi-range, dual, tick, and vertical (Phase 2).
 */
@Component({
  selector: 'pixel-chart-gauge',
  imports: [PixelChartHostComponent],
  templateUrl: './pixel-chart-gauge.html',
  styleUrl: './pixel-chart-gauge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-chart-gauge',
    '[id]': 'id() || fallbackId',
    '[attr.data-variant]': 'variant()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
  },
})
export default class PixelChartGaugeComponent {
  protected readonly fallbackId = `pixel-chart-gauge-${++nextId}`;

  private readonly host = viewChild(PixelChartHostComponent);

  /**
   * Current value.
   *
   * @type {number}
   * @default 0
   */
  readonly value = input(0, { transform: numberAttribute });

  /**
   * Scale minimum.
   *
   * @type {number}
   * @default 0
   */
  readonly min = input(0, { transform: numberAttribute });

  /**
   * Scale maximum.
   *
   * @type {number}
   * @default 100
   */
  readonly max = input(100, { transform: numberAttribute });

  /**
   * Optional target (bullet mark line; dual inner arc).
   *
   * @type {number | null}
   * @default null
   */
  readonly target = input<number | null>(null);

  /**
   * Center / axis label (e.g. "Performance").
   *
   * @type {string}
   * @default ''
   */
  readonly label = input('');

  /**
   * Visual variant.
   *
   * @type {PixelChartGaugeVariant}
   * @default 'radial'
   * @description radial | semi | linear | donut | bullet | solid | multi-range | dual | tick | vertical
   */
  readonly variant = input<PixelChartGaugeVariant>('radial');

  /**
   * Qualitative ranges (bullet stacks; multi-range axis zones).
   *
   * @type {readonly PixelChartGaugeRange[]}
   * @default []
   */
  readonly ranges = input<readonly PixelChartGaugeRange[]>([]);

  /**
   * Show numeric value.
   *
   * @type {boolean}
   * @default true
   */
  readonly showValue = input(true, { transform: booleanAttribute });

  /**
   * Series color palette.
   *
   * @type {PixelChartPalette}
   * @default 'brand'
   */
  readonly palette = input<PixelChartPalette>('brand');

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
   * @default '220px'
   */
  readonly height = input<string | number>('220px');

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

  protected readonly option = computed(() =>
    buildGaugeChartOption({
      value: this.value(),
      min: this.min(),
      max: this.max(),
      target: this.target(),
      label: this.label(),
      variant: this.variant(),
      ranges: this.ranges(),
      palette: this.palette(),
      showValue: this.showValue(),
    }),
  );

  protected readonly summary = computed(() => {
    const label = this.label().trim();
    const parts = [
      label || 'Gauge',
      `value ${this.value()}`,
      `range ${this.min()}–${this.max()}`,
    ];
    if (this.target() != null) {
      parts.push(`target ${this.target()}`);
    }
    return parts.join(', ') + '.';
  });

  protected readonly resolvedAriaLabel = computed(
    () => this.ariaLabel().trim() || this.summary(),
  );

  getChart(): EChartsType | null {
    return this.host()?.getChart() ?? null;
  }
}
