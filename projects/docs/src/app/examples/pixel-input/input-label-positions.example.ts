import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelInputComponent, PixelInputLabelPosition } from 'pixel-ui';

@Component({
  selector: 'docs-input-label-positions-example',
  standalone: true,
  imports: [PixelInputComponent],
  template: `
    <div class="grid">
      @for (position of labelPositions; track position) {
        <pixel-input
          [labelPosition]="position"
          [label]="labelFor(position)"
          [placeholder]="position === 'floating' ? 'Focus or type to float' : 'Sample text'"
          [helperText]="helperFor(position)"
          [value]="position === 'floating' ? floatingValue() : 'Sample value'"
          (valueChange)="handleChange(position, $event)"
        />
      }
    </div>
  `,
  styles: `
    .grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      max-width: 36rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputLabelPositionsExample {
  protected readonly floatingValue = signal('');
  protected readonly labelPositions: readonly PixelInputLabelPosition[] = [
    'top',
    'left',
    'floating',
    'hidden',
  ];

  protected labelFor(position: PixelInputLabelPosition): string {
    switch (position) {
      case 'floating':
        return 'Floating label';
      case 'hidden':
        return 'Hidden label';
      case 'left':
        return 'Left label';
      default:
        return 'Top label';
    }
  }

  protected helperFor(position: PixelInputLabelPosition): string {
    return position === 'hidden'
      ? 'The label is visually hidden but still associated for screen readers.'
      : `Demonstrates ${position} layout.`;
  }

  protected handleChange(position: PixelInputLabelPosition, value: string): void {
    if (position === 'floating') {
      this.floatingValue.set(value);
    }
  }
}
