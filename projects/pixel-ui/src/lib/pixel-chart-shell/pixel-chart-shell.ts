import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import type { EChartsType } from 'echarts/core';
import PixelButtonComponent from '../pixel-button/pixel-button';
import PixelEmptyStateComponent from '../pixel-empty-state/pixel-empty-state';
import PixelLoaderComponent from '../pixel-loader/pixel-loader';
import PixelMenuComponent from '../pixel-menu/pixel-menu';
import PixelMenuItemComponent from '../pixel-menu/pixel-menu-item';
import PixelMenuTriggerDirective from '../pixel-menu/pixel-menu-trigger';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';
import { PixelExportService } from '../services/export/export.service';
import type { PixelExportColumn } from '../services/export/export.types';
import { buildChartTable } from '../pixel-chart/a11y/chart-table';
import type { PixelChartTableColumn, PixelChartTableRow } from '../pixel-chart/a11y/chart-table';
import { exportChartPng, exportChartSvg } from '../pixel-chart/export/chart-image-export';
import { resolvePixelChartPaletteColors } from '../pixel-chart/pixel-chart-theme';
import type { PixelChartPalette, PixelChartSeries } from '../pixel-chart/pixel-chart.types';

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

let nextId = 0;

/**
 * Dashboard card chrome around a chart plot: title, actions, legend, loading /
 * skeleton / empty states. No inline data table — export CSV from the download menu.
 *
 * Project the plot (`pixel-chart-bar`, …) into the default slot. Pass `getChart` so
 * image export can reach the ECharts instance.
 */
@Component({
  selector: 'pixel-chart-shell',
  imports: [
    PixelButtonComponent,
    PixelEmptyStateComponent,
    PixelLoaderComponent,
    PixelSkeletonComponent,
    PixelMenuComponent,
    PixelMenuItemComponent,
    PixelMenuTriggerDirective,
  ],
  templateUrl: './pixel-chart-shell.html',
  styleUrl: './pixel-chart-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-chart-shell',
    '[id]': 'id() || fallbackId',
    '[attr.data-fullscreen]': 'isFullscreen() ? "" : null',
    // `title` is also a global HTML attribute — clear it so the card heading
    // does not become a native browser tooltip.
    '[attr.title]': 'null',
  },
})
export default class PixelChartShellComponent {
  private readonly hostRef = inject(ElementRef) as ElementRef<HTMLElement>;
  private readonly destroyRef = inject(DestroyRef);
  private readonly exporter = inject(PixelExportService);

  protected readonly fallbackId = `pixel-chart-shell-${++nextId}`;
  protected readonly exportMenuId = `${this.fallbackId}-export`;

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
   * Series used for legend (and CSV export when no explicit table rows).
   *
   * @type {readonly PixelChartSeries[]}
   * @default []
   */
  readonly series = input<readonly PixelChartSeries[]>([]);

  /**
   * Categories for CSV export (cartesian charts).
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
   * Show download / expand actions.
   *
   * @type {boolean}
   * @default true
   */
  readonly showActions = input(true, { transform: booleanAttribute });

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
   * Empty-state override. `null` (default) = empty when shell `series` have no data
   * (and optional CSV rows are empty). Set `false` for plots that do not use shell series
   * (e.g. gauges).
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
   * Returns the live ECharts instance for image export.
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

  constructor() {
    if (typeof document !== 'undefined') {
      const onFs = () => {
        this.isFullscreen.set(document.fullscreenElement === this.hostRef.nativeElement);
      };
      document.addEventListener('fullscreenchange', onFs);
      this.destroyRef.onDestroy(() => document.removeEventListener('fullscreenchange', onFs));
    }
  }

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

  private readonly exportTable = computed(() => {
    const cols = this.tableColumns();
    const rows = this.tableRows();
    if (cols && rows) {
      return { columns: cols, rows };
    }
    return buildChartTable({ series: this.series(), categories: this.categories() });
  });

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

  protected exportPng(): void {
    exportChartPng(this.getChart()(), this.exportFileName());
  }

  protected exportSvg(): void {
    exportChartSvg(this.getChart()(), this.exportFileName());
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
}
