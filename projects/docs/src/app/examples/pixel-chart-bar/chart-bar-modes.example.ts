import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { PixelSelectComponent, type PixelSelectOption } from 'pixel-ui';
import {
  PixelChartBarComponent,
  PixelChartShellComponent,
  type PixelChartBarMode,
  type PixelChartBarOrientation,
  type PixelChartSeries,
} from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-bar-modes-example',
  imports: [PixelChartShellComponent, PixelChartBarComponent, PixelSelectComponent],
  template: `
    <div class="toolbar">
      <pixel-select
        label="Mode"
        size="sm"
        [options]="modeOptions"
        [value]="mode()"
        (valueChange)="onMode($event)"
      />
      <pixel-select
        label="Orientation"
        size="sm"
        [options]="orientationOptions"
        [value]="orientation()"
        (valueChange)="onOrientation($event)"
      />
    </div>

    <pixel-chart-shell
      title="Bar / column modes"
      description="Use ⋯ to show or hide values. Switch mode and orientation — same data."
      [series]="series()"
      [categories]="categories()"
      [(hiddenSeriesIds)]="hidden"
      [(showValues)]="showValues"
      [getChart]="chartGetter"
      exportFileName="bar-modes"
    >
      <pixel-chart-bar
        #bar
        [series]="series()"
        [categories]="categories()"
        [hiddenSeriesIds]="hidden()"
        [mode]="mode()"
        [orientation]="orientation()"
        [showValues]="showValues()"
        ariaLabel="Bar chart modes demo"
      />
    </pixel-chart-shell>
  `,
  styles: `
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: var(--pixel-sys-space-md, 1rem);
      margin-block-end: var(--pixel-sys-space-md, 1rem);
      max-inline-size: 28rem;
    }
    .toolbar pixel-select {
      flex: 1 1 10rem;
      min-inline-size: 9rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartBarModesExample {
  private readonly bar = viewChild.required(PixelChartBarComponent);

  readonly modeOptions: readonly PixelSelectOption[] = [
    { value: 'single', label: 'single' },
    { value: 'grouped', label: 'grouped' },
    { value: 'stacked', label: 'stacked' },
    { value: 'percent', label: 'percent' },
  ];
  readonly orientationOptions: readonly PixelSelectOption[] = [
    { value: 'vertical', label: 'vertical (column)' },
    { value: 'horizontal', label: 'horizontal' },
  ];

  readonly categories = signal(['Q1', 'Q2', 'Q3', 'Q4']);
  readonly series = signal<readonly PixelChartSeries[]>([
    { id: 'a', name: 'Product A', data: [30, 40, 35, 50] },
    { id: 'b', name: 'Product B', data: [45, 25, 40, 30] },
    { id: 'c', name: 'Product C', data: [25, 35, 20, 40] },
  ]);
  readonly hidden = signal<readonly string[]>([]);
  readonly mode = signal<PixelChartBarMode>('grouped');
  readonly orientation = signal<PixelChartBarOrientation>('vertical');
  readonly showValues = signal(false);

  readonly chartGetter = () => this.bar()?.getChart() ?? null;

  protected onMode(value: unknown): void {
    if (typeof value === 'string') {
      this.mode.set(value as PixelChartBarMode);
    }
  }

  protected onOrientation(value: unknown): void {
    if (typeof value === 'string') {
      this.orientation.set(value as PixelChartBarOrientation);
    }
  }
}
