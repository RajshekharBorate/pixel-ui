import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import { PixelButtonComponent, PixelSelectComponent, type PixelSelectOption  } from 'pixel-ui';
import {
  PixelChartRadarComponent,
  PixelChartShellComponent,
  buildRadarTable,
  type PixelChartRadarIndicator,
  type PixelChartRadarMode,
  type PixelChartSeries,
} from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-radar-basic-example',
  imports: [PixelButtonComponent, PixelChartShellComponent, PixelChartRadarComponent, PixelSelectComponent],
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
      title="Radar"
      description="Use ⋯ to show or hide vertex values. Multi-level labels via indicator.group."
      [series]="series()"
      [tableColumns]="table().columns"
      [tableRows]="table().rows"
      [(hiddenSeriesIds)]="hidden"
      [(showValues)]="showValues"
      [getChart]="chartGetter"
      exportFileName="radar-skills"
     [showSkeleton]="showSkeleton()">
      <pixel-chart-radar
        #radar
        [indicators]="indicators"
        [series]="series()"
        [hiddenSeriesIds]="hidden()"
        [mode]="mode()"
        [showValues]="showValues()"
        [target]="target"
        [rangeLow]="rangeLow"
        [rangeHigh]="rangeHigh"
        [thresholds]="thresholds"
        ariaLabel="Team skills radar"
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
export class ChartRadarBasicExample {
  readonly showSkeleton = signal(false);

  private readonly radar = viewChild.required(PixelChartRadarComponent);

  readonly modeOptions: readonly PixelSelectOption[] = [
    { value: 'line', label: 'line' },
    { value: 'filled', label: 'filled' },
    { value: 'markers', label: 'markers' },
    { value: 'target', label: 'target' },
    { value: 'range', label: 'range' },
    { value: 'threshold', label: 'threshold' },
    { value: 'polar-area', label: 'polar-area' },
  ];

  readonly indicators: readonly PixelChartRadarIndicator[] = [
    { name: 'Speed', max: 100, group: 'Delivery' },
    { name: 'Quality', max: 100, group: 'Delivery' },
    { name: 'Support', max: 100, group: 'Service' },
    { name: 'Features', max: 100, group: 'Product' },
    { name: 'Value', max: 100, group: 'Product' },
  ];

  readonly target = [90, 88, 85, 80, 92];
  readonly rangeLow = [55, 60, 50, 45, 55];
  readonly rangeHigh = [95, 92, 90, 88, 96];
  readonly thresholds = [40, 70, 90];

  readonly series = signal<readonly PixelChartSeries[]>([
    { id: 'a', name: 'Team A', data: [80, 72, 68, 75, 70] },
    { id: 'b', name: 'Team B', data: [65, 80, 78, 60, 85] },
  ]);
  readonly hidden = signal<readonly string[]>([]);
  readonly mode = signal<PixelChartRadarMode>('filled');
  readonly showValues = signal(false);

  readonly table = computed(() =>
    buildRadarTable(this.indicators, this.series(), this.target),
  );

  readonly chartGetter = () => this.radar()?.getChart() ?? null;

  protected onMode(value: unknown): void {
    if (typeof value === 'string') {
      this.mode.set(value as PixelChartRadarMode);
    }
  }
}
