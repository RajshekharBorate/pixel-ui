import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import {
  PixelChartLineComponent,
  PixelChartShellComponent,
  type PixelChartSeries,
} from 'pixel-ui/charts';
import { provideNativeDateAdapter } from 'pixel-ui';

function buildDays(count: number): Date[] {
  const start = new Date(2024, 0, 1);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function wave(n: number): number[] {
  return Array.from({ length: n }, (_, i) =>
    Math.round(50 + 12 * Math.sin(i / 5) + (i % 7)),
  );
}

@Component({
  selector: 'docs-chart-line-time-example',
  imports: [PixelChartShellComponent, PixelChartLineComponent],
  providers: [provideNativeDateAdapter()],
  template: `
    <pixel-chart-shell
      title="Daily active users"
      description="Time axis with Date categories; labels via PixelDateAdapter when provided."
      [series]="series()"
      [categories]="categoryLabels()"
      [(showValues)]="showValues"
      [getChart]="chartGetter"
      zoomSelection="auto"
      exportFileName="line-time"
    >
      <pixel-chart-line
        #line
        [series]="series()"
        [categories]="categories()"
        [showValues]="showValues()"
        xAxisType="time"
        dataZoom="auto"
        height="300px"
        ariaLabel="Daily active users over time"
      />
    </pixel-chart-shell>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartLineTimeExample {
  private readonly line = viewChild.required(PixelChartLineComponent);

  readonly categories = signal(buildDays(90));
  readonly series = signal<readonly PixelChartSeries[]>([
    { id: 'dau', name: 'DAU', data: wave(90) },
  ]);
  readonly showValues = signal(false);

  /** Shell CSV export expects string categories. */
  readonly categoryLabels = computed(() =>
    this.categories().map((d) => d.toISOString().slice(0, 10)),
  );

  readonly chartGetter = () => this.line().getChart();
}
