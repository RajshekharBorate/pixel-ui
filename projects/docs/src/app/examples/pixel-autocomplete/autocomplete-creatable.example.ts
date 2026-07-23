import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelAutocompleteComponent, type PixelAutocompleteOption } from 'pixel-ui';

@Component({
  selector: 'docs-autocomplete-creatable-example',
  imports: [PixelAutocompleteComponent, JsonPipe],
  template: `
    <pixel-autocomplete
      label="Tags"
      placeholder="Type a tag and press Enter…"
      mode="multiple"
      [creatable]="true"
      [options]="suggestions"
      [value]="tags()"
      [maxSelections]="5"
      helperText="Pick a suggestion or create a new tag. Max 5."
      (valueChange)="tags.set($event)"
    />
    <p class="hint">Tags: {{ tags() | json }}</p>
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
export class AutocompleteCreatableExample {
  protected readonly tags = signal<unknown>([]);

  protected readonly suggestions: readonly PixelAutocompleteOption[] = [
    { value: 'bug', label: 'bug' },
    { value: 'feature', label: 'feature' },
    { value: 'docs', label: 'docs' },
    { value: 'a11y', label: 'a11y' },
  ];
}
