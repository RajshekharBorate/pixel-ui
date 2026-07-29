import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import { PixelSelectComponent, type PixelSelectOption } from 'pixel-ui';
import {
  PixelChartBubbleComponent,
  PixelChartShellComponent,
  bubbleSeriesToLegendSeries,
  type PixelChartBubbleHierarchyNode,
  type PixelChartBubbleLayout,
  type PixelChartBubbleSeries,
} from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-bubble-basic-example',
  imports: [PixelChartShellComponent, PixelChartBubbleComponent, PixelSelectComponent],
  template: `
    <div class="toolbar">
      <pixel-select
        label="Layout"
        size="sm"
        [options]="layoutOptions"
        [value]="layout()"
        (valueChange)="onLayout($event)"
      />
    </div>

    <pixel-chart-shell
      title="Bubble"
      description="Cartesian x/y/size or hierarchical pack layout."
      [series]="legendSeries()"
      [(hiddenSeriesIds)]="hidden"
      [getChart]="chartGetter"
      exportFileName="bubble-market"
    >
      <pixel-chart-bubble
        #bubble
        [series]="series()"
        [hierarchy]="hierarchy"
        [layout]="layout()"
        [hiddenSeriesIds]="hidden()"
        xAxisName="Reach"
        yAxisName="Engagement"
        ariaLabel="Market bubbles"
      />
    </pixel-chart-shell>
  `,
  styles: `
    .toolbar {
      margin-block-end: var(--pixel-sys-space-md, 1rem);
      max-inline-size: 14rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartBubbleBasicExample {
  private readonly bubble = viewChild.required(PixelChartBubbleComponent);

  readonly layoutOptions: readonly PixelSelectOption[] = [
    { value: 'cartesian', label: 'cartesian' },
    { value: 'pack', label: 'pack' },
  ];

  readonly layout = signal<PixelChartBubbleLayout>('cartesian');

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

  readonly hierarchy: readonly PixelChartBubbleHierarchyNode[] = [
    {
      name: 'Portfolio',
      children: [
        {
          name: 'Growth',
          children: [
            { name: 'Alpha', value: 40 },
            { name: 'Beta', value: 70 },
            { name: 'Gamma', value: 55 },
          ],
        },
        {
          name: 'Core',
          children: [
            { name: 'Delta', value: 90 },
            { name: 'Epsilon', value: 35 },
            { name: 'Zeta', value: 48 },
          ],
        },
      ],
    },
  ];

  readonly hidden = signal<readonly string[]>([]);
  readonly legendSeries = computed(() => bubbleSeriesToLegendSeries(this.series()));

  readonly chartGetter = () => this.bubble()?.getChart() ?? null;

  protected onLayout(value: unknown): void {
    if (typeof value === 'string') {
      this.layout.set(value as PixelChartBubbleLayout);
    }
  }
}
