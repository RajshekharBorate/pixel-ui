import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';
import {
  PixelChartRadarComponent,
  PixelChartShellComponent,
  type PixelChartRadarIndicator,
  type PixelChartSeries,
} from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-radar-skeleton-example',
  imports: [PixelChartShellComponent, PixelChartRadarComponent, PixelButtonComponent],
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
        exportFileName="radar-skeleton-demo"
      >
        <pixel-chart-radar
          #radar
          [indicators]="indicators"
          [series]="series()"
          [hiddenSeriesIds]="hidden()"
          [showSkeleton]="showSkeleton()"
          ariaLabel="Skeleton demo radar chart"
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
export class ChartRadarSkeletonExample {
  private readonly radar = viewChild.required(PixelChartRadarComponent);

  readonly indicators: readonly PixelChartRadarIndicator[] = [
    { name: 'Speed', max: 100 },
    { name: 'Quality', max: 100 },
    { name: 'Support', max: 100 },
    { name: 'Features', max: 100 },
    { name: 'Value', max: 100 },
  ];

  readonly series = signal<readonly PixelChartSeries[]>([
    { id: 'a', name: 'Team A', data: [80, 72, 68, 75, 70] },
  ]);
  readonly hidden = signal<readonly string[]>([]);
  readonly showSkeleton = signal(true);

  readonly chartGetter = () => this.radar()?.getChart() ?? null;
}
