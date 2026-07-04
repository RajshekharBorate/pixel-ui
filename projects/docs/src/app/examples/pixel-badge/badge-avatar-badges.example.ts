import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelAvatarComponent, PixelBadgeComponent } from 'pixel-ui';

@Component({
  selector: 'docs-badge-avatar-badges-example',
  imports: [PixelAvatarComponent, PixelBadgeComponent],
  templateUrl: './badge-avatar-badges.example.html',
  styleUrl: './badge-avatar-badges.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeAvatarBadgesExample {}
