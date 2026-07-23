import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelAutocompleteComponent, type PixelAutocompleteOption } from 'pixel-ui';

@Component({
  selector: 'docs-autocomplete-multi-example',
  imports: [PixelAutocompleteComponent, JsonPipe],
  template: `
    <pixel-autocomplete
      label="Assignees"
      placeholder="Search people…"
      mode="multiple"
      [options]="people"
      [value]="selected()"
      helperText="Select multiple people. Chips are removable; Backspace removes the last chip."
      (valueChange)="selected.set($event)"
    />
    <p class="hint">Selected: {{ selected() | json }}</p>
  `,
  styles: `
    .hint {
      margin: 0.75rem 0 0;
      font-size: 0.8125rem;
      color: var(--pixel-sys-on-surface-variant, #444);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteMultiExample {
  protected readonly selected = signal<unknown>([]);

  protected readonly people: readonly PixelAutocompleteOption[] = [
    { value: 'ava', label: 'Ava Kim', avatarText: 'AK', subtitle: 'Product' },
    { value: 'diego', label: 'Diego Martins', avatarText: 'DM', subtitle: 'Engineering' },
    { value: 'priya', label: 'Priya Shah', avatarText: 'PS', subtitle: 'Design' },
    { value: 'jonas', label: 'Jonas Lindqvist', avatarText: 'JL', subtitle: 'Finance' },
  ];
}
