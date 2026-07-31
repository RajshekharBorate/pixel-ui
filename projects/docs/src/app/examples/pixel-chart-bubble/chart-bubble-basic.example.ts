import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import { PixelButtonComponent, PixelSelectComponent, type PixelSelectOption  } from 'pixel-ui';
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
  imports: [PixelButtonComponent, PixelChartShellComponent, PixelChartBubbleComponent, PixelSelectComponent],
  template: `
    <div class="toolbar">
      <pixel-select
        label="Layout"
        size="sm"
        [options]="layoutOptions"
        [value]="layout()"
        (valueChange)="onLayout($event)"
      />
    
      <pixel-button
        class="docs-chart-skeleton-toggle"
        size="sm"
        appearance="outline"
        (click)="showSkeleton.update((v) => !v)"
      >
        {{ showSkeleton() ? 'Hide skeleton' : 'Show skeleton' }}
      </pixel-button>
    </div>

    <pixel-chart-shell
      title="Bubble"
      description="Use ⋯ to show or hide values. Cartesian x/y/size or hierarchical pack layout."
      [series]="legendSeries()"
      [(hiddenSeriesIds)]="hidden"
      [(showValues)]="showValues"
      [getChart]="chartGetter"
      exportFileName="bubble-market"
     [showSkeleton]="showSkeleton()">
      <pixel-chart-bubble
        #bubble
        [series]="series()"
        [hierarchy]="hierarchy"
        [layout]="layout()"
        [hiddenSeriesIds]="hidden()"
        [showValues]="showValues()"
        xAxisName="Reach"
        yAxisName="Engagement"
        ariaLabel="Market bubbles"
       [showSkeleton]="showSkeleton()" />
    </pixel-chart-shell>
  `,
  styles: `
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: var(--pixel-sys-space-md, 1rem);
      margin-block-end: var(--pixel-sys-space-md, 1rem);
    }

    .toolbar > pixel-button {
      flex: 0 0 auto;
    }

    .toolbar > pixel-select {
      flex: 1 1 10rem;
      max-inline-size: 14rem;
      min-inline-size: 9rem;
    }

  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartBubbleBasicExample {
  readonly showSkeleton = signal(false);

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
  readonly showValues = signal(true);
  readonly legendSeries = computed(() => bubbleSeriesToLegendSeries(this.series()));

  readonly chartGetter = () => this.bubble()?.getChart() ?? null;

  protected onLayout(value: unknown): void {
    if (typeof value === 'string') {
      this.layout.set(value as PixelChartBubbleLayout);
    }
  }
}
