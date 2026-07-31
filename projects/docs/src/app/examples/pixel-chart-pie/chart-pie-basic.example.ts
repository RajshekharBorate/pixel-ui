import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import { PixelButtonComponent, PixelSelectComponent, type PixelSelectOption  } from 'pixel-ui';
import {
  PixelChartPieComponent,
  PixelChartShellComponent,
  buildPieTable,
  pieSlicesToLegendSeries,
  type PixelChartPieMode,
  type PixelChartPieSlice,
} from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-pie-basic-example',
  imports: [PixelButtonComponent, PixelChartShellComponent, PixelChartPieComponent, PixelSelectComponent],
  template: `
    <div class="toolbar">
      <pixel-select
        label="Mode"
        size="sm"
        [options]="modeOptions"
        [value]="mode()"
        (valueChange)="onMode($event)"
      />
    
      <pixel-button
        class="docs-chart-skeleton-toggle"
        size="sm"
        appearance="outline"
        (click)="showSkeleton.update((v) => !v)"
      >
        {{ showSkeleton() ? 'Hide skeleton' : 'Show skeleton' }}
      </pixel-button>
    </div>

    <pixel-chart-shell
      title="Category share"
      description="Use ⋯ to show or hide slice percentages. CSV from download."
      [series]="legendSeries()"
      [tableColumns]="table().columns"
      [tableRows]="table().rows"
      [(hiddenSeriesIds)]="hidden"
      [(showValues)]="showValues"
      [getChart]="chartGetter"
      exportFileName="category-share"
     [showSkeleton]="showSkeleton()">
      <pixel-chart-pie
        #pie
        [slices]="slices()"
        [mode]="mode()"
        [hiddenSliceIds]="hidden()"
        [showValues]="showValues()"
        ariaLabel="Category share"
       [showSkeleton]="showSkeleton()" />
    </pixel-chart-shell>
  `,
  styles: `
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: var(--pixel-sys-space-md, 1rem);
      margin-block-end: var(--pixel-sys-space-md, 1rem);
    }

    .toolbar > pixel-button {
      flex: 0 0 auto;
    }

    .toolbar > pixel-select {
      flex: 1 1 10rem;
      max-inline-size: 14rem;
      min-inline-size: 9rem;
    }

  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartPieBasicExample {
  readonly showSkeleton = signal(false);

  private readonly pie = viewChild.required(PixelChartPieComponent);

  readonly modeOptions: readonly PixelSelectOption[] = [
    { value: 'pie', label: 'pie' },
    { value: 'donut', label: 'donut' },
    { value: 'semi', label: 'semi' },
  ];

  readonly slices = signal<readonly PixelChartPieSlice[]>([
    { id: 'cloud', name: 'Cloud', value: 38 },
    { id: 'onprem', name: 'On-prem', value: 27 },
    { id: 'saas', name: 'SaaS', value: 22 },
    { id: 'other', name: 'Other', value: 13 },
  ]);
  readonly mode = signal<PixelChartPieMode>('donut');
  readonly hidden = signal<readonly string[]>([]);
  readonly showValues = signal(true);

  readonly legendSeries = computed(() => pieSlicesToLegendSeries(this.slices()));
  readonly table = computed(() => buildPieTable(this.slices()));

  readonly chartGetter = () => this.pie()?.getChart() ?? null;

  protected onMode(value: unknown): void {
    if (typeof value === 'string') {
      this.mode.set(value as PixelChartPieMode);
    }
  }
}
