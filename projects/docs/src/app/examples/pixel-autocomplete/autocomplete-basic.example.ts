import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelAutocompleteComponent, PixelAutocompleteOption } from 'pixel-ui';

@Component({
  selector: 'docs-autocomplete-basic-example',
  standalone: true,
  imports: [PixelAutocompleteComponent],
  template: `
    <pixel-autocomplete
      label="City"
      placeholder="Search cities…"
      [options]="cities"
      [value]="city()"
      helperText="Start typing to filter. Press Esc to close."
      (valueChange)="city.set($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteBasicExample {
  protected readonly city = signal<unknown | null>(null);

  protected readonly cities: readonly PixelAutocompleteOption[] = [
    { value: 'nyc', label: 'New York' },
    { value: 'sfo', label: 'San Francisco' },
    { value: 'lax', label: 'Los Angeles' },
    { value: 'chi', label: 'Chicago' },
    { value: 'hou', label: 'Houston' },
    { value: 'phx', label: 'Phoenix' },
    { value: 'phi', label: 'Philadelphia' },
    { value: 'sat', label: 'San Antonio' },
    { value: 'sd', label: 'San Diego' },
    { value: 'dal', label: 'Dallas' },
  ];
}
