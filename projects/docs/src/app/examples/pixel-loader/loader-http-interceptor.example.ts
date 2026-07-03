import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PixelButtonComponent, PixelLoaderComponent, PixelLoadingService } from 'pixel-ui';

/**
 * Live stand-in for HTTP-driven loading: the real app wires
 * `provideHttpClient(withInterceptors([pixelLoadingInterceptor]))` once in `app.config.ts`.
 * This example simulates an HTTP-scoped task via {@link PixelLoadingService}.
 */
@Component({
  selector: 'docs-loader-http-interceptor-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelLoaderComponent],
  templateUrl: './loader-http-interceptor.example.html',
  styleUrl: './loader-http-interceptor.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderHttpInterceptorExample {
  private readonly loadingService = inject(PixelLoadingService);

  protected readonly httpLoading = () => this.loadingService.isLoading('http');

  protected simulateHttp(): void {
    const id = this.loadingService.start({ message: 'Fetching data…', scope: 'http' });
    window.setTimeout(() => this.loadingService.stop(id), 1600);
  }
}
