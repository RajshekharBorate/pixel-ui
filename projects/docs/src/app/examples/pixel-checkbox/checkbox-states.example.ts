import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelCheckboxComponent, PixelCheckboxState } from 'pixel-ui';

interface StateExample {
  readonly label: string;
  readonly state: PixelCheckboxState;
  readonly helperText?: string;
}

@Component({
  selector: 'docs-checkbox-states-example',
  standalone: true,
  imports: [PixelCheckboxComponent],
  template: `
    <div class="grid">
      @for (item of stateExamples; track item.state) {
        <pixel-checkbox
          [label]="item.label"
          [state]="item.state"
          [helperText]="item.helperText ?? ''"
        />
      }
      <pixel-checkbox label="Disabled unchecked" disabled helperText="Muted outline" />
      <pixel-checkbox
        label="Disabled checked"
        disabled
        [checked]="true"
        helperText="Material-style selected disabled"
      />
    </div>
  `,
  styles: `
    .grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      max-width: 36rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxStatesExample {
  protected readonly stateExamples: readonly StateExample[] = [
    {
      label: 'Indeterminate',
      state: 'indeterminate',
      helperText: 'Partial selection.',
    },
    { label: 'Loading', state: 'loading', helperText: 'Applying change.' },
  ];
}
