import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelCheckboxComponent, PixelStepComponent, PixelStepperComponent } from 'pixel-ui';

@Component({
  selector: 'docs-stepper-skeleton-example',
  standalone: true,
  imports: [PixelStepperComponent, PixelStepComponent, PixelCheckboxComponent],
  templateUrl: './stepper-skeleton.example.html',
  styleUrl: './stepper-skeleton.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperSkeletonExample {
  protected readonly skeleton = signal(true);
}
