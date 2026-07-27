import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import { PixelSelectComponent, type PixelSelectOption } from 'pixel-ui';
import {
  PixelChartRadarComponent,
  PixelChartShellComponent,
  buildRadarTable,
  type PixelChartRadarMode,
  type PixelChartSeries,
} from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-radar-basic-example',
  imports: [PixelChartShellComponent, PixelChartRadarComponent, PixelSelectComponent],
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
      title="Radar"
      description="Multivariate overlay — not stacked. Target mode adds a dashed ring."
      [series]="series()"
      [tableColumns]="table().columns"
      [tableRows]="table().rows"
      [(hiddenSeriesIds)]="hidden"
      [getChart]="chartGetter"
      exportFileName="radar-skills"
    >
      <pixel-chart-radar
        #radar
        [indicators]="indicators"
        [series]="series()"
        [hiddenSeriesIds]="hidden()"
        [mode]="mode()"
        [target]="target"
        ariaLabel="Team skills radar"
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
export class ChartRadarBasicExample {
  private readonly radar = viewChild.required(PixelChartRadarComponent);

  readonly modeOptions: readonly PixelSelectOption[] = [
    { value: 'line', label: 'line' },
    { value: 'filled', label: 'filled' },
    { value: 'markers', label: 'markers' },
    { value: 'target', label: 'target' },
  ];

  readonly indicators = [
    { name: 'Speed', max: 100 },
    { name: 'Quality', max: 100 },
    { name: 'Support', max: 100 },
    { name: 'Features', max: 100 },
    { name: 'Value', max: 100 },
  ];
  readonly target = [90, 88, 85, 80, 92];
  readonly series = signal<readonly PixelChartSeries[]>([
    { id: 'a', name: 'Team A', data: [80, 72, 68, 75, 70] },
    { id: 'b', name: 'Team B', data: [65, 80, 78, 60, 85] },
  ]);
  readonly hidden = signal<readonly string[]>([]);
  readonly mode = signal<PixelChartRadarMode>('filled');

  readonly table = computed(() =>
    buildRadarTable(this.indicators, this.series(), this.target),
  );

  readonly chartGetter = () => this.radar()?.getChart() ?? null;

  protected onMode(value: unknown): void {
    if (typeof value === 'string') {
      this.mode.set(value as PixelChartRadarMode);
    }
  }
}
