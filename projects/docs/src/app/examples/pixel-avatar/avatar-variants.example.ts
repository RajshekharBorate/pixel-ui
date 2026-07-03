import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelAvatarComponent, type PixelAvatarVariant } from 'pixel-ui';

@Component({
  selector: 'docs-avatar-variants-example',
  standalone: true,
  imports: [PixelAvatarComponent],
  templateUrl: './avatar-variants.example.html',
  styleUrl: './avatar-variants.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarVariantsExample {
  protected readonly variants: readonly PixelAvatarVariant[] = ['soft', 'solid', 'outline'];
}
