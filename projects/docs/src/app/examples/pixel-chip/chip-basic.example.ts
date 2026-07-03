import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelChipComponent } from 'pixel-ui';

@Component({
  selector: 'docs-chip-basic-example',
  standalone: true,
  imports: [PixelChipComponent],
  templateUrl: './chip-basic.example.html',
  styleUrl: './chip-basic.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipBasicExample {}
