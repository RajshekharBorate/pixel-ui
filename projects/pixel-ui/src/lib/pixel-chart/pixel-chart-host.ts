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
  PixelChartEChartsTheme,
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
    '[attr.data-drillable]': 'drillable() ? "" : null',
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

  /**
   * ECharts connect group id for multi-chart axis / dataZoom sync.
   * Charts that share the same non-empty string stay linked. Prefer this over
   * calling `connectPixelCharts` when plots are owned by facades.
   *
   * @type {string}
   * @default ''
   */
  readonly syncGroup = input('');

  /**
   * Pointer cursor on the plot — use when clicks drill or navigate.
   * Does not change hit-testing; apps still own drill logic.
   *
   * @type {boolean}
   * @default false
   */
  readonly drillable = input(false, { transform: booleanAttribute });

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
  /** Skip the redundant effect apply that follows `initChart`'s first `setOption`. */
  private suppressNextOptionApply = false;
  /** Re-apply once the plot gets a non-zero size (entrance animation needs layout). */
  private pendingLayoutApply = false;

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

    effect(() => {
      if (!this.browserReady() || !this.chart) {
        return;
      }
      this.applySyncGroup(this.syncGroup());
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
    // `browserReady` just flipped — the option effect would `setOption` again with
    // `notMerge` and cancel ECharts entrance animation (pies look static).
    this.suppressNextOptionApply = true;
    this.applySyncGroup(this.syncGroup());
    this.chartReady.emit({ chart: this.chart });
  }

  private applySyncGroup(group: string): void {
    if (!this.chart) {
      return;
    }
    const id = group.trim();
    if (!id) {
      if (this.chart.group) {
        this.chart.group = undefined as unknown as string;
      }
      return;
    }
    this.chart.group = id;
    echarts.connect(id);
  }

  private applyOption(preserveZoom = false): void {
    if (!this.chart) {
      return;
    }
    if (this.suppressNextOptionApply) {
      this.suppressNextOptionApply = false;
      return;
    }
    const opt = this.option();
    if (!opt) {
      this.chart.clear();
      this.pendingLayoutApply = false;
      return;
    }
    const el = this.plot().nativeElement;
    if (el.clientWidth <= 0 || el.clientHeight <= 0) {
      // Animate on the first paint with real dimensions (docs tabs / delayed layout).
      this.pendingLayoutApply = true;
      return;
    }
    this.pendingLayoutApply = false;
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
        if (this.pendingLayoutApply) {
          this.applyOption();
        }
      }, 100);
    });
    this.resizeObserver.observe(el);
    // Lazy docs tabs / projected shells can initialize while the plot is still 0×0.
    // Resize once after layout even when the observer's initial delivery is missed.
    this.resizeTimer = setTimeout(() => {
      this.chart?.resize();
      if (this.pendingLayoutApply) {
        this.applyOption();
      }
    }, 100);
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

function axisThemePatch(
  axis: PixelChartAxisTheme,
  showAxisLine: boolean,
): Record<string, unknown> {
  return {
    axisLine: {
      ...(showAxisLine ? { show: true } : {}),
      lineStyle: { ...axis.axisLine.lineStyle },
    },
    axisTick: { lineStyle: { ...axis.axisTick.lineStyle } },
    axisLabel: { ...axis.axisLabel },
    splitLine: { lineStyle: { ...axis.splitLine.lineStyle } },
    nameTextStyle: { ...axis.nameTextStyle },
  };
}

function mergeAxisOption(
  themeAxis: PixelChartAxisTheme,
  axis: unknown,
  showAxisLine = false,
): unknown {
  if (axis == null) {
    return axisThemePatch(themeAxis, showAxisLine);
  }
  if (Array.isArray(axis)) {
    return axis.map((item) => mergeAxisOption(themeAxis, item, showAxisLine));
  }
  if (typeof axis === 'object') {
    const a = axis as Record<string, unknown>;
    const patch = axisThemePatch(themeAxis, showAxisLine);
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

/** Radar indicator labels do not inherit top-level ECharts textStyle. */
function mergeRadarOption(
  theme: ReturnType<typeof buildPixelChartEChartsTheme>,
  radar: unknown,
): unknown {
  if (Array.isArray(radar)) {
    return radar.map((item) => mergeRadarOption(theme, item));
  }
  if (!radar || typeof radar !== 'object') {
    return radar;
  }

  const value = radar as Record<string, unknown>;
  const axisName = (value['axisName'] as Record<string, unknown> | undefined) ?? {};
  const axisLine = (value['axisLine'] as Record<string, unknown> | undefined) ?? {};
  const splitLine = (value['splitLine'] as Record<string, unknown> | undefined) ?? {};

  return {
    ...value,
    axisName: {
      color: theme.textStyle.color,
      fontFamily: theme.textStyle.fontFamily,
      ...axisName,
    },
    axisLine: {
      ...axisLine,
      lineStyle: {
        color: theme.categoryAxis.axisLine.lineStyle.color,
        ...((axisLine['lineStyle'] as object | undefined) ?? {}),
      },
    },
    splitLine: {
      ...splitLine,
      lineStyle: {
        ...theme.valueAxis.splitLine.lineStyle,
        ...((splitLine['lineStyle'] as object | undefined) ?? {}),
      },
    },
  };
}

/**
 * Gauge `detail` / `title` / scale labels (and linear bar labels) ignore top-level
 * `textStyle` and default to dark fills — patch from theme so dark mode stays readable.
 */
function applyThemeForegroundToSeries(
  series: unknown,
  theme: ReturnType<typeof buildPixelChartEChartsTheme>,
): unknown {
  if (!Array.isArray(series)) {
    return series;
  }
  const foreground = theme.textStyle.color;
  const fontFamily = theme.textStyle.fontFamily;
  return series.map((item) => {
    if (!item || typeof item !== 'object') {
      return item;
    }
    const s = { ...(item as Record<string, unknown>) };
    if (s['type'] === 'gauge') {
      const detail = { ...((s['detail'] as Record<string, unknown> | undefined) ?? {}) };
      const title = { ...((s['title'] as Record<string, unknown> | undefined) ?? {}) };
      const axisLabel = {
        ...((s['axisLabel'] as Record<string, unknown> | undefined) ?? {}),
      };
      const axisTick = {
        ...((s['axisTick'] as Record<string, unknown> | undefined) ?? {}),
      };
      const axisTickLineStyle = {
        ...((axisTick['lineStyle'] as Record<string, unknown> | undefined) ?? {}),
      };
      const splitLine = {
        ...((s['splitLine'] as Record<string, unknown> | undefined) ?? {}),
      };
      const splitLineStyle = {
        ...((splitLine['lineStyle'] as Record<string, unknown> | undefined) ?? {}),
      };
      const anchor = {
        ...((s['anchor'] as Record<string, unknown> | undefined) ?? {}),
      };
      const anchorItemStyle = {
        ...((anchor['itemStyle'] as Record<string, unknown> | undefined) ?? {}),
      };
      if (detail['color'] == null) {
        detail['color'] = foreground;
      }
      if (detail['fontFamily'] == null) {
        detail['fontFamily'] = fontFamily;
      }
      if (title['color'] == null) {
        title['color'] = foreground;
      }
      if (title['fontFamily'] == null) {
        title['fontFamily'] = fontFamily;
      }
      if (axisLabel['color'] == null) {
        axisLabel['color'] = theme.valueAxis.axisLabel.color;
      }
      if (axisLabel['fontFamily'] == null) {
        axisLabel['fontFamily'] = theme.valueAxis.axisLabel.fontFamily;
      }
      if (axisTickLineStyle['color'] == null) {
        axisTickLineStyle['color'] = theme.valueAxis.axisTick.lineStyle.color;
      }
      if (splitLineStyle['color'] == null) {
        splitLineStyle['color'] = theme.valueAxis.splitLine.lineStyle.color;
      }
      axisTick['lineStyle'] = axisTickLineStyle;
      splitLine['lineStyle'] = splitLineStyle;
      if (anchor['show'] && anchorItemStyle['borderColor'] == null) {
        anchorItemStyle['borderColor'] = theme.tooltip.backgroundColor;
      }
      if (anchor['show'] && anchorItemStyle['borderWidth'] == null) {
        anchorItemStyle['borderWidth'] = 2;
      }
      anchor['itemStyle'] = anchorItemStyle;
      s['detail'] = detail;
      s['title'] = title;
      s['axisLabel'] = axisLabel;
      s['axisTick'] = axisTick;
      s['splitLine'] = splitLine;
      s['anchor'] = anchor;
    }
    if (s['label'] && typeof s['label'] === 'object') {
      const label = { ...(s['label'] as Record<string, unknown>) };
      if (label['show'] && label['color'] == null) {
        label['color'] = foreground;
        s['label'] = label;
      }
    }
    if (s['endLabel'] && typeof s['endLabel'] === 'object') {
      const endLabel = { ...(s['endLabel'] as Record<string, unknown>) };
      if (endLabel['show'] && endLabel['color'] == null) {
        endLabel['color'] = foreground;
        s['endLabel'] = endLabel;
      }
    }
    if (s['emphasis'] && typeof s['emphasis'] === 'object') {
      const emphasis = { ...(s['emphasis'] as Record<string, unknown>) };
      if (emphasis['label'] && typeof emphasis['label'] === 'object') {
        const label = { ...(emphasis['label'] as Record<string, unknown>) };
        if (label['show'] && label['color'] == null) {
          label['color'] = foreground;
          emphasis['label'] = label;
          s['emphasis'] = emphasis;
        }
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
      borderWidth: theme.tooltip.borderWidth,
      padding: [...theme.tooltip.padding],
      ...tooltipOpt,
      extraCssText: [theme.tooltip.extraCssText, tooltipOpt['extraCssText']]
        .filter((v): v is string => typeof v === 'string' && v.length > 0)
        .join(';'),
      textStyle: {
        ...theme.tooltip.textStyle,
        ...((tooltipOpt['textStyle'] as object) ?? {}),
      },
    },
  };
  if (raw['series'] != null) {
    merged['series'] = applyThemeForegroundToSeries(raw['series'], theme);
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
    merged['xAxis'] = mergeAxisOption(theme.categoryAxis, raw['xAxis'], true);
  }
  if (raw['yAxis'] != null) {
    merged['yAxis'] = mergeAxisOption(theme.valueAxis, raw['yAxis'], true);
  }
  if (raw['angleAxis'] != null) {
    merged['angleAxis'] = mergeAxisOption(theme.categoryAxis, raw['angleAxis']);
  }
  if (raw['radiusAxis'] != null) {
    merged['radiusAxis'] = mergeAxisOption(theme.valueAxis, raw['radiusAxis']);
  }
  if (raw['radar'] != null) {
    merged['radar'] = mergeRadarOption(theme, raw['radar']);
  }
  if (theme.map && (raw['geo'] != null || hasMapSeries(raw['series']))) {
    if (raw['geo'] != null) {
      merged['geo'] = applyThemeToGeo(theme.map, raw['geo']);
    }
    if (raw['series'] != null) {
      merged['series'] = applyThemeToMapSeries(theme.map, merged['series'] ?? raw['series']);
    }
  }
  // Option visualMap without inRange would otherwise keep ECharts' light default ramp
  // (near-white lows → hard "box" kernels on dark oceans).
  if (raw['visualMap'] != null && theme.visualMap) {
    merged['visualMap'] = applyThemeToVisualMap(
      theme.visualMap,
      raw['visualMap'],
      merged['series'] ?? raw['series'],
    );
  }
  return merged as EChartsCoreOption;
}

function hasMapSeries(value: unknown): boolean {
  if (!Array.isArray(value)) {
    return false;
  }
  return value.some(
    (item) => !!item && typeof item === 'object' && (item as { type?: string }).type === 'map',
  );
}

function hasHeatmapSeries(value: unknown): boolean {
  if (!Array.isArray(value)) {
    return false;
  }
  return value.some(
    (item) =>
      !!item && typeof item === 'object' && (item as { type?: string }).type === 'heatmap',
  );
}

/**
 * Merge theme visualMap chrome (ramp + legend text). Heatmap ramps get a transparent
 * edge stop plus the vivid upper theme colors so kernels stay soft *and* readable.
 */
function applyThemeToVisualMap(
  themeVm: NonNullable<PixelChartEChartsTheme['visualMap']>,
  value: unknown,
  series: unknown,
): unknown {
  const softenHeatmap = hasHeatmapSeries(series);
  if (Array.isArray(value)) {
    return value.map((item) => applyThemeToVisualMap(themeVm, item, series));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  const vm = { ...(value as Record<string, unknown>) };
  const optInRange = {
    ...((vm['inRange'] as Record<string, unknown> | undefined) ?? {}),
  };
  const themeColors = themeVm.inRange?.color;
  let colors =
    (optInRange['color'] as readonly string[] | undefined) ??
    (themeColors ? [...themeColors] : undefined);
  if (softenHeatmap && colors && colors.length > 0) {
    colors = withVisibleHeatmapRamp(colors);
  }
  vm['inRange'] = {
    ...(themeVm.inRange ?? {}),
    ...optInRange,
    ...(colors ? { color: colors } : {}),
  };
  if (themeVm.textStyle) {
    vm['textStyle'] = {
      ...themeVm.textStyle,
      ...((vm['textStyle'] as object | undefined) ?? {}),
    };
  }
  return vm;
}

/**
 * Soft edge (transparent) + upper choropleth stops only. Using the full dark ramp after
 * transparent mapped most intensity into near-invisible mud; skipping lows keeps data lit.
 */
function withVisibleHeatmapRamp(colors: readonly string[]): string[] {
  const body =
    colors[0] === 'rgba(0, 0, 0, 0)' || colors[0] === 'transparent'
      ? colors.slice(1)
      : [...colors];
  const vivid =
    body.length <= 2 ? body : body.slice(Math.max(0, body.length - 3));
  return ['rgba(0, 0, 0, 0)', ...vivid];
}

function applyThemeToGeo(
  mapTheme: NonNullable<PixelChartEChartsTheme['map']>,
  value: unknown,
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => applyThemeToGeo(mapTheme, item));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  const geo = { ...(value as Record<string, unknown>) };
  const itemStyle = {
    areaColor: mapTheme.noDataColor,
    borderColor: mapTheme.borderColor,
    ...((geo['itemStyle'] as object | undefined) ?? {}),
  };
  // Prefer live tokens over builder fallbacks.
  itemStyle['areaColor'] = mapTheme.noDataColor;
  itemStyle['borderColor'] = mapTheme.borderColor;
  geo['itemStyle'] = itemStyle;
  return geo;
}

function applyThemeToMapSeries(
  mapTheme: NonNullable<PixelChartEChartsTheme['map']>,
  value: unknown,
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => applyThemeToMapSeries(mapTheme, item));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  const series = { ...(value as Record<string, unknown>) };
  if (series['type'] !== 'map') {
    return series;
  }
  const itemStyle = {
    ...((series['itemStyle'] as object | undefined) ?? {}),
    areaColor: mapTheme.noDataColor,
    borderColor: mapTheme.borderColor,
  };
  series['itemStyle'] = itemStyle;
  const emphasis = {
    ...((series['emphasis'] as Record<string, unknown> | undefined) ?? {}),
  } as Record<string, unknown>;
  const emphasisItem = {
    ...((emphasis['itemStyle'] as Record<string, unknown> | undefined) ?? {}),
    borderColor: mapTheme.emphasisBorderColor,
    shadowColor: mapTheme.shadowColor,
  };
  emphasis['itemStyle'] = emphasisItem;
  series['emphasis'] = emphasis;
  return series;
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
