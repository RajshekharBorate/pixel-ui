import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';
import { PixelChartGaugeComponent, PixelChartShellComponent } from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-gauge-skeleton-example',
  imports: [PixelChartShellComponent, PixelChartGaugeComponent, PixelButtonComponent],
  template: `
    <div class="docs-chart-skeleton-demo">
      <pixel-button size="sm" appearance="outline" (click)="showSkeleton.update((v) => !v)">
        {{ showSkeleton() ? 'Hide skeleton' : 'Show skeleton' }}
      </pixel-button>

      <pixel-chart-shell
        title="Skeleton states"
        description="Bind showSkeleton on the chart (plot). Gauge shells usually hide the legend; set showLegend when needed."
        [empty]="false"
        [showLegend]="false"
        [showValueToggle]="false"
        [showSkeleton]="showSkeleton()"
        [getChart]="chartGetter"
        exportFileName="gauge-skeleton-demo"
      >
        <pixel-chart-gauge
          #gauge
          [value]="72"
          [min]="0"
          [max]="100"
          variant="radial"
          label="Performance"
          [showSkeleton]="showSkeleton()"
          ariaLabel="Skeleton demo gauge"
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
export class ChartGaugeSkeletonExample {
  private readonly gauge = viewChild.required(PixelChartGaugeComponent);

  readonly showSkeleton = signal(true);

  readonly chartGetter = () => this.gauge()?.getChart() ?? null;
}
