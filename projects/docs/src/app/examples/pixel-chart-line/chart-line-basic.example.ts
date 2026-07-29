import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { PixelSelectComponent, type PixelSelectOption } from 'pixel-ui';
import {
  PixelChartLineComponent,
  PixelChartShellComponent,
  type PixelChartLineMode,
  type PixelChartSeries,
} from 'pixel-ui/charts';


@Component({
  selector: 'docs-chart-line-basic-example',
  imports: [PixelChartShellComponent, PixelChartLineComponent, PixelSelectComponent],
  template: `
    <div class="toolbar">
      <pixel-select
        label="Mode"
        size="sm"
        [options]="modeOptions"
        [value]="mode()"
        (valueChange)="onMode($event)"
      />
    </div>

    <pixel-chart-shell
      title="Line chart"
      description="Trends over months — straight, smooth, or step."
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
      margin-block-end: var(--pixel-sys-space-md, 1rem);
      max-inline-size: 14rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartLineBasicExample {
  private readonly line = viewChild.required(PixelChartLineComponent);

  readonly modeOptions: readonly PixelSelectOption[] = [
    { value: 'straight', label: 'straight' },
    { value: 'smooth', label: 'smooth' },
    { value: 'step', label: 'step' },
  ];

  readonly categories = signal(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']);
  readonly series = signal<readonly PixelChartSeries[]>([
    { id: 'a', name: 'Product A', data: [45, 58, 52, 70, 65, 80, 72] },
    { id: 'b', name: 'Product B', data: [30, 40, 48, 42, 55, 60, 58] },
    { id: 'c', name: 'Product C', data: [20, 25, 22, 35, 40, 38, 45] },
  ]);
  readonly hidden = signal<readonly string[]>([]);
  readonly mode = signal<PixelChartLineMode>('straight');

  readonly chartGetter = () => this.line()?.getChart() ?? null;

  protected onMode(value: unknown): void {
    if (typeof value === 'string') {
      this.mode.set(value as PixelChartLineMode);
    }
  }
}
