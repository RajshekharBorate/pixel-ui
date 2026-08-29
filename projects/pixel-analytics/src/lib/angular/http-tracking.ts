import {
  EnvironmentProviders,
  InjectionToken,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import {
  HttpErrorResponse,
  type HttpHandlerFn,
  type HttpInterceptorFn,
  type HttpRequest,
  type HttpResponse,
} from '@angular/common/http';
import { catchError, tap, throwError } from 'rxjs';
import { PixelAnalyticsService } from '../core/analytics.service';
import { PIXEL_ANALYTICS_RESOLVED_CONFIG } from '../core/analytics.tokens';
import { sanitizeAnalyticsUrl } from '../privacy/sanitizer';

export interface PixelAnalyticsHttpTrackingOptions {
  /**
   * When true, records `hasBody: true` if the request has a body — never the body itself.
   * @default false
   */
  readonly captureBodyPresence?: boolean;
  /** @deprecated Use {@link captureBodyPresence}. */
  readonly captureBody?: boolean;
  /** @default false — never capture headers by default */
  readonly captureHeaders?: boolean;
  /** @default false — emit successful request metadata */
  readonly captureSuccess?: boolean;
  /** @default true — emit failed request metadata */
  readonly captureErrors?: boolean;
  /** URL substrings/regexes to skip (analytics endpoint is always skipped). */
  readonly exclude?: readonly (string | RegExp)[];
  /** Header that opts a single request out. @default 'X-Pixel-Skip-Analytics' */
  readonly skipHeader?: string;
}

export const PIXEL_ANALYTICS_HTTP_TRACKING =
  new InjectionToken<PixelAnalyticsHttpTrackingOptions>('PIXEL_ANALYTICS_HTTP_TRACKING', {
    factory: () => ({}),
  });

const DEFAULT_SKIP_HEADER = 'X-Pixel-Skip-Analytics';

function isExcluded(url: string, patterns: readonly (string | RegExp)[]): boolean {
  return patterns.some((pattern) =>
    typeof pattern === 'string' ? url.includes(pattern) : pattern.test(url),
  );
}

function sanitizePath(url: string, allowQuery: boolean, stripHash: boolean): string {
  try {
    const parsed = new URL(url, 'http://localhost');
    let path = allowQuery ? `${parsed.pathname}${parsed.search}` : parsed.pathname;
    if (stripHash) {
      path = path.split('#')[0] ?? path;
    }
    return path;
  } catch {
    return url.split('?')[0]?.split('#')[0] ?? url;
  }
}

/**
 * Opt-in HTTP interceptor config. Privacy-preserving defaults: no bodies, no headers,
 * errors only unless `captureSuccess` is enabled.
 *
 * Pair with {@link pixelAnalyticsHttpInterceptor}:
 *
 * ```ts
 * provideHttpClient(withInterceptors([pixelAnalyticsHttpInterceptor])),
 * withHttpTracking({ captureSuccess: false, captureErrors: true }),
 * ```
 */
export function withHttpTracking(
  options: PixelAnalyticsHttpTrackingOptions = {},
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: PIXEL_ANALYTICS_HTTP_TRACKING, useValue: options },
  ]);
}

/**
 * Functional interceptor that records API latency / failures without capturing payloads.
 * Automatically skips the analytics ingest endpoint to avoid recursive telemetry.
 */
export const pixelAnalyticsHttpInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const analytics = inject(PixelAnalyticsService, { optional: true });
  const resolved = inject(PIXEL_ANALYTICS_RESOLVED_CONFIG, { optional: true });
  const options = inject(PIXEL_ANALYTICS_HTTP_TRACKING);
  if (!analytics || !resolved) {
    return next(req);
  }

  const skipHeader = options.skipHeader ?? DEFAULT_SKIP_HEADER;
  const exclude = [
    ...(options.exclude ?? []),
    ...(resolved.http?.endpoint ? [resolved.http.endpoint] : []),
  ];

  if (req.headers.has(skipHeader) || isExcluded(req.urlWithParams, exclude)) {
    return next(req);
  }

  const started = performance.now?.() ?? Date.now();
  const captureSuccess = options.captureSuccess ?? false;
  const captureErrors = options.captureErrors ?? true;
  const allowQuery = resolved.privacy.allowQueryParams;
  const path = sanitizePath(req.url, allowQuery, resolved.privacy.stripUrlHash);

  const baseProps = (): Record<string, unknown> => {
    const props: Record<string, unknown> = {
      method: req.method,
      path,
      durationMs: Math.round((performance.now?.() ?? Date.now()) - started),
    };
    if (options.captureHeaders) {
      props['headerNames'] = req.headers.keys().slice(0, 20);
    }
    if ((options.captureBodyPresence ?? options.captureBody) && req.body != null) {
      props['hasBody'] = true;
    }
    return props;
  };

  return next(req).pipe(
    tap((event) => {
      if (!captureSuccess || !('status' in event) || event.status === 0) {
        return;
      }
      const response = event as HttpResponse<unknown>;
      try {
        analytics.track({
          name: 'api.request',
          category: 'application',
          properties: {
            ...baseProps(),
            status: response.status,
            ok: response.ok,
            url: sanitizeAnalyticsUrl(req.urlWithParams, resolved),
          },
        });
      } catch {
        // never break HTTP
      }
    }),
    catchError((error: unknown) => {
      if (captureErrors) {
        try {
          const status = error instanceof HttpErrorResponse ? error.status : 0;
          analytics.track({
            name: 'api.error',
            category: 'application',
            properties: {
              ...baseProps(),
              status,
              statusText:
                error instanceof HttpErrorResponse
                  ? error.statusText?.slice(0, resolved.privacy.maxStringLength)
                  : undefined,
            },
          });
        } catch {
          // never break HTTP
        }
      }
      return throwError(() => error);
    }),
  );
};
