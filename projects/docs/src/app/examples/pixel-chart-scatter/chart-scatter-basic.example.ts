import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';
import {
  PixelChartScatterComponent,
  PixelChartShellComponent,
  buildScatterTable,
  type PixelChartSeries,
} from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-scatter-basic-example',
  imports: [PixelButtonComponent, PixelChartShellComponent, PixelChartScatterComponent],
  template: `
    <div class="docs-chart-skeleton-demo">

    <pixel-button size="sm" appearance="outline" (click)="showSkeleton.update((v) => !v)">
        {{ showSkeleton() ? 'Hide skeleton' : 'Show skeleton' }}
      </pixel-button>

    <pixel-chart-shell
      title="Scatter"
      description="Use ⋯ to show or hide values. Correlation with an optional trendline."
      [series]="series()"
      [tableColumns]="table().columns"
      [tableRows]="table().rows"
      [(hiddenSeriesIds)]="hidden"
      [(showValues)]="showValues"
      [getChart]="chartGetter"
      exportFileName="scatter-correlation"
     [showSkeleton]="showSkeleton()">
      <pixel-chart-scatter
        #scatter
        [series]="series()"
        [hiddenSeriesIds]="hidden()"
        [showValues]="showValues()"
        showTrendline
        xAxisName="Spend"
        yAxisName="Revenue"
        ariaLabel="Spend vs revenue"
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
export class ChartScatterBasicExample {
  readonly showSkeleton = signal(false);

  private readonly scatter = viewChild.required(PixelChartScatterComponent);

  readonly series = signal<readonly PixelChartSeries[]>([
    {
      id: 'north',
      name: 'North',
      data: [
        { x: 12, y: 22 },
        { x: 18, y: 30 },
        { x: 25, y: 38 },
        { x: 32, y: 41 },
        { x: 40, y: 55 },
        { x: 48, y: 58 },
      ],
    },
    {
      id: 'south',
      name: 'South',
      data: [
        { x: 10, y: 18 },
        { x: 16, y: 24 },
        { x: 22, y: 28 },
        { x: 30, y: 36 },
        { x: 38, y: 44 },
        { x: 45, y: 50 },
      ],
    },
  ]);
  readonly hidden = signal<readonly string[]>([]);
  readonly showValues = signal(false);
  readonly table = computed(() => buildScatterTable(this.series()));

  readonly chartGetter = () => this.scatter()?.getChart() ?? null;
}
