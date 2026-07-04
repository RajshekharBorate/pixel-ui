import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelProgressBarComponent } from 'pixel-ui';

@Component({
  selector: 'docs-progress-variants-example',
  imports: [PixelProgressBarComponent],
  templateUrl: './progress-variants.example.html',
  styleUrl: './progress-variants.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressVariantsExample {}
