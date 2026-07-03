import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelBadgeComponent, PixelButtonComponent } from 'pixel-ui';

@Component({
  selector: 'docs-badge-icon-badges-example',
  standalone: true,
  imports: [PixelBadgeComponent, PixelButtonComponent],
  templateUrl: './badge-icon-badges.example.html',
  styleUrl: './badge-icon-badges.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeIconBadgesExample {}
