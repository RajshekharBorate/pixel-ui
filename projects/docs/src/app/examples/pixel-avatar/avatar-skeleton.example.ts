import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelAvatarComponent, PixelAvatarGroupComponent, PixelCheckboxComponent, type PixelAvatarData } from 'pixel-ui';

@Component({
  selector: 'docs-avatar-skeleton-example',
  standalone: true,
  imports: [PixelAvatarComponent, PixelAvatarGroupComponent, PixelCheckboxComponent],
  templateUrl: './avatar-skeleton.example.html',
  styleUrl: './avatar-skeleton.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarSkeletonExample {
  protected readonly skeleton = signal(true);

  protected readonly avatars: PixelAvatarData[] = [
    { name: 'Alice' },
    { name: 'Bob' },
    { name: 'Carol' },
    { name: 'Dave' },
  ];
}
