import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';
import {
  PixelChartBubbleComponent,
  PixelChartShellComponent,
  bubbleSeriesToLegendSeries,
  type PixelChartBubbleSeries,
} from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-bubble-skeleton-example',
  imports: [PixelChartShellComponent, PixelChartBubbleComponent, PixelButtonComponent],
  template: `
    <div class="docs-chart-skeleton-demo">
      <pixel-button size="sm" appearance="outline" (click)="showSkeleton.update((v) => !v)">
        {{ showSkeleton() ? 'Hide skeleton' : 'Show skeleton' }}
      </pixel-button>

      <pixel-chart-shell
        title="Skeleton states"
        description="Bind showSkeleton on shell (legend stubs) and the chart (plot). Both flip together when data is ready."
        [series]="legendSeries()"
        [(hiddenSeriesIds)]="hidden"
        [showSkeleton]="showSkeleton()"
        [getChart]="chartGetter"
        exportFileName="bubble-skeleton-demo"
      >
        <pixel-chart-bubble
          #bubble
          [series]="series()"
          [hiddenSeriesIds]="hidden()"
          [showSkeleton]="showSkeleton()"
          ariaLabel="Skeleton demo bubble chart"
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
export class ChartBubbleSkeletonExample {
  private readonly bubble = viewChild.required(PixelChartBubbleComponent);

  readonly series = signal<readonly PixelChartBubbleSeries[]>([
    {
      id: 'products',
      name: 'Products',
      data: [
        { x: 20, y: 30, size: 40, label: 'Alpha' },
        { x: 35, y: 45, size: 70, label: 'Beta' },
        { x: 50, y: 25, size: 55, label: 'Gamma' },
      ],
    },
  ]);
  readonly hidden = signal<readonly string[]>([]);
  readonly showSkeleton = signal(true);

  readonly legendSeries = computed(() => bubbleSeriesToLegendSeries(this.series()));
  readonly chartGetter = () => this.bubble()?.getChart() ?? null;
}
