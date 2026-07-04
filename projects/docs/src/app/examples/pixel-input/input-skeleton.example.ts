import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelCheckboxComponent, PixelInputComponent } from 'pixel-ui';

@Component({
  selector: 'docs-input-skeleton-example',
  imports: [PixelInputComponent, PixelCheckboxComponent],
  templateUrl: './input-skeleton.example.html',
  styleUrl: './input-skeleton.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputSkeletonExample {
  protected readonly skeleton = signal(true);
}
