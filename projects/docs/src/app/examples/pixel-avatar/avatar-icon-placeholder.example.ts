import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelAvatarComponent } from 'pixel-ui';

@Component({
  selector: 'docs-avatar-icon-placeholder-example',
  imports: [PixelAvatarComponent],
  templateUrl: './avatar-icon-placeholder.example.html',
  styleUrl: './avatar-icon-placeholder.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarIconPlaceholderExample {}
