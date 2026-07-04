import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelBadgeComponent, PixelCheckboxComponent } from 'pixel-ui';

@Component({
  selector: 'docs-badge-skeleton-example',
  imports: [PixelBadgeComponent, PixelCheckboxComponent],
  templateUrl: './badge-skeleton.example.html',
  styleUrl: './badge-skeleton.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeSkeletonExample {
  protected readonly skeleton = signal(true);
}
