import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { PixelSelectComponent, type PixelSelectOption } from 'pixel-ui';
import {
  PixelChartGaugeComponent,
  PixelChartShellComponent,
  type PixelChartGaugeVariant,
} from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-gauge-basic-example',
  imports: [PixelChartShellComponent, PixelChartGaugeComponent, PixelSelectComponent],
  template: `
    <div class="toolbar">
      <pixel-select
        label="Variant"
        size="sm"
        [options]="variantOptions"
        [value]="variant()"
        (valueChange)="onVariant($event)"
      />
    </div>

    <pixel-chart-shell
      title="KPI gauge"
      description="Radial, semi, donut, linear, and bullet (Phase 1b)."
      [empty]="false"
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
      margin-block-end: var(--pixel-sys-space-md, 1rem);
      max-inline-size: 14rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartGaugeBasicExample {
  private readonly gauge = viewChild.required(PixelChartGaugeComponent);

  readonly variantOptions: readonly PixelSelectOption[] = [
    { value: 'radial', label: 'radial' },
    { value: 'semi', label: 'semi' },
    { value: 'donut', label: 'donut' },
    { value: 'linear', label: 'linear' },
    { value: 'bullet', label: 'bullet' },
  ];

  readonly value = signal(72);
  readonly variant = signal<PixelChartGaugeVariant>('radial');

  readonly chartGetter = () => this.gauge()?.getChart() ?? null;

  protected onVariant(value: unknown): void {
    if (typeof value === 'string') {
      this.variant.set(value as PixelChartGaugeVariant);
    }
  }
}
