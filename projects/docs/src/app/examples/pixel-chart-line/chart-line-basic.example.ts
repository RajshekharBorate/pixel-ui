import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import {
  PixelChartLineComponent,
  PixelChartShellComponent,
  type PixelChartLineMode,
  type PixelChartSeries,
} from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-line-basic-example',
  imports: [PixelChartShellComponent, PixelChartLineComponent],
  template: `
    <div class="toolbar">
      <label>
        Mode
        <select [value]="mode()" (change)="onMode($event)">
          <option value="straight">straight</option>
          <option value="smooth">smooth</option>
          <option value="step">step</option>
        </select>
      </label>
    </div>

    <pixel-chart-shell
      title="Line chart"
      description="Trends over months — switch straight / smooth / step."
      [series]="series()"
      [categories]="categories()"
      [(hiddenSeriesIds)]="hidden"
      [getChart]="chartGetter"
      exportFileName="line-sales"
    >
      <pixel-chart-line
        #line
        [series]="series()"
        [categories]="categories()"
        [hiddenSeriesIds]="hidden()"
        [mode]="mode()"
        ariaLabel="Monthly sales line chart"
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
export class ChartLineBasicExample {
  private readonly line = viewChild.required(PixelChartLineComponent);

  readonly categories = signal(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']);
  readonly series = signal<readonly PixelChartSeries[]>([
    { id: 'a', name: 'Product A', data: [45, 58, 52, 70, 65, 80, 72] },
    { id: 'b', name: 'Product B', data: [30, 40, 48, 42, 55, 60, 58] },
    { id: 'c', name: 'Product C', data: [20, 25, 22, 35, 40, 38, 45] },
  ]);
  readonly hidden = signal<readonly string[]>([]);
  readonly mode = signal<PixelChartLineMode>('straight');

  readonly chartGetter = () => this.line()?.getChart() ?? null;

  protected onMode(event: Event): void {
    this.mode.set((event.target as HTMLSelectElement).value as PixelChartLineMode);
  }
}
