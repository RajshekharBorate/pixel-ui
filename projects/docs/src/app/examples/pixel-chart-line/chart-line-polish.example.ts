import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { PixelButtonComponent, PixelSelectComponent, type PixelSelectOption  } from 'pixel-ui';
import {
  PixelChartLineComponent,
  PixelChartShellComponent,
  type PixelChartGridLines,
  type PixelChartSeries,
} from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-line-polish-example',
  imports: [PixelButtonComponent, PixelChartShellComponent, PixelChartLineComponent, PixelSelectComponent],
  template: `
    <div class="toolbar">
      
      <pixel-button size="sm" appearance="outline" (click)="showSkeleton.update((v) => !v)">
        {{ showSkeleton() ? 'Hide skeleton' : 'Show skeleton' }}
      </pixel-button>
<pixel-select
        label="Grid lines"
        size="sm"
        [options]="gridOptions"
        [value]="gridLines()"
        (valueChange)="onGrid($event)"
      />
      <pixel-select
        label="Line width"
        size="sm"
        [options]="widthOptions"
        [value]="lineWidthValue()"
        (valueChange)="onWidth($event)"
      />
    </div>

    <pixel-chart-shell
      title="Visual polish"
      description="Phase 1 knobs: gridLines, lineWidth, markerSize, boundaryGap, axisLines."
      [series]="series"
      [categories]="categories"
      [(hiddenSeriesIds)]="hidden"
      [(showValues)]="showValues"
      [getChart]="chartGetter"
      exportFileName="line-polish"
     [showSkeleton]="showSkeleton()">
      <pixel-chart-line
        #line
        [series]="series"
        [categories]="categories"
        [hiddenSeriesIds]="hidden()"
        [showValues]="showValues()"
        [gridLines]="gridLines()"
        [lineWidth]="lineWidth()"
        [markerSize]="10"
        boundaryGap
        axisLines="on"
        xAxisName="Month"
        yAxisName="Sales"
        valueSuffix="K"
        height="300px"
        ariaLabel="Line chart polish demo"
       [showSkeleton]="showSkeleton()" />
    </pixel-chart-shell>
  `,
  styles: `
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: var(--pixel-sys-space-md, 1rem);
      margin-block-end: var(--pixel-sys-space-md, 1rem);
      max-inline-size: 28rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartLinePolishExample {
  readonly showSkeleton = signal(false);

  private readonly line = viewChild.required(PixelChartLineComponent);

  readonly gridOptions: readonly PixelSelectOption[] = [
    { value: 'on', label: 'on' },
    { value: 'off', label: 'off' },
    { value: 'x', label: 'x' },
    { value: 'y', label: 'y' },
  ];

  readonly widthOptions: readonly PixelSelectOption[] = [
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
  ];

  readonly categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  readonly series: readonly PixelChartSeries[] = [
    { id: 'a', name: 'Product A', data: [30, 40, 35, 50, 48, 55] },
    { id: 'b', name: 'Product B', data: [20, 28, 32, 30, 36, 40] },
  ];

  readonly hidden = signal<readonly string[]>([]);
  readonly showValues = signal(false);
  readonly gridLines = signal<PixelChartGridLines>('on');
  readonly lineWidth = signal(2);
  readonly lineWidthValue = signal('2');

  readonly chartGetter = () => this.line().getChart();

  protected onGrid(value: unknown): void {
    if (value === 'on' || value === 'off' || value === 'x' || value === 'y') {
      this.gridLines.set(value);
    }
  }

  protected onWidth(value: unknown): void {
    const n = Number(value);
    if (n >= 1 && n <= 4) {
      this.lineWidth.set(n);
      this.lineWidthValue.set(String(n));
    }
  }
}
