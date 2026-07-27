import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { EChartsCoreOption, EChartsType } from 'echarts/core';
import * as echarts from 'echarts/core';
import { prefersReducedMotion } from '../shared/overlay-utils';
import { buildPixelChartEChartsTheme } from './pixel-chart-theme';
import type { PixelChartPalette } from './pixel-chart.types';

let nextId = 0;

export type PixelChartAnimationMode = boolean | 'auto';

export type PixelChartHostReadyEvent = {
  readonly chart: EChartsType;
};

/**
 * Low-level ECharts host: init / setOption / resize / dispose.
 * Chart families compose this; apps rarely use it alone.
 *
 * Call `ensureBarChart()` / `ensureLineChart()` (or future registers) before
 * passing options that need those series types.
 */
@Component({
  selector: 'pixel-chart-host',
  templateUrl: './pixel-chart-host.html',
  styleUrl: './pixel-chart-host.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-chart-host',
    role: 'img',
    '[id]': 'id() || fallbackId',
    '[attr.aria-label]': 'ariaLabel() || null',
    '[attr.aria-describedby]': 'ariaDescribedBy() || null',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '[attr.data-loading]': 'loading() ? "" : null',
    '[style.--pixel-chart-plot-min-block-size]': 'resolvedHeight()',
  },
})
export default class PixelChartHostComponent {
  private readonly hostRef = inject(ElementRef) as ElementRef<HTMLElement>;
  private readonly destroyRef = inject(DestroyRef);

  protected readonly fallbackId = `pixel-chart-host-${++nextId}`;

  /**
   * ECharts option object (modular series must be registered first).
   *
   * @type {EChartsCoreOption | null}
   * @default null
   */
  readonly option = input<EChartsCoreOption | null>(null);

  /**
   * Series color palette (named or explicit hex list).
   *
   * @type {PixelChartPalette}
   * @default 'brand'
   */
  readonly palette = input<PixelChartPalette>('brand');

  /**
   * Accessible name for the plot region.
   *
   * @type {string}
   * @default ''
   */
  readonly ariaLabel = input('');

  /**
   * Extra `aria-describedby` ids (merged by consumers with internal status ids).
   *
   * @type {string}
   * @default ''
   */
  readonly ariaDescribedBy = input('');

  /**
   * Optional id override.
   *
   * @type {string}
   * @default ''
   */
  readonly id = input('');

  /**
   * Plot block size (CSS length or number of pixels).
   *
   * @type {string | number}
   * @default '280px'
   */
  readonly height = input<string | number>('280px');

  /**
   * Animation: `auto` honors `prefers-reduced-motion`.
   *
   * @type {boolean | 'auto'}
   * @default 'auto'
   */
  readonly animation = input<PixelChartAnimationMode>('auto');

  /**
   * Marks the host busy (ARIA); does not render chrome — use shell for loader UI.
   *
   * @type {boolean}
   * @default false
   */
  readonly loading = input(false, { transform: booleanAttribute });

  /**
   * Rebuild theme from CSS vars when this counter changes (docs theme toggle).
   *
   * @type {number}
   * @default 0
   */
  readonly themeVersion = input(0, { transform: numberAttribute });

  /** Fires once after the ECharts instance is created. */
  readonly chartReady = output<PixelChartHostReadyEvent>();

  /** Native ECharts click payloads (series / point). */
  readonly chartClick = output<unknown>();

  private readonly plot = viewChild.required<ElementRef<HTMLElement>>('plot');

  private chart: EChartsType | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly browserReady = signal(false);

  protected readonly resolvedHeight = computed(() => {
    const h = this.height();
    return typeof h === 'number' ? `${h}px` : h;
  });

  constructor() {
    afterNextRender(() => {
      this.browserReady.set(true);
      this.initChart();
      this.destroyRef.onDestroy(() => this.disposeChart());
    });

    effect(() => {
      if (!this.browserReady()) {
        return;
      }
      this.option();
      this.palette();
      this.themeVersion();
      this.animation();
      this.applyOption();
    });
  }

  /** Imperative access for export helpers (Phase 1+). */
  getChart(): EChartsType | null {
    return this.chart;
  }

  private initChart(): void {
    if (this.chart || typeof document === 'undefined') {
      return;
    }
    const el = this.plot().nativeElement;
    const theme = buildPixelChartEChartsTheme(this.hostRef.nativeElement, this.palette());
    this.chart = echarts.init(el, theme as object, {
      renderer: 'canvas',
    });
    this.chart.on('click', (params: unknown) => this.chartClick.emit(params));
    this.watchResize(el);
    this.applyOption();
    this.chartReady.emit({ chart: this.chart });
  }

  private applyOption(): void {
    if (!this.chart) {
      return;
    }
    const opt = this.option();
    if (!opt) {
      this.chart.clear();
      return;
    }
    const theme = buildPixelChartEChartsTheme(this.hostRef.nativeElement, this.palette());
    this.chart.setOption(
      {
        ...themeAsOptionPatch(theme),
        animation: this.resolveAnimation(),
        ...opt,
      },
      { notMerge: true },
    );
  }

  private resolveAnimation(): boolean {
    const mode = this.animation();
    if (mode === 'auto') {
      return !prefersReducedMotion();
    }
    return mode;
  }

  private watchResize(el: HTMLElement): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    this.resizeObserver = new ResizeObserver(() => {
      if (this.resizeTimer) {
        clearTimeout(this.resizeTimer);
      }
      this.resizeTimer = setTimeout(() => {
        this.chart?.resize();
      }, 100);
    });
    this.resizeObserver.observe(el);
  }

  private disposeChart(): void {
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = null;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    const chart = this.chart;
    this.chart = null;
    try {
      chart?.dispose();
    } catch {
      // jsdom / missing canvas context can throw during dispose
    }
  }
}

/** Flatten theme fields ECharts accepts on setOption. */
function themeAsOptionPatch(theme: ReturnType<typeof buildPixelChartEChartsTheme>): EChartsCoreOption {
  return {
    color: [...theme.color],
    backgroundColor: theme.backgroundColor,
    textStyle: { ...theme.textStyle },
    legend: { textStyle: { ...theme.legend.textStyle } },
    tooltip: {
      backgroundColor: theme.tooltip.backgroundColor,
      borderColor: theme.tooltip.borderColor,
      textStyle: { ...theme.tooltip.textStyle },
    },
  };
}
