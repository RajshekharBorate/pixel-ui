import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelToggleComponent, PixelToggleOption } from 'pixel-ui';

@Component({
  selector: 'docs-toggle-segmented-shapes-example',
  standalone: true,
  imports: [PixelToggleComponent],
  template: `
    <div class="grid">
      <div class="column">
        <p class="subtitle">Rounded (default)</p>
        <pixel-toggle
          mode="segmented"
          segmentedAppearance="contained"
          segmentedShape="rounded"
          [options]="stayOptions"
          [value]="stayType()"
        />
        <pixel-toggle
          mode="segmented"
          segmentedAppearance="surface"
          segmentedShape="rounded"
          [options]="logicOptions"
          [value]="operator()"
        />
        <p class="subtitle">Disabled</p>
        <pixel-toggle
          mode="segmented"
          segmentedAppearance="contained"
          segmentedShape="rounded"
          disabled
          [options]="stayOptions"
          [value]="stayType()"
        />
      </div>
      <div class="column">
        <p class="subtitle">Pill</p>
        <pixel-toggle
          mode="segmented"
          segmentedAppearance="contained"
          segmentedShape="pill"
          [options]="stayOptions"
          [value]="stayType()"
        />
        <pixel-toggle
          mode="segmented"
          segmentedAppearance="surface"
          segmentedShape="pill"
          [options]="logicOptions"
          [value]="operator()"
        />
        <p class="subtitle">Disabled</p>
        <pixel-toggle
          mode="segmented"
          segmentedAppearance="surface"
          segmentedShape="pill"
          disabled
          [options]="logicOptions"
          [value]="operator()"
        />
      </div>
    </div>
  `,
  styles: `
    .grid {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      max-width: 32rem;
    }

    .column {
      display: grid;
      gap: 0.75rem;
    }

    .subtitle {
      margin: 0;
      font-size: 0.8125rem;
      font-weight: 600;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleSegmentedShapesExample {
  protected readonly stayType = signal('hotels');
  protected readonly operator = signal<'and' | 'or'>('and');

  protected readonly stayOptions: readonly PixelToggleOption[] = [
    { value: 'hotels', label: 'Hotels' },
    { value: 'apartments', label: 'Apartments' },
  ];

  protected readonly logicOptions: readonly PixelToggleOption[] = [
    { value: 'and', label: 'AND' },
    { value: 'or', label: 'OR' },
  ];
}
