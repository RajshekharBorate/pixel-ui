import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelInputComponent } from 'pixel-ui';

@Component({
  selector: 'docs-input-affixes-example',
  imports: [PixelInputComponent],
  template: `
    <div class="stack">
      <pixel-input
        label="Amount"
        type="number"
        prefixText="$"
        suffixText="USD"
        placeholder="0.00"
        helperText="Static prefix and suffix slots."
      />
      <pixel-input
        label="Passphrase"
        type="password"
        [showPasswordToggle]="true"
        [value]="password()"
        helperText="Toggle visibility without leaving the keyboard path."
        (valueChange)="password.set($event)"
      />
      <pixel-input
        label="Clearable note"
        [value]="note()"
        [showClear]="true"
        helperText="Escape also clears when showClear is enabled."
        (valueChange)="note.set($event)"
      />
    </div>
  `,
  styles: `
    .stack {
      display: grid;
      gap: 1rem;
      max-width: 22rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputAffixesExample {
  protected readonly password = signal('secret');
  protected readonly note = signal('Clear me');
}
