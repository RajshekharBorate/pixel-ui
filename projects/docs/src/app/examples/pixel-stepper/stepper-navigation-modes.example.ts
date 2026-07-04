import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelStepComponent, PixelStepperComponent } from 'pixel-ui';

@Component({
  selector: 'docs-stepper-navigation-modes-example',
  imports: [PixelStepperComponent, PixelStepComponent],
  templateUrl: './stepper-navigation-modes.example.html',
  styleUrl: './stepper-navigation-modes.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperNavigationModesExample {}
