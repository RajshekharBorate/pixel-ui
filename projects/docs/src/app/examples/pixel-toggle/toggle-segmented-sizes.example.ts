import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelToggleComponent, PixelToggleOption, PixelToggleSize } from 'pixel-ui';

@Component({
  selector: 'docs-toggle-segmented-sizes-example',
  standalone: true,
  imports: [PixelToggleComponent],
  template: `
    <div class="stack">
      @for (size of sizes; track size) {
        <div class="row">
          <span class="label">{{ size }}</span>
          <pixel-toggle
            mode="segmented"
            segmentedAppearance="contained"
            [size]="size"
            [options]="stayOptions"
            [value]="stayType()"
          />
          <pixel-toggle
            mode="segmented"
            segmentedAppearance="surface"
            [size]="size"
            [options]="logicOptions"
            [value]="operator()"
          />
        </div>
      }
    </div>
  `,
  styles: `
    .stack {
      display: grid;
      gap: 1rem;
      max-width: 28rem;
    }

    .row {
      display: grid;
      grid-template-columns: 2rem 1fr 1fr;
      gap: 0.75rem;
      align-items: center;
    }

    .label {
      font-size: 0.8125rem;
      font-weight: 600;
      text-transform: uppercase;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleSegmentedSizesExample {
  protected readonly stayType = signal('hotels');
  protected readonly operator = signal<'and' | 'or'>('and');
  protected readonly sizes: readonly PixelToggleSize[] = ['xs', 'sm', 'md', 'lg'];

  protected readonly stayOptions: readonly PixelToggleOption[] = [
    { value: 'hotels', label: 'Hotels' },
    { value: 'apartments', label: 'Apartments' },
  ];

  protected readonly logicOptions: readonly PixelToggleOption[] = [
    { value: 'and', label: 'AND' },
    { value: 'or', label: 'OR' },
  ];
}
