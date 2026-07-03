import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelAutocompleteComponent, PixelAutocompleteOption } from 'pixel-ui';

@Component({
  selector: 'docs-autocomplete-disabled-readonly-example',
  standalone: true,
  imports: [PixelAutocompleteComponent],
  template: `
    <div class="grid">
      <pixel-autocomplete
        label="Disabled"
        placeholder="Not interactive"
        [options]="options"
        [value]="'nyc'"
        [disabled]="true"
        helperText="Prevents all interaction."
      />
      <pixel-autocomplete
        label="Readonly"
        placeholder="Focusable only"
        [options]="options"
        [value]="'sfo'"
        [readonly]="true"
        helperText="Focusable but cannot be changed."
      />
      <pixel-autocomplete
        label="Loading skeleton"
        placeholder="Loading options…"
        [options]="[]"
        [value]="null"
        [showSkeleton]="true"
        helperText="Shown while initial options are fetching."
      />
    </div>
  `,
  styles: `
    .grid { display: grid; gap: 1.25rem; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteDisabledReadonlyExample {
  protected readonly options: readonly PixelAutocompleteOption[] = [
    { value: 'nyc', label: 'New York' },
    { value: 'sfo', label: 'San Francisco' },
    { value: 'lax', label: 'Los Angeles' },
  ];
}
