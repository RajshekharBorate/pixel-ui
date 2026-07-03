import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelChipSetComponent, type PixelChipItem } from 'pixel-ui';

@Component({
  selector: 'docs-chip-disabled-readonly-example',
  standalone: true,
  imports: [PixelChipSetComponent],
  templateUrl: './chip-disabled-readonly.example.html',
  styleUrl: './chip-disabled-readonly.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipDisabledReadonlyExample {
  protected readonly chips = signal<readonly PixelChipItem[]>([
    { label: 'Disabled', value: 'disabled', type: 'default', disabled: true, removable: true },
    { label: 'Readonly', value: 'readonly', type: 'default', readonly: true, removable: true },
  ]);
}
