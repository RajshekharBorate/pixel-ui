import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  PixelChipSetComponent,
  type PixelChipItem,
  type PixelChipReorderEvent,
} from 'pixel-ui';

@Component({
  selector: 'docs-chip-reorderable-example',
  standalone: true,
  imports: [PixelChipSetComponent],
  templateUrl: './chip-reorderable.example.html',
  styleUrl: './chip-reorderable.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipReorderableExample {
  protected readonly chips = signal<readonly PixelChipItem[]>([
    { label: 'Backlog', value: 'backlog', type: 'choice', removable: true },
    { label: 'In progress', value: 'in-progress', type: 'choice', removable: true },
    { label: 'Review', value: 'review', type: 'choice', removable: true },
    { label: 'Done', value: 'done', type: 'choice', removable: true },
  ]);

  protected readonly orderSummary = computed(() =>
    this.chips()
      .map((chip) => chip.label)
      .join(' → '),
  );

  protected onReorder(_event: PixelChipReorderEvent): void {
    // Order is reflected via valueChange on the chip set.
  }
}
