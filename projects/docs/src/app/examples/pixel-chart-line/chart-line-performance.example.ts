import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import { PixelSelectComponent, type PixelSelectOption } from 'pixel-ui';
import {
  PixelChartLineComponent,
  PixelChartShellComponent,
  PIXEL_CHART_MAX_POINTS,
  type PixelChartPerformanceMode,
  type PixelChartSeries,
} from 'pixel-ui/charts';

function wave(seed: number, n: number): number[] {
  return Array.from({ length: n }, (_, i) =>
    Math.round(40 + seed * 8 + 18 * Math.sin(i / 11 + seed) + (i % 17) * 0.4),
  );
}

@Component({
  selector: 'docs-chart-line-performance-example',
  imports: [PixelChartShellComponent, PixelChartLineComponent, PixelSelectComponent],
  template: `
    <div class="toolbar">
      <pixel-select
        label="Points"
        size="sm"
        [options]="pointOptions"
        [value]="pointCount()"
        (valueChange)="onPoints($event)"
      />
      <pixel-select
        label="Performance"
        size="sm"
        [options]="perfOptions"
        [value]="performance()"
        (valueChange)="onPerf($event)"
      />
    </div>

    <p class="hint">
      Recommended max for line: {{ maxLine }} points. Auto enables progressive ≥ 2k and LTTB
      sampling ≥ 5k aggregate points; progressive rendering disables animation. Use
      <strong>off</strong> to preview normal chart animation.
    </p>

    <pixel-chart-shell
      [title]="'Line · ' + pointCount() + ' points'"
      description="Performance presets for large series (docs stress page)."
      [series]="series()"
      [categories]="categories()"
      [(hiddenSeriesIds)]="hidden"
      [(showValues)]="showValues"
      [getChart]="chartGetter"
      zoomSelection="auto"
      exportFileName="line-perf"
    >
      <pixel-chart-line
        #line
        [series]="series()"
        [categories]="categories()"
        [hiddenSeriesIds]="hidden()"
        [showValues]="showValues()"
        [performance]="performance()"
        dataZoom="auto"
        [showMarkers]="false"
        height="320px"
        [ariaLabel]="'Performance line chart with ' + pointCount() + ' points'"
      />
    </pixel-chart-shell>
  `,
  styles: `
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: var(--pixel-sys-space-md, 1rem);
      margin-block-end: var(--pixel-sys-space-sm, 0.5rem);
      max-inline-size: 28rem;
    }
    .hint {
      margin-block: 0 var(--pixel-sys-space-md, 1rem);
      color: color-mix(in srgb, var(--pixel-sys-on-surface, #1a1b1f) 72%, transparent);
      font-size: 0.875rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartLinePerformanceExample {
  private readonly line = viewChild.required(PixelChartLineComponent);

  readonly maxLine = PIXEL_CHART_MAX_POINTS.line;

  readonly pointOptions: readonly PixelSelectOption[] = [
    { value: '1000', label: '1,000' },
    { value: '10000', label: '10,000' },
  ];

  readonly perfOptions: readonly PixelSelectOption[] = [
    { value: 'auto', label: 'auto' },
    { value: 'off', label: 'off' },
    { value: 'progressive', label: 'progressive' },
    { value: 'sampled', label: 'sampled' },
  ];

  readonly pointCount = signal(1000);
  readonly performance = signal<PixelChartPerformanceMode>('auto');
  readonly hidden = signal<readonly string[]>([]);
  readonly showValues = signal(false);

  readonly categories = computed(() =>
    Array.from({ length: this.pointCount() }, (_, i) => String(i + 1)),
  );

  readonly series = computed<readonly PixelChartSeries[]>(() => {
    const n = this.pointCount();
    return [
      { id: 'a', name: 'Series A', data: wave(1, n) },
      { id: 'b', name: 'Series B', data: wave(2, n) },
    ];
  });

  readonly chartGetter = () => this.line().getChart();

  onPoints(value: unknown): void {
    const n = Number(value);
    if (n === 1000 || n === 10_000) {
      this.pointCount.set(n);
    }
  }

  onPerf(value: unknown): void {
    if (value === 'auto' || value === 'off' || value === 'progressive' || value === 'sampled') {
      this.performance.set(value);
    }
  }
}
