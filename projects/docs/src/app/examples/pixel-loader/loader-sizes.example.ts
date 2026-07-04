import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelLoaderComponent, type PixelLoaderSize } from 'pixel-ui';

@Component({
  selector: 'docs-loader-sizes-example',
  imports: [PixelLoaderComponent],
  templateUrl: './loader-sizes.example.html',
  styleUrl: './loader-sizes.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderSizesExample {
  protected readonly sizes: readonly PixelLoaderSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
}
