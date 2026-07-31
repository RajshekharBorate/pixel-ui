import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { PixelButtonComponent, PixelSelectComponent, PixelToggleComponent, type PixelSelectOption  } from 'pixel-ui';
import {
  PixelChartGaugeComponent,
  PixelChartShellComponent,
  type PixelChartGaugeVariant,
} from 'pixel-ui/charts';

@Component({
  selector: 'docs-chart-gauge-basic-example',
  imports: [PixelButtonComponent, PixelChartShellComponent,
    PixelChartGaugeComponent,
    PixelSelectComponent,
    PixelToggleComponent,],
  template: `
    <div class="toolbar">
      <pixel-select
        label="Variant"
        size="sm"
        [options]="variantOptions"
        [value]="variant()"
        (valueChange)="onVariant($event)"
      />
      <pixel-toggle
        mode="switch"
        size="sm"
        label="Tick marks"
        [checked]="variant() === 'tick' || showTicks()"
        [disabled]="variant() === 'tick'"
        (checkedChange)="showTicks.set($event)"
      />
    
      <pixel-button
        class="docs-chart-skeleton-toggle"
        size="sm"
        appearance="outline"
        (click)="showSkeleton.update((v) => !v)"
      >
        {{ showSkeleton() ? 'Hide skeleton' : 'Show skeleton' }}
      </pixel-button>
    </div>

    <pixel-chart-shell
      title="KPI gauge"
      description="Phase 1b + Phase 2 variants (solid, multi-range, dual, tick, vertical)."
      [empty]="false"
      [getChart]="chartGetter"
      [showValueToggle]="false"
      exportFileName="kpi-gauge"
     [showSkeleton]="showSkeleton()">
      <pixel-chart-gauge
        #gauge
        [value]="value()"
        [min]="0"
        [max]="100"
        [target]="needsTarget() ? 80 : null"
        [ranges]="needsRanges() ? defaultRanges : []"
        [variant]="variant()"
        [showTicks]="showTicks()"
        label="Performance"
        ariaLabel="Performance gauge"
        [height]="variant() === 'vertical' ? '280px' : '220px'"
       [showSkeleton]="showSkeleton()" />
    </pixel-chart-shell>
  `,
  styles: `
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: var(--pixel-sys-space-md, 1rem);
      margin-block-end: var(--pixel-sys-space-md, 1rem);
    }

    .toolbar > pixel-button {
      flex: 0 0 auto;
    }

    .toolbar > pixel-select {
      flex: 1 1 10rem;
      max-inline-size: 14rem;
      min-inline-size: 9rem;
    }

    .toolbar > pixel-toggle {
      flex: 0 0 auto;
    }

  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartGaugeBasicExample {
  readonly showSkeleton = signal(false);

  private readonly gauge = viewChild.required(PixelChartGaugeComponent);

  readonly variantOptions: readonly PixelSelectOption[] = [
    { value: 'radial', label: 'radial' },
    { value: 'semi', label: 'semi' },
    { value: 'donut', label: 'donut' },
    { value: 'linear', label: 'linear' },
    { value: 'bullet', label: 'bullet' },
    { value: 'solid', label: 'solid' },
    { value: 'multi-range', label: 'multi-range' },
    { value: 'dual', label: 'dual' },
    { value: 'tick', label: 'tick' },
    { value: 'vertical', label: 'vertical' },
  ];

  readonly defaultRanges = [
    { from: 0, to: 50, color: '#b3261e' },
    { from: 50, to: 75, color: '#9a6700' },
    { from: 75, to: 100, color: '#146c2e' },
  ];

  readonly value = signal(72);
  readonly variant = signal<PixelChartGaugeVariant>('radial');
  readonly showTicks = signal(true);

  readonly chartGetter = () => this.gauge()?.getChart() ?? null;

  protected needsTarget(): boolean {
    const v = this.variant();
    return v === 'bullet' || v === 'dual';
  }

  protected needsRanges(): boolean {
    const v = this.variant();
    return v === 'bullet' || v === 'multi-range';
  }

  protected onVariant(value: unknown): void {
    if (typeof value === 'string') {
      this.variant.set(value as PixelChartGaugeVariant);
    }
  }
}
