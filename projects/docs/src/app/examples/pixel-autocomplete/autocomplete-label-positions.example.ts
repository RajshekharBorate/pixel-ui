import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelAutocompleteComponent,
  PixelAutocompleteLabelPosition,
  PixelAutocompleteOption,
} from 'pixel-ui';

@Component({
  selector: 'docs-autocomplete-label-positions-example',
  standalone: true,
  imports: [PixelAutocompleteComponent],
  template: `
    <div class="stack">
      @for (pos of positions; track pos) {
        <pixel-autocomplete
          [label]="labels[pos]"
          placeholder="Search…"
          [options]="options"
          [value]="values[pos]()"
          [labelPosition]="pos"
          (valueChange)="values[pos].set($event)"
        />
      }
    </div>
  `,
  styles: `
    .stack { display: grid; gap: 1.25rem; max-width: 28rem; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteLabelPositionsExample {
  protected readonly positions: readonly PixelAutocompleteLabelPosition[] = [
    'top',
    'left',
    'floating',
    'hidden',
  ];

  protected readonly labels: Record<PixelAutocompleteLabelPosition, string> = {
    top: 'Top label',
    left: 'Left label',
    floating: 'Floating label',
    hidden: 'Hidden label (aria-label only)',
  };

  protected readonly values: Record<PixelAutocompleteLabelPosition, ReturnType<typeof signal<unknown | null>>> = {
    top: signal<unknown | null>(null),
    left: signal<unknown | null>(null),
    floating: signal<unknown | null>(null),
    hidden: signal<unknown | null>(null),
  };

  protected readonly options: readonly PixelAutocompleteOption[] = [
    { value: 'a', label: 'Apple' },
    { value: 'b', label: 'Banana' },
    { value: 'c', label: 'Cherry' },
    { value: 'd', label: 'Date' },
  ];
}
