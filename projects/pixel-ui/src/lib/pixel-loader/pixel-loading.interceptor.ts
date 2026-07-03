import { InjectionToken, inject } from '@angular/core';
import {
  HttpEventType,
  type HttpEvent,
  type HttpHandlerFn,
  type HttpInterceptorFn,
  type HttpRequest,
} from '@angular/common/http';
import { finalize, tap } from 'rxjs/operators';
import { PixelLoadingService } from './pixel-loading.service';

/** Configuration for {@link pixelLoadingInterceptor}, provided via {@link PIXEL_LOADING_CONFIG}. */
export interface PixelLoadingInterceptorConfig {
  /**
   * Request URLs (substring or RegExp) that should NOT trigger the global loader — e.g.
   * polling/telemetry endpoints. Defaults to `[]`.
   */
  readonly exclude?: readonly (string | RegExp)[];
  /**
   * Custom HTTP header that, when present and truthy, suppresses the loader for that single
   * request (the header is informational only and not stripped). Defaults to
   * `'X-Pixel-Skip-Loading'`.
   */
  readonly skipHeader?: string;
  /** Scope label applied to tracked requests (default `'http'`). */
  readonly scope?: string;
  /** Track upload/download progress as determinate loading. Default `true`. */
  readonly trackProgress?: boolean;
}

/** DI token supplying {@link PixelLoadingInterceptorConfig}. */
export const PIXEL_LOADING_CONFIG = new InjectionToken<PixelLoadingInterceptorConfig>(
  'PIXEL_LOADING_CONFIG',
  { factory: () => ({}) },
);

const DEFAULT_SKIP_HEADER = 'X-Pixel-Skip-Loading';

function isExcluded(url: string, patterns: readonly (string | RegExp)[]): boolean {
  return patterns.some((pattern) =>
    typeof pattern === 'string' ? url.includes(pattern) : pattern.test(url),
  );
}

/**
 * Functional HTTP interceptor that drives {@link PixelLoadingService} automatically for every
 * outgoing request — show on send, hide on completion/error — and forwards upload/download
 * progress as determinate loading. Register it with `provideHttpClient(withInterceptors([…]))`:
 *
 * ```ts
 * import { provideHttpClient, withInterceptors } from '@angular/common/http';
 * import { pixelLoadingInterceptor, PIXEL_LOADING_CONFIG } from 'pixel-ui';
 *
 * bootstrapApplication(App, {
 *   providers: [
 *     provideHttpClient(withInterceptors([pixelLoadingInterceptor])),
 *     { provide: PIXEL_LOADING_CONFIG, useValue: { exclude: ['/api/heartbeat'] } },
 *   ],
 * });
 * ```
 *
 * Per-request opt-out: add the configured skip header
 * (`req.clone({ setHeaders: { 'X-Pixel-Skip-Loading': '1' } })`).
 */
export const pixelLoadingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const loading = inject(PixelLoadingService);
  const config = inject(PIXEL_LOADING_CONFIG);

  const skipHeader = config.skipHeader ?? DEFAULT_SKIP_HEADER;
  const exclude = config.exclude ?? [];
  const scope = config.scope ?? 'http';
  const trackProgress = config.trackProgress ?? true;

  if (req.headers.has(skipHeader) || isExcluded(req.urlWithParams, exclude)) {
    return next(req);
  }

  const id = loading.start({ message: undefined, scope }, `http:${req.method}:${req.urlWithParams}:${Math.random()}`);

  return next(req).pipe(
    tap((event: HttpEvent<unknown>) => {
      if (!trackProgress) {
        return;
      }
      if (event.type === HttpEventType.UploadProgress && event.total) {
        loading.setProgress(id, (event.loaded / event.total) * 100);
      } else if (event.type === HttpEventType.DownloadProgress && event.total) {
        loading.setProgress(id, (event.loaded / event.total) * 100);
      }
    }),
    finalize(() => loading.stop(id)),
  );
};
