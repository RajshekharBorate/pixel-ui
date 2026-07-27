import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import {
  PixelChartAreaComponent,
  PixelChartShellComponent,
  type PixelChartAreaMode,
  type PixelChartSeries,
} from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-area-basic-example',
  imports: [PixelChartShellComponent, PixelChartAreaComponent],
  template: `
    <div class="toolbar">
      <label>
        Mode
        <select [value]="mode()" (change)="onMode($event)">
          <option value="overlay">overlay</option>
          <option value="stacked">stacked</option>
          <option value="percent">percent (100%)</option>
        </select>
      </label>
    </div>

    <pixel-chart-shell
      title="Area chart"
      description="Magnitude with fill — overlay, stacked, or 100% stacked."
      [series]="series()"
      [categories]="categories()"
      [(hiddenSeriesIds)]="hidden"
      [getChart]="chartGetter"
      exportFileName="area-sales"
    >
      <pixel-chart-area
        #area
        [series]="series()"
        [categories]="categories()"
        [hiddenSeriesIds]="hidden()"
        [mode]="mode()"
        ariaLabel="Monthly sales area chart"
      />
    </pixel-chart-shell>
  `,
  styles: `
    .toolbar {
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
export class ChartAreaBasicExample {
  private readonly area = viewChild.required(PixelChartAreaComponent);

  readonly categories = signal(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']);
  readonly series = signal<readonly PixelChartSeries[]>([
    { id: 'a', name: 'Product A', data: [40, 50, 45, 60, 55, 70, 65] },
    { id: 'b', name: 'Product B', data: [30, 35, 40, 38, 48, 52, 50] },
    { id: 'c', name: 'Product C', data: [20, 25, 22, 30, 28, 35, 40] },
  ]);
  readonly hidden = signal<readonly string[]>([]);
  readonly mode = signal<PixelChartAreaMode>('overlay');

  readonly chartGetter = () => this.area()?.getChart() ?? null;

  protected onMode(event: Event): void {
    this.mode.set((event.target as HTMLSelectElement).value as PixelChartAreaMode);
  }
}
