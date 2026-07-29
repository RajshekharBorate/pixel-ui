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
import { readChartZoomRange, type PixelChartZoomRange } from './builders/interaction-option';
import { buildPixelChartEChartsTheme } from './pixel-chart-theme';
import type {
  PixelChartAxisTheme,
  PixelChartDataZoomEvent,
  PixelChartPalette,
} from './pixel-chart.types';

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
    '[attr.title]': 'null',
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

  /** dataZoom range changed. */
  readonly dataZoom = output<PixelChartDataZoomEvent>();

  private readonly plot = viewChild.required<ElementRef<HTMLElement>>('plot');

  private chart: EChartsType | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private themeObserver: MutationObserver | null = null;
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly browserReady = signal(false);
  private lastThemeVersion: number | null = null;

  protected readonly resolvedHeight = computed(() => {
    const h = this.height();
    return typeof h === 'number' ? `${h}px` : h;
  });

  constructor() {
    afterNextRender(() => {
      this.browserReady.set(true);
      this.initChart();
      this.watchDocumentTheme();
      this.destroyRef.onDestroy(() => this.disposeChart());
    });

    effect(() => {
      if (!this.browserReady()) {
        return;
      }
      this.option();
      this.palette();
      const themeVersion = this.themeVersion();
      this.animation();
      const preserveZoom =
        this.lastThemeVersion != null && themeVersion !== this.lastThemeVersion;
      this.lastThemeVersion = themeVersion;
      this.applyOption(preserveZoom);
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
    this.chart.on('datazoom', (params: unknown) => {
      const p = params as { start?: number; end?: number; batch?: { start?: number; end?: number }[] };
      const batch0 = p.batch?.[0];
      this.dataZoom.emit({
        start: batch0?.start ?? p.start ?? null,
        end: batch0?.end ?? p.end ?? null,
        raw: params,
      });
    });
    this.watchResize(el);
    this.applyOption();
    this.chartReady.emit({ chart: this.chart });
  }

  private applyOption(preserveZoom = false): void {
    if (!this.chart) {
      return;
    }
    const opt = this.option();
    if (!opt) {
      this.chart.clear();
      return;
    }
    const theme = buildPixelChartEChartsTheme(this.hostRef.nativeElement, this.palette());
    const zoomRange = preserveZoom ? readChartZoomRange(this.chart) : null;
    const themed = mergeThemedOption(theme, opt, this.resolveAnimation());
    this.chart.setOption(withPreservedZoom(themed, zoomRange), {
      notMerge: true,
    });
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

  /** Re-apply option when docs/app flips `data-theme` / `data-color-scheme`. */
  private watchDocumentTheme(): void {
    if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') {
      return;
    }
    this.themeObserver = new MutationObserver(() => this.applyOption(true));
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-color-scheme'],
    });
    const themed = this.hostRef.nativeElement.closest('[data-theme]');
    if (themed && themed !== document.documentElement) {
      this.themeObserver.observe(themed, {
        attributes: true,
        attributeFilter: ['data-theme', 'data-color-scheme'],
      });
    }
  }

  private disposeChart(): void {
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = null;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.themeObserver?.disconnect();
    this.themeObserver = null;
    const chart = this.chart;
    this.chart = null;
    try {
      chart?.dispose();
    } catch {
      // jsdom / missing canvas context can throw during dispose
    }
  }
}

/** Reapply the current percent window after a theme-only `notMerge` render. */
function withPreservedZoom(
  option: EChartsCoreOption,
  range: PixelChartZoomRange | null,
): EChartsCoreOption {
  if (!range) {
    return option;
  }
  const raw = option as Record<string, unknown>;
  const dataZoom = raw['dataZoom'];
  if (dataZoom == null) {
    return option;
  }
  const apply = (item: unknown): unknown =>
    item && typeof item === 'object'
      ? { ...(item as Record<string, unknown>), start: range.start, end: range.end }
      : item;
  return {
    ...raw,
    dataZoom: Array.isArray(dataZoom) ? dataZoom.map(apply) : apply(dataZoom),
  } as EChartsCoreOption;
}

function axisThemePatch(axis: PixelChartAxisTheme): Record<string, unknown> {
  return {
    axisLine: { lineStyle: { ...axis.axisLine.lineStyle } },
    axisTick: { lineStyle: { ...axis.axisTick.lineStyle } },
    axisLabel: { ...axis.axisLabel },
    splitLine: { lineStyle: { ...axis.splitLine.lineStyle } },
    nameTextStyle: { ...axis.nameTextStyle },
  };
}

function mergeAxisOption(
  themeAxis: PixelChartAxisTheme,
  axis: unknown,
): unknown {
  if (axis == null) {
    return axisThemePatch(themeAxis);
  }
  if (Array.isArray(axis)) {
    return axis.map((item) => mergeAxisOption(themeAxis, item));
  }
  if (typeof axis === 'object') {
    const a = axis as Record<string, unknown>;
    const patch = axisThemePatch(themeAxis);
    return {
      ...patch,
      ...a,
      axisLine: {
        ...(patch['axisLine'] as object),
        ...((a['axisLine'] as object) ?? {}),
        lineStyle: {
          ...((patch['axisLine'] as { lineStyle?: object }).lineStyle ?? {}),
          ...(((a['axisLine'] as { lineStyle?: object } | undefined)?.lineStyle) ?? {}),
        },
      },
      axisTick: {
        ...(patch['axisTick'] as object),
        ...((a['axisTick'] as object) ?? {}),
        lineStyle: {
          ...((patch['axisTick'] as { lineStyle?: object }).lineStyle ?? {}),
          ...(((a['axisTick'] as { lineStyle?: object } | undefined)?.lineStyle) ?? {}),
        },
      },
      axisLabel: {
        ...(patch['axisLabel'] as object),
        ...((a['axisLabel'] as object) ?? {}),
      },
      splitLine: {
        ...(patch['splitLine'] as object),
        ...((a['splitLine'] as object) ?? {}),
        lineStyle: {
          ...((patch['splitLine'] as { lineStyle?: object }).lineStyle ?? {}),
          ...(((a['splitLine'] as { lineStyle?: object } | undefined)?.lineStyle) ?? {}),
        },
      },
      nameTextStyle: {
        ...(patch['nameTextStyle'] as object),
        ...((a['nameTextStyle'] as object) ?? {}),
      },
    };
  }
  return axis;
}

/**
 * Gauge `detail` / `title` (and linear bar labels) ignore top-level `textStyle`
 * and default to dark fills — patch from theme so dark mode stays readable.
 */
function applyThemeForegroundToSeries(
  series: unknown,
  foreground: string,
): unknown {
  if (!Array.isArray(series)) {
    return series;
  }
  return series.map((item) => {
    if (!item || typeof item !== 'object') {
      return item;
    }
    const s = { ...(item as Record<string, unknown>) };
    if (s['type'] === 'gauge') {
      const detail = { ...((s['detail'] as Record<string, unknown> | undefined) ?? {}) };
      const title = { ...((s['title'] as Record<string, unknown> | undefined) ?? {}) };
      if (detail['color'] == null) {
        detail['color'] = foreground;
      }
      if (title['color'] == null) {
        title['color'] = foreground;
      }
      s['detail'] = detail;
      s['title'] = title;
    }
    if (s['label'] && typeof s['label'] === 'object') {
      const label = { ...(s['label'] as Record<string, unknown>) };
      if (label['show'] && label['color'] == null) {
        label['color'] = foreground;
        s['label'] = label;
      }
    }
    if (s['markLine'] && typeof s['markLine'] === 'object') {
      const markLine = { ...(s['markLine'] as Record<string, unknown>) };
      const lineStyle = {
        ...((markLine['lineStyle'] as Record<string, unknown> | undefined) ?? {}),
      };
      const mlLabel = {
        ...((markLine['label'] as Record<string, unknown> | undefined) ?? {}),
      };
      // Builder may omit color; prefer live theme on-surface.
      if (lineStyle['color'] == null) {
        lineStyle['color'] = foreground;
      }
      if (mlLabel['color'] == null) {
        mlLabel['color'] = foreground;
      }
      markLine['lineStyle'] = lineStyle;
      markLine['label'] = mlLabel;
      s['markLine'] = markLine;
    }
    return s;
  });
}

/** Merge Pixel theme tokens into a family option (axes + tooltip + text). */
export function mergeThemedOption(
  theme: ReturnType<typeof buildPixelChartEChartsTheme>,
  opt: EChartsCoreOption,
  animation: boolean,
): EChartsCoreOption {
  const raw = opt as Record<string, unknown>;
  const tooltipOpt = (raw['tooltip'] as Record<string, unknown> | undefined) ?? {};
  const { textStyle: _ignoredText, tooltip: _ignoredTip, xAxis: _ix, yAxis: _iy, ...rest } =
    raw;
  const foreground = theme.textStyle.color;
  const merged: Record<string, unknown> = {
    color: [...theme.color],
    backgroundColor: theme.backgroundColor,
    animation,
    ...rest,
    textStyle: {
      ...theme.textStyle,
      ...((raw['textStyle'] as object) ?? {}),
    },
    tooltip: {
      backgroundColor: theme.tooltip.backgroundColor,
      borderColor: theme.tooltip.borderColor,
      ...tooltipOpt,
      textStyle: {
        ...theme.tooltip.textStyle,
        ...((tooltipOpt['textStyle'] as object) ?? {}),
      },
    },
  };
  if (raw['series'] != null) {
    merged['series'] = applyThemeForegroundToSeries(raw['series'], foreground);
  }
  // Pie / donut center label uses ECharts `title` — merge theme color (dark/light).
  if (raw['title'] != null) {
    merged['title'] = mergeTitleOption(theme.title, raw['title']);
  }
  if (raw['dataZoom'] != null) {
    merged['dataZoom'] = applyThemeToDataZoom(
      raw['dataZoom'],
      theme.color[0] ?? '#1565c0',
      theme.categoryAxis.axisLine.lineStyle.color,
      foreground,
    );
  }
  // Only merge axes the family option defines — injecting defaults breaks pie / radar / gauge.
  if (raw['xAxis'] != null) {
    merged['xAxis'] = mergeAxisOption(theme.categoryAxis, raw['xAxis']);
  }
  if (raw['yAxis'] != null) {
    merged['yAxis'] = mergeAxisOption(theme.valueAxis, raw['yAxis']);
  }
  return merged as EChartsCoreOption;
}

/** Apply live light/dark tokens to the canvas-rendered dataZoom slider. */
function applyThemeToDataZoom(
  value: unknown,
  primary: string,
  outline: string,
  foreground: string,
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => applyThemeToDataZoom(item, primary, outline, foreground));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  const zoom = { ...(value as Record<string, unknown>) };
  if (zoom['type'] !== 'slider') {
    return zoom;
  }
  zoom['borderColor'] = colorWithAlpha(outline, 0.35);
  zoom['backgroundColor'] = colorWithAlpha(outline, 0.08);
  zoom['fillerColor'] = colorWithAlpha(primary, 0.18);
  zoom['handleStyle'] = {
    ...((zoom['handleStyle'] as object | undefined) ?? {}),
    color: primary,
    borderColor: primary,
  };
  zoom['moveHandleStyle'] = {
    ...((zoom['moveHandleStyle'] as object | undefined) ?? {}),
    color: primary,
    opacity: 1,
  };
  zoom['dataBackground'] = {
    lineStyle: { color: colorWithAlpha(outline, 0.35), width: 1 },
    areaStyle: { color: colorWithAlpha(outline, 0.12) },
  };
  zoom['selectedDataBackground'] = {
    lineStyle: { color: colorWithAlpha(primary, 0.65), width: 1 },
    areaStyle: { color: colorWithAlpha(primary, 0.22) },
  };
  zoom['textStyle'] = {
    ...((zoom['textStyle'] as object | undefined) ?? {}),
    color: foreground,
  };
  return zoom;
}

function colorWithAlpha(color: string, alpha: number): string {
  const hex = color.trim().match(/^#([\da-f]{3}|[\da-f]{6})$/i)?.[1];
  if (hex) {
    const expanded =
      hex.length === 3
        ? [...hex].map((part) => `${part}${part}`).join('')
        : hex;
    const r = Number.parseInt(expanded.slice(0, 2), 16);
    const g = Number.parseInt(expanded.slice(2, 4), 16);
    const b = Number.parseInt(expanded.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  const rgb = color.trim().match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (rgb) {
    return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${alpha})`;
  }
  return color;
}

function mergeTitleOption(
  themeTitle: { readonly textStyle: { readonly color: string; readonly fontFamily?: string } },
  title: unknown,
): unknown {
  if (title == null) {
    return title;
  }
  if (Array.isArray(title)) {
    return title.map((item) => mergeTitleOption(themeTitle, item));
  }
  if (typeof title !== 'object') {
    return title;
  }
  const t = title as Record<string, unknown>;
  const textStyle = { ...((t['textStyle'] as Record<string, unknown> | undefined) ?? {}) };
  if (textStyle['color'] == null) {
    textStyle['color'] = themeTitle.textStyle.color;
  }
  if (textStyle['fontFamily'] == null && themeTitle.textStyle.fontFamily) {
    textStyle['fontFamily'] = themeTitle.textStyle.fontFamily;
  }
  return { ...t, textStyle };
}
