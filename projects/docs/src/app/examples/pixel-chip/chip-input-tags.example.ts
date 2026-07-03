import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelChipSetComponent, type PixelChipItem } from 'pixel-ui';

@Component({
  selector: 'docs-chip-input-tags-example',
  standalone: true,
  imports: [PixelChipSetComponent],
  templateUrl: './chip-input-tags.example.html',
  styleUrl: './chip-input-tags.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipInputTagsExample {
  protected readonly tags = signal<readonly PixelChipItem[]>([
    { label: 'Angular', value: 'angular', type: 'input', removable: true },
    { label: 'Signals', value: 'signals', type: 'input', removable: true },
  ]);
}
