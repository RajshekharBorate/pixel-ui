import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { PixelSelectComponent, type PixelSelectOption } from 'pixel-ui';
import {
  PixelChartLineComponent,
  PixelChartShellComponent,
  type PixelChartLineMode,
  type PixelChartSeries,
} from 'pixel-ui/charts';

/** 36 monthly points — large enough for zoomSelection="auto". */
function buildMonths(count: number): string[] {
  const start = new Date(2023, 0, 1);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    d.setMonth(start.getMonth() + i);
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  });
}

function wave(seed: number, n: number): number[] {
  return Array.from({ length: n }, (_, i) =>
    Math.round(40 + seed * 8 + 18 * Math.sin(i / 3 + seed) + (i % 5) * 2),
  );
}

@Component({
  selector: 'docs-chart-line-basic-example',
  imports: [PixelChartShellComponent, PixelChartLineComponent, PixelSelectComponent],
  template: `
    <div class="toolbar">
      <pixel-select
        label="Mode"
        size="sm"
        [options]="modeOptions"
        [value]="mode()"
        (valueChange)="onMode($event)"
      />
    </div>

    <pixel-chart-shell
      title="Sales Trend"
      description="Use ⋯ to show or hide values. Zoom mode → drag a range → reset."
      [series]="series()"
      [categories]="categories()"
      [(hiddenSeriesIds)]="hidden"
      [(showValues)]="showValues"
      [getChart]="chartGetter"
      zoomSelection="auto"
      showZoomPreview
      exportFileName="line-sales"
    >
      <pixel-chart-line
        #line
        [series]="series()"
        [categories]="categories()"
        [hiddenSeriesIds]="hidden()"
        [mode]="mode()"
        [showValues]="showValues()"
        xAxisName="Month"
        yAxisName="Sales"
        valueSuffix="K"
        dataZoom="auto"
        height="320px"
        ariaLabel="Monthly sales line chart with zoom selection"
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
export class ChartLineBasicExample {
  private readonly line = viewChild.required(PixelChartLineComponent);

  readonly modeOptions: readonly PixelSelectOption[] = [
    { value: 'straight', label: 'straight' },
    { value: 'smooth', label: 'smooth' },
    { value: 'step', label: 'step' },
  ];

  readonly categories = signal(buildMonths(36));
  readonly series = signal<readonly PixelChartSeries[]>([
    { id: 'a', name: 'Product A', data: wave(1, 36) },
    { id: 'b', name: 'Product B', data: wave(2, 36) },
    { id: 'c', name: 'Product C', data: wave(3, 36) },
  ]);
  readonly hidden = signal<readonly string[]>([]);
  readonly mode = signal<PixelChartLineMode>('straight');
  readonly showValues = signal(false);

  readonly chartGetter = () => this.line()?.getChart() ?? null;

  protected onMode(value: unknown): void {
    if (typeof value === 'string') {
      this.mode.set(value as PixelChartLineMode);
    }
  }
}
