import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelCheckboxComponent, PixelToggleComponent } from 'pixel-ui';

@Component({
  selector: 'docs-toggle-skeleton-example',
  imports: [PixelToggleComponent, PixelCheckboxComponent],
  templateUrl: './toggle-skeleton.example.html',
  styleUrl: './toggle-skeleton.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleSkeletonExample {
  protected readonly skeleton = signal(true);
}
