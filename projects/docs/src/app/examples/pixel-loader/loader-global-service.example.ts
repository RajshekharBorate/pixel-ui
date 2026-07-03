import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PixelButtonComponent, PixelLoaderComponent, PixelLoadingService } from 'pixel-ui';

@Component({
  selector: 'docs-loader-global-service-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelLoaderComponent],
  templateUrl: './loader-global-service.example.html',
  styleUrl: './loader-global-service.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderGlobalServiceExample {
  private readonly loadingService = inject(PixelLoadingService);

  protected readonly globalActive = this.loadingService.active;
  protected readonly globalCount = this.loadingService.count;

  protected runGlobal(): void {
    const id = this.loadingService.start({ message: 'Working…', scope: 'demo' });
    window.setTimeout(() => this.loadingService.stop(id), 1800);
  }
}
