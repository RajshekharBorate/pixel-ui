import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelChipSetComponent, type PixelChipItem } from 'pixel-ui';

@Component({
  selector: 'docs-chip-selectable-example',
  imports: [PixelChipSetComponent],
  templateUrl: './chip-selectable.example.html',
  styleUrl: './chip-selectable.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipSelectableExample {
  protected readonly selectable = signal<readonly PixelChipItem[]>([
    { label: 'Design', value: 'design', type: 'selectable' },
    { label: 'Engineering', value: 'engineering', type: 'selectable' },
    { label: 'Support', value: 'support', type: 'selectable' },
  ]);
}
