import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import {
  PixelChartBubbleComponent,
  PixelChartShellComponent,
  bubbleSeriesToLegendSeries,
  type PixelChartBubbleSeries,
} from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-bubble-basic-example',
  imports: [PixelChartShellComponent, PixelChartBubbleComponent],
  template: `
    <pixel-chart-shell
      title="Bubble"
      description="Cartesian x / y / size with paginated table (View all)."
      [series]="legendSeries()"
      [showTable]="false"
      [(hiddenSeriesIds)]="hidden"
      [getChart]="chartGetter"
      exportFileName="bubble-market"
    >
      <pixel-chart-bubble
        #bubble
        [series]="series()"
        [hiddenSeriesIds]="hidden()"
        [pageSize]="4"
        xAxisName="Reach"
        yAxisName="Engagement"
        ariaLabel="Market bubbles"
      />
    </pixel-chart-shell>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartBubbleBasicExample {
  private readonly bubble = viewChild.required(PixelChartBubbleComponent);

  readonly series = signal<readonly PixelChartBubbleSeries[]>([
    {
      id: 'products',
      name: 'Products',
      data: [
        { x: 20, y: 30, size: 40, label: 'Alpha' },
        { x: 35, y: 45, size: 70, label: 'Beta' },
        { x: 50, y: 25, size: 55, label: 'Gamma' },
        { x: 60, y: 60, size: 90, label: 'Delta' },
        { x: 28, y: 55, size: 35, label: 'Epsilon' },
        { x: 72, y: 40, size: 48, label: 'Zeta' },
      ],
    },
  ]);
  readonly hidden = signal<readonly string[]>([]);
  readonly legendSeries = computed(() => bubbleSeriesToLegendSeries(this.series()));

  readonly chartGetter = () => this.bubble()?.getChart() ?? null;
}
