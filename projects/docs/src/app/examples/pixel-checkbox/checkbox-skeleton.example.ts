import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelCheckboxComponent } from 'pixel-ui';

@Component({
  selector: 'docs-checkbox-skeleton-example',
  standalone: true,
  imports: [PixelCheckboxComponent],
  templateUrl: './checkbox-skeleton.example.html',
  styleUrl: './checkbox-skeleton.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxSkeletonExample {
  protected readonly skeleton = signal(true);
}
