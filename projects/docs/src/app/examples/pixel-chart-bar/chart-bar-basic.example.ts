import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';
import {
  PixelChartBarComponent,
  PixelChartShellComponent,
  type PixelChartSeries,
} from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-bar-basic-example',
  imports: [PixelButtonComponent, PixelChartShellComponent, PixelChartBarComponent],
  template: `
    <div class="docs-chart-skeleton-demo">

    <pixel-button size="sm" appearance="outline" (click)="showSkeleton.update((v) => !v)">
        {{ showSkeleton() ? 'Hide skeleton' : 'Show skeleton' }}
      </pixel-button>

    <pixel-chart-shell
      title="1. Column chart"
      description="Use ⋯ to show or hide values. Compare categories with vertical columns."
      [series]="series()"
      [categories]="categories()"
      [(hiddenSeriesIds)]="hidden"
      [(showValues)]="showValues"
      [getChart]="chartGetter"
      exportFileName="column-sales"
     [showSkeleton]="showSkeleton()">
      <pixel-chart-bar
        #bar
        [series]="series()"
        [categories]="categories()"
        [hiddenSeriesIds]="hidden()"
        [showValues]="showValues()"
        mode="single"
        orientation="vertical"
        xAxisName="Quarter"
        yAxisName="Sales"
        valueSuffix="K"
        ariaLabel="Quarterly sales"
       [showSkeleton]="showSkeleton()" />
    </pixel-chart-shell>
    </div>
  `,
  styles: `
    .docs-chart-skeleton-demo {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartBarBasicExample {
  readonly showSkeleton = signal(false);

  private readonly bar = viewChild.required(PixelChartBarComponent);

  readonly categories = signal(['Q1', 'Q2', 'Q3', 'Q4']);
  readonly series = signal<readonly PixelChartSeries[]>([
    { id: 'sales', name: 'Sales', data: [45, 68, 52, 85] },
  ]);
  readonly hidden = signal<readonly string[]>([]);
  readonly showValues = signal(true);

  readonly chartGetter = () => this.bar()?.getChart() ?? null;
}
