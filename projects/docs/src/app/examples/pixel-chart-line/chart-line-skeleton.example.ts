import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';
import {
  PixelChartLineComponent,
  PixelChartShellComponent,
  type PixelChartSeries,
} from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-line-skeleton-example',
  imports: [PixelChartShellComponent, PixelChartLineComponent, PixelButtonComponent],
  template: `
    <div class="docs-chart-skeleton-demo">
      <pixel-button size="sm" appearance="outline" (click)="showSkeleton.update((v) => !v)">
        {{ showSkeleton() ? 'Hide skeleton' : 'Show skeleton' }}
      </pixel-button>

      <pixel-chart-shell
        title="Skeleton states"
        description="Bind showSkeleton on shell (legend stubs) and the chart (plot). Both flip together when data is ready."
        [series]="series()"
        [categories]="categories()"
        [(hiddenSeriesIds)]="hidden"
        [showSkeleton]="showSkeleton()"
        [getChart]="chartGetter"
        exportFileName="line-skeleton-demo"
      >
        <pixel-chart-line
          #line
          [series]="series()"
          [categories]="categories()"
          [hiddenSeriesIds]="hidden()"
          [showSkeleton]="showSkeleton()"
          ariaLabel="Skeleton demo line chart"
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
export class ChartLineSkeletonExample {
  private readonly line = viewChild.required(PixelChartLineComponent);

  readonly categories = signal(['Jan', 'Feb', 'Mar', 'Apr']);
  readonly series = signal<readonly PixelChartSeries[]>([
    { id: 'sales', name: 'Sales', data: [40, 52, 48, 61] },
  ]);
  readonly hidden = signal<readonly string[]>([]);
  readonly showSkeleton = signal(true);

  readonly chartGetter = () => this.line()?.getChart() ?? null;
}
