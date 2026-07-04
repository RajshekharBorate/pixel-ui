import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelAvatarComponent } from 'pixel-ui';

@Component({
  selector: 'docs-avatar-loading-fallback-example',
  imports: [PixelAvatarComponent],
  templateUrl: './avatar-loading-fallback.example.html',
  styleUrl: './avatar-loading-fallback.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarLoadingFallbackExample {}
