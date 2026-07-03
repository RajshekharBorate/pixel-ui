import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent, PixelLoadingContainerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-loader-fullscreen-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelLoadingContainerComponent],
  templateUrl: './loader-fullscreen.example.html',
  styleUrl: './loader-fullscreen.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderFullscreenExample {
  protected readonly loading = signal(false);

  protected runFullscreen(): void {
    this.loading.set(true);
    window.setTimeout(() => this.loading.set(false), 2000);
  }
}
