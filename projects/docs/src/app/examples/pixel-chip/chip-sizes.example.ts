import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelChipComponent, type PixelChipSize } from 'pixel-ui';

@Component({
  selector: 'docs-chip-sizes-example',
  standalone: true,
  imports: [PixelChipComponent],
  templateUrl: './chip-sizes.example.html',
  styleUrl: './chip-sizes.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipSizesExample {
  protected readonly sizes: readonly PixelChipSize[] = ['xs', 'sm', 'md', 'lg'];
}
