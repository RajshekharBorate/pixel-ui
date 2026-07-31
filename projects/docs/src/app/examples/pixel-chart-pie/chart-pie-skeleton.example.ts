import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';
import {
  PixelChartPieComponent,
  PixelChartShellComponent,
  pieSlicesToLegendSeries,
  type PixelChartPieSlice,
} from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-pie-skeleton-example',
  imports: [PixelChartShellComponent, PixelChartPieComponent, PixelButtonComponent],
  template: `
    <div class="docs-chart-skeleton-demo">
      <pixel-button size="sm" appearance="outline" (click)="showSkeleton.update((v) => !v)">
        {{ showSkeleton() ? 'Hide skeleton' : 'Show skeleton' }}
      </pixel-button>

      <pixel-chart-shell
        title="Skeleton states"
        description="Bind showSkeleton on the chart facade (like pixel-select). Shell chrome stays; the plot is replaced."
        [series]="legendSeries()"
        [(hiddenSeriesIds)]="hidden"
        [getChart]="chartGetter"
        exportFileName="pie-skeleton-demo"
      >
        <pixel-chart-pie
          #pie
          [slices]="slices()"
          [hiddenSliceIds]="hidden()"
          [showSkeleton]="showSkeleton()"
          mode="donut"
          ariaLabel="Skeleton demo pie chart"
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
export class ChartPieSkeletonExample {
  private readonly pie = viewChild.required(PixelChartPieComponent);

  readonly slices = signal<readonly PixelChartPieSlice[]>([
    { id: 'a', name: 'Cloud', value: 38 },
    { id: 'b', name: 'On-prem', value: 27 },
    { id: 'c', name: 'SaaS', value: 22 },
    { id: 'd', name: 'Other', value: 13 },
  ]);
  readonly hidden = signal<readonly string[]>([]);
  readonly showSkeleton = signal(true);

  readonly legendSeries = computed(() => pieSlicesToLegendSeries(this.slices()));
  readonly chartGetter = () => this.pie()?.getChart() ?? null;
}
