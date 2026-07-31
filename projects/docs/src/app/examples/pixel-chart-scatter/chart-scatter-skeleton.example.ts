import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';
import {
  PixelChartScatterComponent,
  PixelChartShellComponent,
  type PixelChartSeries,
} from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-scatter-skeleton-example',
  imports: [PixelChartShellComponent, PixelChartScatterComponent, PixelButtonComponent],
  template: `
    <div class="docs-chart-skeleton-demo">
      <pixel-button size="sm" appearance="outline" (click)="showSkeleton.update((v) => !v)">
        {{ showSkeleton() ? 'Hide skeleton' : 'Show skeleton' }}
      </pixel-button>

      <pixel-chart-shell
        title="Skeleton states"
        description="Bind showSkeleton on the chart facade (like pixel-select). Shell chrome stays; the plot is replaced."
        [series]="series()"
        [(hiddenSeriesIds)]="hidden"
        [getChart]="chartGetter"
        exportFileName="scatter-skeleton-demo"
      >
        <pixel-chart-scatter
          #scatter
          [series]="series()"
          [hiddenSeriesIds]="hidden()"
          [showSkeleton]="showSkeleton()"
          ariaLabel="Skeleton demo scatter chart"
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
export class ChartScatterSkeletonExample {
  private readonly scatter = viewChild.required(PixelChartScatterComponent);

  readonly series = signal<readonly PixelChartSeries[]>([
    {
      id: 'north',
      name: 'North',
      data: [
        { x: 12, y: 22 },
        { x: 18, y: 30 },
        { x: 25, y: 38 },
        { x: 32, y: 41 },
      ],
    },
  ]);
  readonly hidden = signal<readonly string[]>([]);
  readonly showSkeleton = signal(true);

  readonly chartGetter = () => this.scatter()?.getChart() ?? null;
}
