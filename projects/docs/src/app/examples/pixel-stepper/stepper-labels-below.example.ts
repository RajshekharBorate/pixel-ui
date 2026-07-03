import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelStepComponent,
  PixelStepContentComponent,
  PixelStepperComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-stepper-labels-below-example',
  standalone: true,
  imports: [PixelStepperComponent, PixelStepComponent, PixelStepContentComponent],
  templateUrl: './stepper-labels-below.example.html',
  styleUrl: './stepper-labels-below.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperLabelsBelowExample {}
