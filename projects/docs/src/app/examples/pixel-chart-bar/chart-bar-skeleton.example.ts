import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';
import {
  PixelChartBarComponent,
  PixelChartShellComponent,
  type PixelChartSeries,
} from 'pixel-ui/charts';

/**
 * Facade-first skeleton (same pattern as pixel-select): bind showSkeleton on the chart.
 * Shell keeps title/legend/actions; the plot region swaps to a bar-shaped placeholder.
 */
@Component({
  selector: 'docs-chart-bar-skeleton-example',
  imports: [PixelChartShellComponent, PixelChartBarComponent, PixelButtonComponent],
  template: `
    <div class="docs-chart-skeleton-demo">
      <pixel-button size="sm" appearance="outline" (click)="showSkeleton.update((v) => !v)">
        {{ showSkeleton() ? 'Hide skeleton' : 'Show skeleton' }}
      </pixel-button>

      <pixel-chart-shell
        title="Skeleton states"
        description="Bind showSkeleton on the chart facade (like pixel-select). Shell chrome stays; the plot is replaced."
        [series]="series()"
        [categories]="categories()"
        [(hiddenSeriesIds)]="hidden"
        [getChart]="chartGetter"
        exportFileName="skeleton-demo"
      >
        <pixel-chart-bar
          #bar
          [series]="series()"
          [categories]="categories()"
          [hiddenSeriesIds]="hidden()"
          [showSkeleton]="showSkeleton()"
          mode="single"
          orientation="vertical"
          ariaLabel="Skeleton demo sales"
        />
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
export class ChartBarSkeletonExample {
  private readonly bar = viewChild.required(PixelChartBarComponent);

  readonly categories = signal(['Q1', 'Q2', 'Q3', 'Q4']);
  readonly series = signal<readonly PixelChartSeries[]>([
    { id: 'sales', name: 'Sales', data: [45, 68, 52, 85] },
  ]);
  readonly hidden = signal<readonly string[]>([]);
  readonly showSkeleton = signal(true);

  readonly chartGetter = () => this.bar()?.getChart() ?? null;
}
