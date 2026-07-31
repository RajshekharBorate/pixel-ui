import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';
import { PixelChartSparklineComponent } from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-sparkline-skeleton-example',
  imports: [PixelChartSparklineComponent, PixelButtonComponent],
  template: `
    <div class="docs-chart-skeleton-demo">
      <pixel-button size="sm" appearance="outline" (click)="showSkeleton.update((v) => !v)">
        {{ showSkeleton() ? 'Hide skeleton' : 'Show skeleton' }}
      </pixel-button>

      <div class="grid">
        <div class="row">
          <span>Revenue</span>
          <pixel-chart-sparkline
            [values]="up"
            variant="area"
            tone="success"
            [showSkeleton]="showSkeleton()"
            ariaLabel="Revenue sparkline"
          />
        </div>
        <div class="row">
          <span>Churn</span>
          <pixel-chart-sparkline
            [values]="down"
            tone="error"
            [showSkeleton]="showSkeleton()"
            ariaLabel="Churn sparkline"
          />
        </div>
        <div class="row">
          <span>Latency</span>
          <pixel-chart-sparkline
            [values]="flat"
            [showSkeleton]="showSkeleton()"
            ariaLabel="Latency sparkline"
          />
        </div>
      </div>
    </div>
  `,
  styles: `
    .docs-chart-skeleton-demo {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }
    .grid {
      display: grid;
      gap: var(--pixel-sys-space-md, 1rem);
      max-inline-size: 20rem;
      inline-size: 100%;
    }
    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--pixel-sys-space-md, 1rem);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartSparklineSkeletonExample {
  readonly showSkeleton = signal(true);
  readonly up = [12, 14, 13, 16, 18, 17, 19, 22, 21, 24, 26, 28];
  readonly down = [40, 38, 36, 35, 33, 30, 28, 27, 25, 22, 20, 18];
  readonly flat = [10, 11, 10, 12, 11, 10, 11, 12, 11, 10, 11, 10];
}
