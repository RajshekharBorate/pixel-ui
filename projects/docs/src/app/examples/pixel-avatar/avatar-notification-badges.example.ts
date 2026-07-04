import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelAvatarComponent } from 'pixel-ui';

@Component({
  selector: 'docs-avatar-notification-badges-example',
  imports: [PixelAvatarComponent],
  templateUrl: './avatar-notification-badges.example.html',
  styleUrl: './avatar-notification-badges.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarNotificationBadgesExample {
  protected readonly badgeCounts = [1, 6, 10, 120];
}
