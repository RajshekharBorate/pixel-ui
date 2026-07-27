import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import {
  PixelChartGaugeComponent,
  PixelChartShellComponent,
  type PixelChartGaugeVariant,
} from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-gauge-basic-example',
  imports: [PixelChartShellComponent, PixelChartGaugeComponent],
  template: `
    <div class="toolbar">
      <label>
        Variant
        <select [value]="variant()" (change)="onVariant($event)">
          <option value="radial">radial</option>
          <option value="semi">semi</option>
          <option value="donut">donut</option>
          <option value="linear">linear</option>
          <option value="bullet">bullet</option>
        </select>
      </label>
    </div>

    <pixel-chart-shell
      title="KPI gauge"
      description="Radial, semi, donut, linear, and bullet (Phase 1b)."
      [empty]="false"
      [showTable]="false"
      [getChart]="chartGetter"
      exportFileName="kpi-gauge"
    >
      <pixel-chart-gauge
        #gauge
        [value]="value()"
        [min]="0"
        [max]="100"
        [target]="variant() === 'bullet' ? 80 : null"
        [variant]="variant()"
        label="Performance"
        ariaLabel="Performance gauge"
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
export class ChartGaugeBasicExample {
  private readonly gauge = viewChild.required(PixelChartGaugeComponent);

  readonly value = signal(72);
  readonly variant = signal<PixelChartGaugeVariant>('radial');

  readonly chartGetter = () => this.gauge()?.getChart() ?? null;

  protected onVariant(event: Event): void {
    this.variant.set((event.target as HTMLSelectElement).value as PixelChartGaugeVariant);
  }
}
