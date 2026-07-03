import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelToggleComponent, PixelToggleOption } from 'pixel-ui';

@Component({
  selector: 'docs-toggle-segmented-example',
  standalone: true,
  imports: [PixelToggleComponent],
  template: `
    <div class="stack">
      <pixel-toggle
        mode="segmented"
        segmentedAppearance="contained"
        segmentedShape="pill"
        [options]="stayOptions"
        [value]="stayType()"
        (valueChange)="setStayType($event)"
      />
      <pixel-toggle
        mode="segmented"
        segmentedAppearance="surface"
        segmentedShape="rounded"
        segmentedAriaLabel="Logical operator"
        [options]="logicOptions"
        [value]="operator()"
        (valueChange)="setOperator($event)"
      />
    </div>
  `,
  styles: `
    .stack {
      display: grid;
      gap: 1rem;
      max-width: 20rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleSegmentedExample {
  protected readonly stayType = signal('hotels');
  protected readonly operator = signal<'and' | 'or'>('and');

  protected setStayType(value: string | number): void {
    this.stayType.set(String(value));
  }

  protected setOperator(value: string | number): void {
    this.operator.set(value === 'or' ? 'or' : 'and');
  }

  protected readonly stayOptions: readonly PixelToggleOption[] = [
    { value: 'hotels', label: 'Hotels' },
    { value: 'apartments', label: 'Apartments' },
  ];

  protected readonly logicOptions: readonly PixelToggleOption[] = [
    { value: 'and', label: 'AND' },
    { value: 'or', label: 'OR' },
  ];
}
