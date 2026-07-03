import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent, PixelLoadingContainerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-loader-section-overlay-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelLoadingContainerComponent],
  templateUrl: './loader-section-overlay.example.html',
  styleUrl: './loader-section-overlay.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderSectionOverlayExample {
  protected readonly loading = signal(false);

  protected runSection(): void {
    this.loading.set(true);
    window.setTimeout(() => this.loading.set(false), 2000);
  }
}
