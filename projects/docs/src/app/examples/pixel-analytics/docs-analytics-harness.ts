import { Injectable, signal } from '@angular/core';
import type { PixelAnalyticsEvent, PixelAnalyticsProvider } from 'pixel-analytics';

/** Placeholders documented in expected envelope samples. */
export const DOCS_ANALYTICS_DYNAMIC_PLACEHOLDERS = {
  id: '<uuid>',
  timestamp: '<iso8601>',
  anonymousId: '<uuid>',
  sessionId: '<uuid>',
  traceId: '<32-char-hex>',
  spanId: '<16-char-hex>',
} as const;

/** Normalize volatile envelope fields — used only when comparing shapes, not live capture. */
export function normalizeDocsAnalyticsEventForDisplay(
  event: PixelAnalyticsEvent,
): Record<string, unknown> {
  const p = DOCS_ANALYTICS_DYNAMIC_PLACEHOLDERS;
  const normalized: Record<string, unknown> = {
    id: p.id,
    name: event.name,
    category: event.category,
    timestamp: p.timestamp,
    schemaVersion: event.schemaVersion,
    application: { ...event.application },
    identity: {
      ...event.identity,
      anonymousId: p.anonymousId,
      sessionId: p.sessionId,
    },
    context: {
      ...event.context,
      correlation: event.context.correlation
        ? {
            traceId: p.traceId,
            spanId: p.spanId,
            ...(event.context.correlation.requestId
              ? { requestId: event.context.correlation.requestId }
              : {}),
          }
        : { traceId: p.traceId, spanId: p.spanId },
      ...(event.context.page
        ? {
            page: {
              ...event.context.page,
              url: event.context.page.path ?? event.context.page.url ?? '<docs-path>',
              path: event.context.page.path ?? '<docs-path>',
            },
          }
        : {}),
    },
    meta: event.meta ? { ...event.meta } : undefined,
  };
  if (event.eventVersion) {
    normalized['eventVersion'] = event.eventVersion;
  }
  if (event.properties !== undefined) {
    normalized['properties'] = { ...event.properties };
  }
  return normalized;
}

/** Serialize a captured event for live docs output (real ids, timestamps, context). */
export function formatDocsAnalyticsEventJson(event: PixelAnalyticsEvent): string {
  return JSON.stringify(event, null, 2);
}

export function formatDocsAnalyticsSampleJson(sample: Record<string, unknown>): string {
  return JSON.stringify(sample, null, 2);
}

/** In-memory sink so docs examples can show a live event log. */
@Injectable()
export class DocsAnalyticsCaptureStore {
  readonly events = signal<readonly PixelAnalyticsEvent[]>([]);

  push(event: PixelAnalyticsEvent): void {
    this.events.update((list) => [event, ...list].slice(0, 40));
  }

  clear(): void {
    this.events.set([]);
  }
}

export function createDocsCaptureProvider(
  store: DocsAnalyticsCaptureStore,
): PixelAnalyticsProvider {
  return {
    id: 'docs-capture',
    track(event) {
      store.push(event);
    },
  };
}

export const DOCS_ANALYTICS_LOG_STYLES = `
  :host {
    display: block;
    min-inline-size: 0;
  }

  .docs-analytics-example {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-inline-size: 0;
    max-inline-size: 100%;
  }

  .docs-analytics-example__intro {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-inline-size: 0;
  }

  .hint {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.55;
    color: var(--pixel-sys-on-surface-variant, #44474e);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .diag {
    margin: 0;
    padding: 0.5rem 0.65rem;
    font-size: 0.8125rem;
    line-height: 1.45;
    color: var(--pixel-sys-on-surface-variant, #44474e);
    border-radius: var(--pixel-sys-shape-corner-small, 0.5rem);
    border: 1px solid color-mix(in srgb, var(--pixel-sys-outline, #74777f) 14%, transparent);
    background: color-mix(in srgb, var(--pixel-sys-surface-container, #eceef4) 65%, transparent);
    font-family: var(--pixel-sys-font-family-mono, ui-monospace, monospace);
    -webkit-user-select: text;
    user-select: text;
  }
`;
