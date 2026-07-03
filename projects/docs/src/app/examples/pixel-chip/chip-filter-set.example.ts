import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelChipSetComponent, type PixelChipItem } from 'pixel-ui';

@Component({
  selector: 'docs-chip-filter-set-example',
  standalone: true,
  imports: [PixelChipSetComponent],
  templateUrl: './chip-filter-set.example.html',
  styleUrl: './chip-filter-set.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipFilterSetExample {
  protected readonly filters = signal<readonly PixelChipItem[]>([
    { label: 'Open', value: 'open', type: 'filter', selected: true, removable: true },
    { label: 'Assigned', value: 'assigned', type: 'filter', selected: true, removable: true },
    { label: 'Blocked', value: 'blocked', type: 'filter', removable: true, semantic: 'warning' },
    { label: 'Escalated', value: 'escalated', type: 'filter', removable: true, semantic: 'error' },
  ]);
}
