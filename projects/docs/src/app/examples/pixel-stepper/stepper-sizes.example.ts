import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelStepComponent,
  PixelStepperComponent,
  type PixelStepperSize,
} from 'pixel-ui';

@Component({
  selector: 'docs-stepper-sizes-example',
  imports: [PixelStepperComponent, PixelStepComponent],
  templateUrl: './stepper-sizes.example.html',
  styleUrl: './stepper-sizes.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperSizesExample {
  protected readonly sizes: readonly PixelStepperSize[] = ['xs', 'sm', 'md', 'lg'];
}
