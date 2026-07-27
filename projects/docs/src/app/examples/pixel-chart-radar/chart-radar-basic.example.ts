import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import {
  PixelChartRadarComponent,
  PixelChartShellComponent,
  buildRadarTable,
  type PixelChartRadarMode,
  type PixelChartSeries,
} from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-radar-basic-example',
  imports: [PixelChartShellComponent, PixelChartRadarComponent],
  template: `
    <div class="toolbar">
      <label>
        Mode
        <select [value]="mode()" (change)="onMode($event)">
          <option value="line">line</option>
          <option value="filled">filled</option>
          <option value="markers">markers</option>
          <option value="target">target</option>
        </select>
      </label>
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
      margin-block-end: 1rem;
      font-size: 0.875rem;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartRadarBasicExample {
  private readonly radar = viewChild.required(PixelChartRadarComponent);

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

  protected onMode(event: Event): void {
    this.mode.set((event.target as HTMLSelectElement).value as PixelChartRadarMode);
  }
}
