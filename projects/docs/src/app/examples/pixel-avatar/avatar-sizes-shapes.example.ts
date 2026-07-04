import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelAvatarComponent, type PixelAvatarShape, type PixelAvatarSize } from 'pixel-ui';

@Component({
  selector: 'docs-avatar-sizes-shapes-example',
  imports: [PixelAvatarComponent],
  templateUrl: './avatar-sizes-shapes.example.html',
  styleUrl: './avatar-sizes-shapes.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarSizesShapesExample {
  protected readonly sizes: readonly PixelAvatarSize[] = ['xs', 'sm', 'md', 'lg'];
  protected readonly shapes: readonly PixelAvatarShape[] = ['circle', 'rounded'];
}
