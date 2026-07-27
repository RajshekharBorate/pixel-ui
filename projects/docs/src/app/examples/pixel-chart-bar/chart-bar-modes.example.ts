import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import {
  PixelChartBarComponent,
  PixelChartShellComponent,
  type PixelChartBarMode,
  type PixelChartBarOrientation,
  type PixelChartSeries,
} from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-bar-modes-example',
  imports: [PixelChartShellComponent, PixelChartBarComponent],
  template: `
    <div class="toolbar">
      <label>
        Mode
        <select [value]="mode()" (change)="onMode($event)">
          <option value="single">single</option>
          <option value="grouped">grouped</option>
          <option value="stacked">stacked</option>
          <option value="percent">percent</option>
        </select>
      </label>
      <label>
        Orientation
        <select [value]="orientation()" (change)="onOrientation($event)">
          <option value="vertical">vertical (column)</option>
          <option value="horizontal">horizontal</option>
        </select>
      </label>
    </div>

    <pixel-chart-shell
      title="Bar / column modes"
      description="Switch mode and orientation — same data."
      [series]="series()"
      [categories]="categories()"
      [(hiddenSeriesIds)]="hidden"
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
        ariaLabel="Bar chart modes demo"
      />
    </pixel-chart-shell>
  `,
  styles: `
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-block-end: 1rem;
      font-size: 0.875rem;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartBarModesExample {
  private readonly bar = viewChild.required(PixelChartBarComponent);

  readonly categories = signal(['Q1', 'Q2', 'Q3', 'Q4']);
  readonly series = signal<readonly PixelChartSeries[]>([
    { id: 'a', name: 'Product A', data: [30, 40, 35, 50] },
    { id: 'b', name: 'Product B', data: [45, 25, 40, 30] },
    { id: 'c', name: 'Product C', data: [25, 35, 20, 40] },
  ]);
  readonly hidden = signal<readonly string[]>([]);
  readonly mode = signal<PixelChartBarMode>('grouped');
  readonly orientation = signal<PixelChartBarOrientation>('vertical');

  readonly chartGetter = () => this.bar()?.getChart() ?? null;

  protected onMode(event: Event): void {
    this.mode.set((event.target as HTMLSelectElement).value as PixelChartBarMode);
  }

  protected onOrientation(event: Event): void {
    this.orientation.set((event.target as HTMLSelectElement).value as PixelChartBarOrientation);
  }
}
