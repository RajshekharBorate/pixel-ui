import { InjectionToken } from '@angular/core';

/**
 * Minimal analytics port for Pixel UI components. Keeps `pixel-ui` free of a hard dependency
 * on `pixel-analytics`. Applications bridge the two packages:
 *
 * ```ts
 * import { PIXEL_UI_ANALYTICS } from 'pixel-ui';
 * import { PixelAnalyticsService, createPixelUiAnalyticsPort } from 'pixel-analytics';
 *
 * {
 *   provide: PIXEL_UI_ANALYTICS,
 *   useFactory: (analytics: PixelAnalyticsService) => createPixelUiAnalyticsPort(analytics),
 *   deps: [PixelAnalyticsService],
 * }
 * ```
 */
export interface PixelUiAnalyticsTrackInput {
  readonly name: string;
  readonly properties?: Record<string, unknown>;
  readonly component?: {
    readonly name?: string;
    readonly version?: string;
    readonly instanceId?: string;
  };
  readonly context?: {
    readonly correlation?: {
      readonly traceId?: string;
      readonly spanId?: string;
      readonly parentSpanId?: string;
    };
  };
}

export interface PixelUiAnalyticsInteractionHandle {
  end(): void;
}

export interface PixelUiAnalyticsPort {
  track(input: PixelUiAnalyticsTrackInput): void;
  /** Opens a shared `traceId` scope for related UI events (e.g. menu open → select → export). */
  beginInteraction?(name: string): PixelUiAnalyticsInteractionHandle;
}

export const PIXEL_UI_ANALYTICS = new InjectionToken<PixelUiAnalyticsPort>('PIXEL_UI_ANALYTICS');

/** Fire-and-forget track — never throws into component logic. */
export function trackPixelUiAnalytics(
  port: PixelUiAnalyticsPort | null | undefined,
  input: PixelUiAnalyticsTrackInput,
): void {
  if (!port) {
    return;
  }
  try {
    port.track({
      name: input.name,
      properties: input.properties,
      component: input.component,
      context: input.context,
    });
  } catch {
    // Analytics must never break the host component.
  }
}

/**
 * Convenience emitter for Pixel UI hosts: merges extras, then freezes reserved keys last.
 */
export function emitPixelUiAnalytics(
  port: PixelUiAnalyticsPort | null | undefined,
  options: {
    readonly name: string;
    readonly component: string;
    readonly extras?: Record<string, unknown>;
    readonly reserved?: Record<string, unknown>;
    readonly context?: PixelUiAnalyticsTrackInput['context'];
    readonly disabled?: boolean;
  },
): void {
  if (options.disabled) {
    return;
  }
  trackPixelUiAnalytics(port, {
    name: options.name,
    component: { name: options.component },
    context: options.context,
    properties: {
      ...(options.extras ?? {}),
      ...(options.reserved ?? {}),
    },
  });
}

/**
 * Path-only href for analytics: strips query/hash. Absolute URLs keep pathname only.
 * Returns undefined when empty or unparseable.
 */
export function analyticsPathOnly(href: string | null | undefined): string | undefined {
  const raw = href?.trim();
  if (!raw) {
    return undefined;
  }
  try {
    if (/^https?:\/\//i.test(raw)) {
      return new URL(raw).pathname || undefined;
    }
  } catch {
    return undefined;
  }
  const q = raw.indexOf('?');
  const h = raw.indexOf('#');
  let end = raw.length;
  if (q >= 0) {
    end = Math.min(end, q);
  }
  if (h >= 0) {
    end = Math.min(end, h);
  }
  const path = raw.slice(0, end).trim();
  return path || undefined;
}

/** Coarse mime bucket for file analytics — never the raw type string if it embeds names. */
export function analyticsMimeCategory(mimeType: string | null | undefined): string {
  const t = (mimeType ?? '').toLowerCase();
  if (t.startsWith('image/')) {
    return 'image';
  }
  if (t.startsWith('video/')) {
    return 'video';
  }
  if (t.startsWith('audio/')) {
    return 'audio';
  }
  if (t === 'application/pdf' || t.includes('pdf')) {
    return 'pdf';
  }
  if (
    t.includes('spreadsheet') ||
    t.includes('excel') ||
    t === 'text/csv' ||
    t.includes('csv')
  ) {
    return 'spreadsheet';
  }
  if (t.includes('word') || t.includes('document') || t === 'text/plain') {
    return 'document';
  }
  if (t.startsWith('text/')) {
    return 'text';
  }
  return t ? 'other' : 'unknown';
}

/** Size bucket for file analytics (bytes). */
export function analyticsSizeBucket(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return 'unknown';
  }
  if (bytes < 100_000) {
    return 'lt_100kb';
  }
  if (bytes < 1_000_000) {
    return 'lt_1mb';
  }
  if (bytes < 10_000_000) {
    return 'lt_10mb';
  }
  return 'gte_10mb';
}

/** YYYY-MM-DD from a Date (local calendar day). */
export function analyticsIsoDate(value: Date | null | undefined): string | undefined {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return undefined;
  }
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
