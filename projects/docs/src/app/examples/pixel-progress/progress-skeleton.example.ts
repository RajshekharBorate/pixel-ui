import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelCheckboxComponent, PixelProgressBarComponent, PixelProgressCircleComponent } from 'pixel-ui';

@Component({
  selector: 'docs-progress-skeleton-example',
  imports: [PixelProgressBarComponent, PixelProgressCircleComponent, PixelCheckboxComponent],
  templateUrl: './progress-skeleton.example.html',
  styleUrl: './progress-skeleton.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressSkeletonExample {
  protected readonly skeleton = signal(true);
}
