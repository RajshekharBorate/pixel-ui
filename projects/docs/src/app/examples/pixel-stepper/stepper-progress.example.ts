import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelButtonComponent,
  PixelStepActionsComponent,
  PixelStepComponent,
  PixelStepContentComponent,
  PixelStepperComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-stepper-progress-example',
  imports: [
    PixelStepperComponent,
    PixelStepComponent,
    PixelStepContentComponent,
    PixelStepActionsComponent,
    PixelButtonComponent,
  ],
  templateUrl: './stepper-progress.example.html',
  styleUrl: './stepper-progress.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperProgressExample {}
