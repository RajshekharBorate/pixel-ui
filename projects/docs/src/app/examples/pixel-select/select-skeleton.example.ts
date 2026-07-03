import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelCheckboxComponent, PixelSelectComponent } from 'pixel-ui';

@Component({
  selector: 'docs-select-skeleton-example',
  standalone: true,
  imports: [PixelSelectComponent, PixelCheckboxComponent],
  templateUrl: './select-skeleton.example.html',
  styleUrl: './select-skeleton.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectSkeletonExample {
  protected readonly skeleton = signal(true);
}
