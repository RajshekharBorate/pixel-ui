import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelProgressBarComponent } from 'pixel-ui';

@Component({
  selector: 'docs-progress-indeterminate-example',
  imports: [PixelProgressBarComponent],
  templateUrl: './progress-indeterminate.example.html',
  styleUrl: './progress-indeterminate.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressIndeterminateExample {}
