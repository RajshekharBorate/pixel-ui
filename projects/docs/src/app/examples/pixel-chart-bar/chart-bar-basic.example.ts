import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import {
  PixelChartBarComponent,
  PixelChartShellComponent,
  type PixelChartSeries,
} from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-bar-basic-example',
  imports: [PixelChartShellComponent, PixelChartBarComponent],
  template: `
    <pixel-chart-shell
      title="1. Column chart"
      description="Compare values across categories using vertical columns."
      [series]="series()"
      [categories]="categories()"
      [(hiddenSeriesIds)]="hidden"
      [getChart]="chartGetter"
      exportFileName="column-sales"
    >
      <pixel-chart-bar
        #bar
        [series]="series()"
        [categories]="categories()"
        [hiddenSeriesIds]="hidden()"
        mode="single"
        orientation="vertical"
        ariaLabel="Quarterly sales"
      />
    </pixel-chart-shell>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartBarBasicExample {
  private readonly bar = viewChild.required(PixelChartBarComponent);

  readonly categories = signal(['Q1', 'Q2', 'Q3', 'Q4']);
  readonly series = signal<readonly PixelChartSeries[]>([
    { id: 'sales', name: 'Sales', data: [45, 68, 52, 85] },
  ]);
  readonly hidden = signal<readonly string[]>([]);

  readonly chartGetter = () => this.bar()?.getChart() ?? null;
}
