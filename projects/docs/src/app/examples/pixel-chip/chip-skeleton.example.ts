import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelCheckboxComponent, PixelChipSetComponent, type PixelChipItem } from 'pixel-ui';

@Component({
  selector: 'docs-chip-skeleton-example',
  standalone: true,
  imports: [PixelChipSetComponent, PixelCheckboxComponent],
  templateUrl: './chip-skeleton.example.html',
  styleUrl: './chip-skeleton.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipSkeletonExample {
  protected readonly skeleton = signal(true);

  protected readonly chips: readonly PixelChipItem[] = [
    { label: 'Design' },
    { label: 'Engineering' },
    { label: 'Product' },
    { label: 'Marketing' },
  ];
}
