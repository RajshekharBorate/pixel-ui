import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import {
  PixelChartLineComponent,
  PixelChartShellComponent,
  type PixelChartSeries,
} from 'pixel-ui/charts';
import { PixelButtonComponent, provideNativeDateAdapter  } from 'pixel-ui';

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
  imports: [PixelButtonComponent, PixelChartShellComponent, PixelChartLineComponent],
  providers: [provideNativeDateAdapter()],
  template: `
    <div class="docs-chart-skeleton-demo">
      <pixel-button
        class="docs-chart-skeleton-toggle"
        size="sm"
        appearance="outline"
        (click)="showSkeleton.update((v) => !v)"
      >
        {{ showSkeleton() ? 'Hide skeleton' : 'Show skeleton' }}
      </pixel-button>

    <pixel-chart-shell
      title="Daily active users"
      description="Time axis with Date categories; labels via PixelDateAdapter when provided."
      [series]="series()"
      [categories]="categoryLabels()"
      [(showValues)]="showValues"
      [getChart]="chartGetter"
      zoomSelection="auto"
      exportFileName="line-time"
     [showSkeleton]="showSkeleton()">
      <pixel-chart-line
        #line
        [series]="series()"
        [categories]="categories()"
        [showValues]="showValues()"
        xAxisType="time"
        dataZoom="auto"
        height="300px"
        ariaLabel="Daily active users over time"
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

    .docs-chart-skeleton-demo > pixel-button {
      flex: 0 0 auto;
    }

  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartLineTimeExample {
  readonly showSkeleton = signal(false);

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
