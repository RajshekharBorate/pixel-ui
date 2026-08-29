import { Injectable, signal } from '@angular/core';
import type { PixelAnalyticsEvent, PixelAnalyticsProvider } from 'pixel-analytics';

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
  .hint {
    margin: 0 0 0.75rem;
    font-size: 0.875rem;
    color: var(--pixel-sys-on-surface-variant, #44474e);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-block-end: 0.75rem;
  }
  .log {
    margin: 0;
    padding: 0.75rem;
    max-block-size: 16rem;
    overflow: auto;
    border: 1px solid var(--pixel-sys-border-soft, color-mix(in srgb, var(--pixel-sys-outline, #74777f) 22%, transparent));
    border-radius: var(--pixel-sys-shape-corner-medium, 0.75rem);
    background: var(--pixel-sys-surface-container, #eceef4);
    font-family: var(--pixel-sys-font-family-mono, ui-monospace, monospace);
    font-size: 0.75rem;
    line-height: 1.4;
  }
  .log__empty {
    margin: 0;
    color: var(--pixel-sys-on-surface-variant, #44474e);
  }
  .log__item {
    margin: 0 0 0.5rem;
  }
  .log__item:last-child {
    margin-block-end: 0;
  }
  .diag {
    margin: 0.75rem 0 0;
    font-size: 0.8125rem;
    color: var(--pixel-sys-on-surface-variant, #44474e);
  }
`;
