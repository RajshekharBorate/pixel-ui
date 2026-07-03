import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelStepComponent,
  PixelStepContentComponent,
  PixelStepperComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-stepper-optional-example',
  standalone: true,
  imports: [PixelStepperComponent, PixelStepComponent, PixelStepContentComponent],
  templateUrl: './stepper-optional.example.html',
  styleUrl: './stepper-optional.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperOptionalExample {}
