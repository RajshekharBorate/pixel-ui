import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import {
  PixelChartPieComponent,
  PixelChartShellComponent,
  buildPieTable,
  pieSlicesToLegendSeries,
  type PixelChartPieMode,
  type PixelChartPieSlice,
} from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-pie-basic-example',
  imports: [PixelChartShellComponent, PixelChartPieComponent],
  template: `
    <div class="toolbar">
      <label>
        Mode
        <select [value]="mode()" (change)="onMode($event)">
          <option value="pie">pie</option>
          <option value="donut">donut</option>
          <option value="semi">semi</option>
        </select>
      </label>
    </div>

    <pixel-chart-shell
      title="Category share"
      description="Part-to-whole — pie, donut, or semi-donut."
      [series]="legendSeries()"
      [tableColumns]="table().columns"
      [tableRows]="table().rows"
      [(hiddenSeriesIds)]="hidden"
      [getChart]="chartGetter"
      exportFileName="category-share"
    >
      <pixel-chart-pie
        #pie
        [slices]="slices()"
        [mode]="mode()"
        [hiddenSliceIds]="hidden()"
        ariaLabel="Category share"
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
export class ChartPieBasicExample {
  private readonly pie = viewChild.required(PixelChartPieComponent);

  readonly slices = signal<readonly PixelChartPieSlice[]>([
    { id: 'cloud', name: 'Cloud', value: 38 },
    { id: 'onprem', name: 'On-prem', value: 27 },
    { id: 'saas', name: 'SaaS', value: 22 },
    { id: 'other', name: 'Other', value: 13 },
  ]);
  readonly mode = signal<PixelChartPieMode>('donut');
  readonly hidden = signal<readonly string[]>([]);

  readonly legendSeries = computed(() => pieSlicesToLegendSeries(this.slices()));
  readonly table = computed(() => buildPieTable(this.slices()));

  readonly chartGetter = () => this.pie()?.getChart() ?? null;

  protected onMode(event: Event): void {
    this.mode.set((event.target as HTMLSelectElement).value as PixelChartPieMode);
  }
}
