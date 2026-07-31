import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';
import {
  PixelChartLineComponent,
  PixelChartShellComponent,
  type PixelChartReferenceBand,
  type PixelChartReferenceLine,
  type PixelChartSeries,
} from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-line-enterprise-example',
  imports: [PixelButtonComponent, PixelChartShellComponent, PixelChartLineComponent],
  template: `
    <div class="docs-chart-skeleton-demo">

    <pixel-button size="sm" appearance="outline" (click)="showSkeleton.update((v) => !v)">
        {{ showSkeleton() ? 'Hide skeleton' : 'Show skeleton' }}
      </pixel-button>

    <pixel-chart-shell
      title="Revenue against plan"
      description="Currency formatting, target and warning-zone annotations, and a crosshair pointer. Set the same syncGroup on chart hosts to link dashboard interactions."
      [series]="series"
      [categories]="categories"
      [(showValues)]="showValues"
      [getChart]="chartGetter"
      exportFileName="revenue-against-plan"
     [showSkeleton]="showSkeleton()">
      <pixel-chart-line
        #line
        [series]="series"
        [categories]="categories"
        [showValues]="showValues()"
        [valueFormat]="currencyFormat"
        [axisValueFormat]="currencyFormat"
        [referenceLines]="referenceLines"
        [referenceBands]="referenceBands"
        axisPointer="cross"
        syncGroup="docs-line-sync"
        ariaLabel="Monthly revenue against plan"
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
export class ChartLineEnterpriseExample {
  readonly showSkeleton = signal(false);

  private readonly line = viewChild.required(PixelChartLineComponent);

  readonly categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  readonly series: readonly PixelChartSeries[] = [
    { id: 'revenue', name: 'Revenue', data: [92000, 101000, 97000, 112000, 108000, 124000] },
  ];
  readonly showValues = signal(false);
  readonly currencyFormat = { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } as const;
  readonly referenceLines: readonly PixelChartReferenceLine[] = [
    { id: 'target', value: 110000, label: 'Monthly target' },
  ];
  readonly referenceBands: readonly PixelChartReferenceBand[] = [
    { id: 'warning', from: 0, to: 95000, label: 'Watch zone' },
  ];
  readonly chartGetter = () => this.line().getChart();
}
