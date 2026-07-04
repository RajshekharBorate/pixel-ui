import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelSelectComponent, PixelSelectOption } from 'pixel-ui';

@Component({
  selector: 'docs-select-states-example',
  imports: [PixelSelectComponent],
  template: `
    <div class="grid">
      <pixel-select
        label="Disabled"
        [options]="countries"
        [value]="1"
        [disabled]="true"
        helperText="Disabled prevents interaction."
      />
      <pixel-select
        label="Readonly"
        [options]="countries"
        [value]="2"
        [readonly]="true"
        helperText="Readonly keeps focus but blocks changes."
      />
      <pixel-select
        label="Error"
        [options]="countries"
        state="error"
        helperText="Error visual state token."
      />
      <pixel-select
        label="Loading"
        [options]="countries"
        [loading]="true"
        helperText="Async loading uses the loading visual state."
      />
      <pixel-select
        label="Floating label"
        labelPosition="floating"
        [options]="countries"
        [value]="floating()"
        [required]="true"
        helperText="Floating label mode with required indicator."
        (valueChange)="floating.set($event)"
      />
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
export class SelectStatesExample {
  protected readonly floating = signal<unknown | null>(null);

  protected readonly countries: readonly PixelSelectOption[] = [
    { value: 1, label: 'India' },
    { value: 2, label: 'Japan' },
    { value: 3, label: 'Germany' },
    { value: 4, label: 'France' },
  ];
}
