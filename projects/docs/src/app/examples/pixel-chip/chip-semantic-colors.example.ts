import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelChipComponent, type PixelChipSemantic, type PixelChipVariant } from 'pixel-ui';

@Component({
  selector: 'docs-chip-semantic-colors-example',
  standalone: true,
  imports: [PixelChipComponent],
  templateUrl: './chip-semantic-colors.example.html',
  styleUrl: './chip-semantic-colors.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipSemanticColorsExample {
  protected readonly variants: readonly PixelChipVariant[] = ['soft', 'solid', 'outline'];
  protected readonly semantics: readonly { semantic: PixelChipSemantic; label: string; icon: string }[] = [
    { semantic: 'success', label: 'Success', icon: 'check_circle' },
    { semantic: 'error', label: 'Error', icon: 'error' },
    { semantic: 'warning', label: 'Warning', icon: 'warning' },
    { semantic: 'info', label: 'Info', icon: 'info' },
  ];
}
