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
  model,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import type { EChartsType } from 'echarts/core';
import PixelButtonComponent from '../pixel-button/pixel-button';
import PixelCardComponent, {
  type PixelCardAppearance,
} from '../pixel-card/pixel-card';
import PixelEmptyStateComponent from '../pixel-empty-state/pixel-empty-state';
import PixelLoaderComponent from '../pixel-loader/pixel-loader';
import PixelMenuComponent from '../pixel-menu/pixel-menu';
import PixelMenuItemComponent from '../pixel-menu/pixel-menu-item';
import PixelMenuTriggerDirective from '../pixel-menu/pixel-menu-trigger';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';
import PixelTooltipDirective from '../pixel-tooltip/pixel-tooltip';
import { PixelExportService } from '../services/export/export.service';
import type { PixelExportColumn } from '../services/export/export.types';
import { buildChartTable } from '../pixel-chart/a11y/chart-table';
import type { PixelChartTableColumn, PixelChartTableRow } from '../pixel-chart/a11y/chart-table';
import {
  exportChartPdf,
  exportChartPng,
  exportChartSvg,
  type PixelChartExportMeta,
} from '../pixel-chart/export/chart-image-export';
import {
  PIXEL_CHART_ZOOM_CATEGORY_THRESHOLD,
  PIXEL_CHART_ZOOM_POINT_THRESHOLD,
  readChartZoomRange,
  resetChartZoom,
  resolveZoomSelectionEnabled,
  setChartZoomSelectActive,
  zoomRangeToCategoryLabels,
  type PixelChartZoomRange,
  type PixelChartZoomSelectionMode,
} from '../pixel-chart/builders/interaction-option';
import { resolvePixelChartPaletteColors } from '../pixel-chart/pixel-chart-theme';
import type { PixelChartPalette, PixelChartSeries } from '../pixel-chart/pixel-chart.types';

/** Card surface style for the shell — mirrors `pixel-card` appearances. */
export type PixelChartShellAppearance = PixelCardAppearance;

export type PixelChartLegendItem = {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly visible: boolean;
};

export type PixelChartLegendToggleEvent = {
  readonly seriesId: string;
  readonly visible: boolean;
};

export type { PixelChartZoomSelectionMode };

let nextId = 0;

/**
 * Dashboard card chrome around a chart plot, composed on a non-interactive `pixel-card`:
 * title, actions, legend, loading / skeleton / empty states. No inline data table —
 * export CSV from the download menu.
 *
 * Project the plot (`pixel-chart-bar`, …) into the default slot. Pass `getChart` so
 * image export and zoom-selection can reach the ECharts instance.
 */
@Component({
  selector: 'pixel-chart-shell',
  imports: [
    PixelButtonComponent,
    PixelCardComponent,
    PixelEmptyStateComponent,
    PixelLoaderComponent,
    PixelSkeletonComponent,
    PixelMenuComponent,
    PixelMenuItemComponent,
    PixelMenuTriggerDirective,
    PixelTooltipDirective,
  ],
  templateUrl: './pixel-chart-shell.html',
  styleUrl: './pixel-chart-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-chart-shell',
    '[id]': 'id() || fallbackId',
    '[attr.data-fullscreen]': 'isFullscreen() ? "" : null',
    '[attr.data-zoom-select]': 'zoomSelectActive() ? "" : null',
    '[attr.title]': 'null',
  },
})
export default class PixelChartShellComponent {
  private readonly hostRef = inject(ElementRef) as ElementRef<HTMLElement>;
  private readonly destroyRef = inject(DestroyRef);
  private readonly exporter = inject(PixelExportService);

  protected readonly fallbackId = `pixel-chart-shell-${++nextId}`;
  protected readonly exportMenuId = `${this.fallbackId}-export`;
  protected readonly moreMenuId = `${this.fallbackId}-more`;

  /**
   * Card title.
   *
   * @type {string}
   * @default ''
   */
  readonly title = input('');

  /**
   * Supporting description under the title.
   *
   * @type {string}
   * @default ''
   */
  readonly description = input('');

  /**
   * Breadcrumb labels rendered in PNG, SVG, and PDF export chrome.
   *
   * @type {readonly string[]}
   * @default []
   */
  readonly exportBreadcrumb = input<readonly string[]>([]);

  /**
   * Series used for legend (and CSV export when no explicit table rows).
   *
   * @type {readonly PixelChartSeries[]}
   * @default []
   */
  readonly series = input<readonly PixelChartSeries[]>([]);

  /**
   * Categories for CSV export and the zoomed-range preview label.
   *
   * @type {readonly string[]}
   * @default []
   */
  readonly categories = input<readonly string[]>([]);

  /**
   * Optional explicit CSV columns (pie / custom). When set with `tableRows`, skips cartesian builder.
   *
   * @type {readonly PixelChartTableColumn[] | null}
   * @default null
   */
  readonly tableColumns = input<readonly PixelChartTableColumn[] | null>(null);

  /**
   * Optional explicit CSV rows paired with `tableColumns`.
   *
   * @type {readonly PixelChartTableRow[] | null}
   * @default null
   */
  readonly tableRows = input<readonly PixelChartTableRow[] | null>(null);

  /**
   * Palette for legend swatches when series lack explicit colors.
   *
   * @type {PixelChartPalette}
   * @default 'brand'
   */
  readonly palette = input<PixelChartPalette>('brand');

  /**
   * Series ids currently hidden.
   *
   * @type {readonly string[]}
   * @default []
   */
  readonly hiddenSeriesIds = model<readonly string[]>([]);

  /**
   * Show download / expand / more actions.
   *
   * @type {boolean}
   * @default true
   */
  readonly showActions = input(true, { transform: booleanAttribute });

  /**
   * Show the interactive series legend. Set false when the page supplies its own legend.
   *
   * @type {boolean}
   * @default true
   */
  readonly showLegend = input(true, { transform: booleanAttribute });

  /**
   * Outer `pixel-card` appearance. `outlined` matches the default chart card chrome;
   * `elevated` uses shadow instead of a border; `filled` uses a tonal surface.
   *
   * @type {PixelChartShellAppearance}
   * @default 'outlined'
   */
  readonly appearance = input<PixelChartShellAppearance>('outlined');

  /**
   * Show the ⋯ more menu (display options). Requires `showActions`.
   *
   * @type {boolean}
   * @default true
   */
  readonly showMoreMenu = input(true, { transform: booleanAttribute });

  /**
   * Two-way: plot value labels. Bind to the chart's `showValues` as a boolean.
   *
   * @type {boolean}
   * @default false
   */
  readonly showValues = model(false);

  /**
   * Show the "Show values" item in the more menu.
   *
   * @type {boolean}
   * @default true
   */
  readonly showValueToggle = input(true, { transform: booleanAttribute });

  /**
   * Zoom-selection chrome (toolbar + keyboard). `auto` when categories/points are large.
   *
   * @type {boolean | 'auto'}
   * @default 'auto'
   */
  readonly zoomSelection = input<PixelChartZoomSelectionMode>('auto');

  /**
   * Category count threshold for `zoomSelection="auto"`.
   *
   * @type {number}
   * @default 24
   */
  readonly zoomThreshold = input(PIXEL_CHART_ZOOM_CATEGORY_THRESHOLD, {
    transform: numberAttribute,
  });

  /**
   * Point-count threshold for scatter-like series when categories are short.
   *
   * @type {number}
   * @default 50
   */
  readonly zoomPointThreshold = input(PIXEL_CHART_ZOOM_POINT_THRESHOLD, {
    transform: numberAttribute,
  });

  /**
   * Show a small zoomed-range preview card when the chart is zoomed.
   *
   * @type {boolean}
   * @default false
   */
  readonly showZoomPreview = input(false, { transform: booleanAttribute });

  /**
   * Loading overlay with `pixel-loader`.
   *
   * @type {boolean}
   * @default false
   */
  readonly loading = input(false, { transform: booleanAttribute });

  /**
   * Skeleton placeholder instead of the plot.
   *
   * @type {boolean}
   * @default false
   */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  /**
   * Empty-state override. `null` (default) = empty when shell `series` have no data.
   * Set `false` for plots that do not use shell series (e.g. gauges).
   *
   * @type {boolean | null}
   * @default null
   */
  readonly empty = input<boolean | null>(null);

  /**
   * Empty-state heading when there is no series data.
   *
   * @type {string}
   * @default 'No data'
   */
  readonly emptyHeading = input('No data');

  /**
   * Empty-state description.
   *
   * @type {string}
   * @default 'There is nothing to chart yet.'
   */
  readonly emptyDescription = input('There is nothing to chart yet.');

  /**
   * Loader accessible label.
   *
   * @type {string}
   * @default 'Loading chart'
   */
  readonly loadingLabel = input('Loading chart');

  /**
   * Base file name for PNG / SVG / CSV export (no extension).
   *
   * @type {string}
   * @default 'chart'
   */
  readonly exportFileName = input('chart');

  /**
   * Returns the live ECharts instance for image export / zoom.
   *
   * @type {() => EChartsType | null}
   * @default () => null
   */
  readonly getChart = input<() => EChartsType | null>(() => null);

  /**
   * Optional id override.
   *
   * @type {string}
   * @default ''
   */
  readonly id = input('');

  /** Legend series visibility toggled. */
  readonly legendToggle = output<PixelChartLegendToggleEvent>();

  protected readonly fullscreenError = signal('');
  protected readonly isFullscreen = signal(false);
  protected readonly zoomSelectActive = signal(false);
  protected readonly zoomRange = signal<PixelChartZoomRange>({
    start: 0,
    end: 100,
    zoomed: false,
  });
  protected readonly zoomPreviewUrl = signal('');

  private chartUnbind: (() => void) | null = null;
  private previewThemeObserver: MutationObserver | null = null;
  private previewRefreshFrame: number | null = null;

  constructor() {
    if (typeof document !== 'undefined') {
      const onFs = () => {
        this.isFullscreen.set(document.fullscreenElement === this.hostRef.nativeElement);
      };
      document.addEventListener('fullscreenchange', onFs);
      this.destroyRef.onDestroy(() => {
        document.removeEventListener('fullscreenchange', onFs);
        this.chartUnbind?.();
        this.previewThemeObserver?.disconnect();
        if (this.previewRefreshFrame != null) {
          cancelAnimationFrame(this.previewRefreshFrame);
        }
      });
    }

    afterNextRender(() => {
      this.bindChartListeners();
      this.watchPreviewTheme();
    });

    effect(() => {
      this.getChart();
      this.zoomChromeEnabled();
      this.bindChartListeners();
    });
  }

  protected readonly zoomChromeEnabled = computed(() =>
    resolveZoomSelectionEnabled(
      this.zoomSelection(),
      this.categories(),
      this.series(),
      this.zoomThreshold(),
      this.zoomPointThreshold(),
    ),
  );

  protected readonly zoomedRangeLabel = computed(() => {
    const chips = zoomRangeToCategoryLabels(
      this.categories(),
      this.zoomRange().start,
      this.zoomRange().end,
    );
    return chips ? `${chips.startLabel} – ${chips.endLabel}` : null;
  });

  protected readonly isEmpty = computed(() => {
    if (this.loading() || this.showSkeleton()) {
      return false;
    }
    const override = this.empty();
    if (override != null) {
      return override;
    }
    if (this.tableColumns() && this.tableRows()) {
      return this.tableRows()!.length === 0 && this.series().length === 0;
    }
    return this.series().length === 0;
  });

  protected readonly legendItems = computed((): PixelChartLegendItem[] => {
    const colors = resolvePixelChartPaletteColors(this.palette());
    const hidden = new Set(this.hiddenSeriesIds());
    return this.series().map((s, index) => ({
      id: s.id,
      name: s.name,
      color: s.color ?? colors[index % colors.length]!,
      visible: !hidden.has(s.id),
    }));
  });

  protected readonly moreMenuEnabled = computed(
    () => this.showActions() && this.showMoreMenu() && this.showValueToggle(),
  );

  private readonly exportTable = computed(() => {
    const cols = this.tableColumns();
    const rows = this.tableRows();
    if (cols && rows) {
      return { columns: cols, rows };
    }
    return buildChartTable({ series: this.series(), categories: this.categories() });
  });

  private readonly exportMeta = computed<PixelChartExportMeta>(() => ({
    title: this.title(),
    description: this.description(),
    breadcrumb: this.exportBreadcrumb(),
    legendItems: this.legendItems(),
  }));

  protected onZoomToggle(pressed: boolean): void {
    this.zoomSelectActive.set(pressed);
    setChartZoomSelectActive(this.getChart()(), pressed);
  }

  protected setShowValues(value: boolean): void {
    this.showValues.set(value);
  }

  protected toggleZoomSelect(): void {
    this.onZoomToggle(!this.zoomSelectActive());
  }

  protected onResetZoom(): void {
    resetChartZoom(this.getChart()());
    this.zoomSelectActive.set(false);
    this.refreshZoomState();
  }

  protected onShellKeydown(event: KeyboardEvent): void {
    if (!this.zoomChromeEnabled()) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
    ) {
      return;
    }
    const key = event.key.toLowerCase();
    if (key === 'z') {
      event.preventDefault();
      this.toggleZoomSelect();
    } else if (key === 'escape') {
      event.preventDefault();
      setChartZoomSelectActive(this.getChart()(), false);
      this.zoomSelectActive.set(false);
    } else if (key === 'r') {
      event.preventDefault();
      this.onResetZoom();
    }
  }

  protected onLegendClick(item: PixelChartLegendItem, event: Event): void {
    event.preventDefault();
    const hidden = new Set(this.hiddenSeriesIds());
    const nextVisible = !item.visible;
    if (nextVisible) {
      hidden.delete(item.id);
    } else {
      const visibleCount = this.series().filter((s) => !hidden.has(s.id)).length;
      if (visibleCount <= 1) {
        return;
      }
      hidden.add(item.id);
    }
    this.hiddenSeriesIds.set([...hidden]);
    this.legendToggle.emit({ seriesId: item.id, visible: nextVisible });
  }

  protected async exportPng(): Promise<void> {
    await exportChartPng(this.getChart()(), this.exportFileName(), this.exportMeta());
  }

  protected exportSvg(): void {
    exportChartSvg(this.getChart()(), this.exportFileName(), this.exportMeta());
  }

  protected async exportPdf(): Promise<void> {
    await exportChartPdf(this.getChart()(), this.exportFileName(), this.exportMeta());
  }

  protected exportTableCsv(): void {
    const { columns, rows } = this.exportTable();
    const exportCols: PixelExportColumn[] = columns.map((c) => ({
      key: c.key,
      header: c.header,
    }));
    this.exporter.exportTable([...rows], exportCols, 'csv', {
      fileName: this.exportFileName(),
    });
  }

  protected async toggleFullscreen(): Promise<void> {
    this.fullscreenError.set('');
    const el = this.hostRef.nativeElement;
    try {
      if (document.fullscreenElement === el) {
        await document.exitFullscreen();
      } else if (el.requestFullscreen) {
        await el.requestFullscreen();
      }
    } catch {
      this.fullscreenError.set('Fullscreen is not available in this browser.');
    }
  }

  private bindChartListeners(): void {
    this.chartUnbind?.();
    this.chartUnbind = null;
    if (!this.zoomChromeEnabled()) {
      return;
    }
    const chart = this.getChart()();
    if (!chart) {
      return;
    }

    const onZoom = () => this.refreshZoomState();
    const onDblClick = () => this.onResetZoom();

    chart.on('datazoom', onZoom);
    chart.on('brushEnd', () => {
      this.refreshZoomState();
      this.zoomSelectActive.set(false);
      setChartZoomSelectActive(chart, false);
    });
    chart.getZr().on('dblclick', onDblClick);

    this.refreshZoomState();

    this.chartUnbind = () => {
      try {
        chart.off('datazoom', onZoom);
        chart.getZr().off('dblclick', onDblClick);
      } catch {
        // disposed
      }
    };
  }

  private refreshZoomState(): void {
    const chart = this.getChart()();
    const range = readChartZoomRange(chart);
    this.zoomRange.set(range);
    if (this.showZoomPreview() && range.zoomed && chart) {
      try {
        this.zoomPreviewUrl.set(
          chart.getDataURL({
            type: 'png',
            pixelRatio: 1,
            backgroundColor:
              getComputedStyle(this.hostRef.nativeElement)
                .getPropertyValue('--pixel-chart-shell-bg')
                .trim() || '#ffffff',
          }),
        );
      } catch {
        this.zoomPreviewUrl.set('');
      }
    } else {
      this.zoomPreviewUrl.set('');
    }
  }

  /** Restore zoom UI state after the chart host applies a theme-only render. */
  private watchPreviewTheme(): void {
    if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') {
      return;
    }
    const refresh = () => {
      if (this.previewRefreshFrame != null) {
        cancelAnimationFrame(this.previewRefreshFrame);
      }
      this.previewRefreshFrame = requestAnimationFrame(() => {
        this.previewRefreshFrame = null;
        this.refreshZoomState();
        if (this.zoomSelectActive()) {
          setChartZoomSelectActive(this.getChart()(), true);
        }
      });
    };
    this.previewThemeObserver = new MutationObserver(refresh);
    const options: MutationObserverInit = {
      attributes: true,
      attributeFilter: ['data-theme', 'data-color-scheme'],
    };
    this.previewThemeObserver.observe(document.documentElement, options);
    const themed = this.hostRef.nativeElement.closest('[data-theme], [data-color-scheme]');
    if (themed && themed !== document.documentElement) {
      this.previewThemeObserver.observe(themed, options);
    }
  }
}
