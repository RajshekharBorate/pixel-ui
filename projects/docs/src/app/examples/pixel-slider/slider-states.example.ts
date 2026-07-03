import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelSliderComponent } from 'pixel-ui';

@Component({
  selector: 'docs-slider-states-example',
  standalone: true,
  imports: [PixelSliderComponent],
  template: `
    <pixel-slider label="Default"  [value]="60" helperText="Interactive slider." />
    <pixel-slider label="Disabled" [value]="40" [disabled]="true" helperText="Cannot be changed." />
    <pixel-slider label="Readonly" [value]="70" [readonly]="true" helperText="Focusable but not editable." />
    <pixel-slider label="With value" [value]="55" [showValue]="true" [alwaysShowValue]="true" helperText="Value always visible." />
  `,
  styles: `:host { display: flex; flex-direction: column; gap: 1.5rem; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SliderStatesExample {}
