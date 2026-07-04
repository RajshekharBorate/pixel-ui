import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelInputComponent } from 'pixel-ui';

@Component({
  selector: 'docs-input-multiline-example',
  imports: [PixelInputComponent],
  template: `
    <div class="stack">
      <pixel-input
        label="Notes"
        placeholder="Type a few lines…"
        [multiline]="true"
        [rows]="4"
        [maxLength]="280"
        [showClear]="true"
        helperText="Fixed rows with manual resize and a counter."
        [value]="notes()"
        (valueChange)="notes.set($event)"
      />
      <pixel-input
        label="Description"
        placeholder="Auto-grows with content"
        [multiline]="true"
        [autoResize]="true"
        helperText="autoResize hides the resize handle and tracks scrollHeight."
        [value]="description()"
        (valueChange)="description.set($event)"
      />
    </div>
  `,
  styles: `
    .stack {
      display: grid;
      gap: 1rem;
      max-width: 24rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputMultilineExample {
  protected readonly notes = signal('Same component with [multiline]="true".');
  protected readonly description = signal('');
}
