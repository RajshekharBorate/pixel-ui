import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelInputComponent } from 'pixel-ui';

@Component({
  selector: 'docs-input-character-counter-example',
  standalone: true,
  imports: [PixelInputComponent],
  template: `
    <pixel-input
      label="Short bio"
      [maxLength]="40"
      [value]="bio()"
      helperText="Character counter appears when maxLength is set."
      (valueChange)="bio.set($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputCharacterCounterExample {
  protected readonly bio = signal('Hello');
}
