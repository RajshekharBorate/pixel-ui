import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelStepComponent, PixelStepperComponent } from 'pixel-ui';

@Component({
  selector: 'docs-stepper-timeline-example',
  standalone: true,
  imports: [PixelStepperComponent, PixelStepComponent],
  templateUrl: './stepper-timeline.example.html',
  styleUrl: './stepper-timeline.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperTimelineExample {}
