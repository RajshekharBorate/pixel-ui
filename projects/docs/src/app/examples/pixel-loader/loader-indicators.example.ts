import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelLoaderComponent, type PixelLoaderType } from 'pixel-ui';

@Component({
  selector: 'docs-loader-indicators-example',
  imports: [PixelLoaderComponent],
  templateUrl: './loader-indicators.example.html',
  styleUrl: './loader-indicators.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderIndicatorsExample {
  protected readonly indicators: readonly { type: PixelLoaderType; label: string }[] = [
    { type: 'spinner', label: 'Spinner' },
    { type: 'ring', label: 'Ring' },
    { type: 'dots', label: 'Dots' },
    { type: 'pulse', label: 'Pulse' },
    { type: 'bounce', label: 'Bounce' },
    { type: 'wave', label: 'Wave' },
    { type: 'bars', label: 'Bars' },
  ];
}
