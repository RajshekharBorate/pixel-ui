import { signal } from '@angular/core';
import type { PixelAnalyticsDiagnostics } from '../core/analytics.types';

export class PixelAnalyticsDiagnosticsStore {
  private readonly state = signal<PixelAnalyticsDiagnostics>({
    eventsCreated: 0,
    eventsQueued: 0,
    eventsSent: 0,
    eventsDropped: 0,
    eventsSampledOut: 0,
    providerFailures: 0,
    retryCount: 0,
    queueSize: 0,
    lastFlushDurationMs: 0,
  });

  readonly diagnostics = this.state.asReadonly();

  increment(field: keyof PixelAnalyticsDiagnostics, by = 1): void {
    this.state.update((current) => ({ ...current, [field]: current[field] + by }));
  }

  set(field: keyof PixelAnalyticsDiagnostics, value: number): void {
    this.state.update((current) => ({ ...current, [field]: value }));
  }
}
