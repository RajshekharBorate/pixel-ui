import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelChartSparklineComponent } from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-sparkline-basic-example',
  imports: [PixelChartSparklineComponent],
  template: `
    <div class="grid">
      <div class="row">
        <span>Revenue</span>
        <pixel-chart-sparkline
          [values]="up"
          variant="area"
          tone="success"
          ariaLabel="Revenue up over 12 weeks"
        />
      </div>
      <div class="row">
        <span>Churn</span>
        <pixel-chart-sparkline
          [values]="down"
          tone="error"
          ariaLabel="Churn trending down"
        />
      </div>
      <div class="row">
        <span>Latency</span>
        <pixel-chart-sparkline [values]="flat" ariaLabel="Latency mostly flat" />
      </div>
    </div>
  `,
  styles: `
    .grid {
      display: grid;
      gap: var(--pixel-sys-space-md, 1rem);
      max-inline-size: 20rem;
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
export class ChartSparklineBasicExample {
  readonly up = [12, 14, 13, 16, 18, 17, 19, 22, 21, 24, 26, 28];
  readonly down = [40, 38, 36, 35, 33, 30, 28, 27, 25, 22, 20, 18];
  readonly flat = [10, 11, 10, 12, 11, 10, 11, 12, 11, 10, 11, 10];
}
