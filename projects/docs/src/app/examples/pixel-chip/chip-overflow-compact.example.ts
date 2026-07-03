import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelChipSetComponent, type PixelChipItem } from 'pixel-ui';

@Component({
  selector: 'docs-chip-overflow-compact-example',
  standalone: true,
  imports: [PixelChipSetComponent],
  templateUrl: './chip-overflow-compact.example.html',
  styleUrl: './chip-overflow-compact.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipOverflowCompactExample {
  protected readonly overflow = signal<readonly PixelChipItem[]>([
    { label: 'Payments', value: 'payments', type: 'filter', removable: true },
    { label: 'Billing', value: 'billing', type: 'filter', removable: true },
    { label: 'Compliance', value: 'compliance', type: 'filter', removable: true },
    { label: 'Platform', value: 'platform', type: 'filter', removable: true },
    { label: 'Security', value: 'security', type: 'filter', removable: true },
    { label: 'Support', value: 'support', type: 'filter', removable: true },
  ]);

  protected readonly compact = signal<readonly PixelChipItem[]>([
    { label: 'P0', value: 'p0', type: 'default', semantic: 'error', variant: 'outline' },
    { label: 'P1', value: 'p1', type: 'default', semantic: 'warning', variant: 'outline' },
    { label: 'P2', value: 'p2', type: 'default', semantic: 'success', variant: 'outline' },
  ]);
}
