import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelAutocompleteComponent, PixelAutocompleteOption, PixelAutocompleteSize } from 'pixel-ui';

@Component({
  selector: 'docs-autocomplete-sizes-example',
  standalone: true,
  imports: [PixelAutocompleteComponent],
  template: `
    <div class="stack">
      @for (size of sizes; track size) {
        <pixel-autocomplete
          [label]="size.toUpperCase()"
          placeholder="Search…"
          [options]="options"
          [value]="values[size]()"
          [size]="size"
          (valueChange)="values[size].set($event)"
        />
      }
    </div>
  `,
  styles: `
    .stack { display: grid; gap: 1rem; max-width: 20rem; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteSizesExample {
  protected readonly sizes: readonly PixelAutocompleteSize[] = ['xs', 'sm', 'md', 'lg'];

  protected readonly values: Record<PixelAutocompleteSize, ReturnType<typeof signal<unknown | null>>> = {
    xs: signal<unknown | null>(null),
    sm: signal<unknown | null>(null),
    md: signal<unknown | null>(null),
    lg: signal<unknown | null>(null),
  };

  protected readonly options: readonly PixelAutocompleteOption[] = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
    { value: 'g', label: 'Gamma' },
    { value: 'd', label: 'Delta' },
  ];
}
