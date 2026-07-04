import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent, PixelLoaderComponent } from 'pixel-ui';

@Component({
  selector: 'docs-loader-anti-flash-example',
  imports: [PixelLoaderComponent, PixelButtonComponent],
  templateUrl: './loader-anti-flash.example.html',
  styleUrl: './loader-anti-flash.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderAntiFlashExample {
  protected readonly loading = signal(false);

  protected runFast(): void {
    this.loading.set(true);
    window.setTimeout(() => this.loading.set(false), 150);
  }
}
