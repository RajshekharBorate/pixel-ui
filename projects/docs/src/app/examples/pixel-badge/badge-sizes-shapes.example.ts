import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelBadgeComponent, type PixelBadgeShape, type PixelBadgeSize } from 'pixel-ui';

@Component({
  selector: 'docs-badge-sizes-shapes-example',
  imports: [PixelBadgeComponent],
  templateUrl: './badge-sizes-shapes.example.html',
  styleUrl: './badge-sizes-shapes.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeSizesShapesExample {
  protected readonly sizes: readonly PixelBadgeSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
  protected readonly shapes: readonly PixelBadgeShape[] = ['circle', 'pill'];
}
