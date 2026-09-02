import {
  DestroyRef,
  Injectable,
  inject,
  signal,
  type Signal,
} from '@angular/core';
import {
  PIXEL_ANALYTICS_PROVIDERS,
  PIXEL_ANALYTICS_RESOLVED_CONFIG,
  PIXEL_ANALYTICS_SDK_NAME,
  PIXEL_ANALYTICS_SDK_VERSION,
} from '../core/analytics.tokens';
import { PIXEL_ANALYTICS_SCHEMA_VERSION } from '../core/analytics.types';
import type {
  PixelAnalyticsConsentState,
  PixelAnalyticsDiagnostics,
  PixelAnalyticsErrorContext,
  PixelAnalyticsEvent,
  PixelAnalyticsEventContext,
  PixelAnalyticsGroupInput,
  PixelAnalyticsIdentifyInput,
  PixelAnalyticsPageInput,
  PixelAnalyticsPerformanceInput,
  PixelAnalyticsTrackInput,
} from '../core/analytics.types';
import { createAnalyticsId, isBrowser, safeJsonByteLength } from '../core/analytics.utils';
import { PixelAnalyticsContextService } from '../context/context.service';
import {
  PixelAnalyticsInteractionService,
  type PixelAnalyticsInteractionHandle,
} from '../context/interaction.service';
import { PixelAnalyticsDiagnosticsStore } from '../diagnostics/diagnostics.store';
import {
  PIXEL_ANALYTICS_REGISTRY,
  inferPixelAnalyticsCategory,
  type PixelAnalyticsRegistry,
} from '../events/event-registry';
import { PixelAnalyticsIdentityService } from '../identity/identity.service';
import { isSampledOut, validateAnalyticsEvent } from '../pipeline/validator';
import { PixelAnalyticsConsentService } from '../privacy/consent.service';
import {
  sanitizeAnalyticsProperties,
  sanitizeAnalyticsUrl,
  sanitizeErrorMessage,
} from '../privacy/sanitizer';
import { splitAnalyticsBatch } from '../queue/batcher';
import { PixelAnalyticsEventQueue } from '../queue/event-queue';
import { withAnalyticsRetry } from '../queue/retry';
import { PixelAnalyticsProviderRouter } from '../providers/analytics-provider';

/**
 * Vendor-neutral analytics facade. Pipeline order:
 * enabled → consent → sample → sanitize → validate → queue → batch.
 * Failures are recorded in diagnostics and never thrown to callers.
 */
@Injectable()
export class PixelAnalyticsService {
  private readonly config = inject(PIXEL_ANALYTICS_RESOLVED_CONFIG);
  private readonly providers = inject(PIXEL_ANALYTICS_PROVIDERS);
  private readonly registry = inject(PIXEL_ANALYTICS_REGISTRY);
  private readonly destroyRef = inject(DestroyRef);
  private readonly identity = inject(PixelAnalyticsIdentityService);
  private readonly context = inject(PixelAnalyticsContextService);
  private readonly interactions = inject(PixelAnalyticsInteractionService);
  private readonly consentService = inject(PixelAnalyticsConsentService);
  private readonly diagnosticsStore = new PixelAnalyticsDiagnosticsStore();
  private readonly router = new PixelAnalyticsProviderRouter(this.providers);

  private readonly enabledState = signal(this.config.enabled);
  private readonly queue = new PixelAnalyticsEventQueue(this.config);
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private initialized = false;
  private readonly trackQueue: PixelAnalyticsTrackInput[] = [];
  private drainingTracks = false;
  private flushing = false;

  readonly diagnostics: Signal<PixelAnalyticsDiagnostics> = this.diagnosticsStore.diagnostics;

  constructor() {
    this.bootstrap();
    this.destroyRef.onDestroy(() => {
      void this.shutdown();
    });
  }

  track(input: PixelAnalyticsTrackInput): void {
    this.trackQueue.push(input);
    void this.drainTrackQueue();
  }

  private async drainTrackQueue(): Promise<void> {
    if (this.drainingTracks) {
      return;
    }
    this.drainingTracks = true;
    try {
      while (this.trackQueue.length > 0) {
        const next = this.trackQueue.shift();
        if (!next) {
          break;
        }
        try {
          await this.processTrack(next);
        } catch {
          this.diagnosticsStore.increment('eventsDropped');
        }
      }
    } finally {
      this.drainingTracks = false;
      if (this.trackQueue.length > 0) {
        void this.drainTrackQueue();
      }
    }
  }

  page(input: PixelAnalyticsPageInput = {}): void {
    this.track({
      name: input.name ?? 'navigation.page.view',
      category: input.category ?? 'navigation',
      properties: input.properties,
      context: {
        page: this.context.buildPageContext(input.context?.page, {
          allowQueryParams: this.config.privacy.allowQueryParams,
          stripUrlHash: this.config.privacy.stripUrlHash,
        }),
        ...input.context,
      },
    });
  }

  identify(input: PixelAnalyticsIdentifyInput): void {
    try {
      if (!this.consentService.allowsIdentifiedTracking(this.config)) {
        return;
      }
      this.identity.identify(input.userId);
      void this.router.identify(input);
      this.track({
        name: 'identity.user.identify',
        category: 'application',
        properties: {
          userId: input.userId,
          ...(input.traits ?? {}),
        },
      });
    } catch {
      this.diagnosticsStore.increment('providerFailures');
    }
  }

  group(input: PixelAnalyticsGroupInput): void {
    try {
      if (!this.consentService.allowsIdentifiedTracking(this.config)) {
        return;
      }
      this.identity.group(input.groupId);
      this.track({
        name: 'identity.group.identify',
        category: 'application',
        properties: {
          groupId: input.groupId,
          ...(input.traits ?? {}),
        },
      });
    } catch {
      this.diagnosticsStore.increment('providerFailures');
    }
  }

  reset(): void {
    this.identity.reset();
  }

  setContext(patch: Partial<PixelAnalyticsEventContext>): void {
    this.context.setContext(patch);
  }

  /** Sets the active app domain entity on the shared analytics context. */
  setEntity(entity: PixelAnalyticsEventContext['entity']): void {
    if (entity) {
      this.context.setContext({ entity });
    } else {
      this.context.clearEntity();
    }
  }

  clearEntity(): void {
    this.context.clearEntity();
  }

  beginInteraction(name: string): PixelAnalyticsInteractionHandle {
    return this.interactions.begin(name);
  }

  runInInteraction<T>(name: string, fn: () => T): T {
    return this.interactions.runInInteraction(name, fn);
  }

  /** @internal Used by the Pixel UI bridge to merge active interaction correlation. */
  interactionCorrelationForEvent(
    explicit?: Partial<PixelAnalyticsEventContext['correlation']>,
  ): PixelAnalyticsEventContext['correlation'] | undefined {
    return this.interactions.correlationForNextEvent(explicit);
  }

  setConsent(state: PixelAnalyticsConsentState): void {
    const previous = this.consentService.consent();
    this.consentService.setConsent(state);

    if (state === 'granted') {
      this.identity.persist(this.config.session.idleTimeoutMs);
      if (previous !== 'granted') {
        const released = this.queue.releasePending(this.config.consent.pendingQueueLimit);
        if (released.dropped > 0) {
          this.diagnosticsStore.increment('eventsDropped', released.dropped);
        }
        void this.flush();
      }
      return;
    }

    if (state === 'denied') {
      this.identity.clearPersisted();
      if (this.config.consent.onRevoke === 'stop-and-flush') {
        this.queue.clearPending();
        void this.flush().then(() => {
          this.queue.clear();
          this.diagnosticsStore.set('queueSize', 0);
        });
        return;
      }
      // Default `stop`: drop pending + main queue; do not deliver after revoke.
      const dropped = this.queue.size() + this.queue.pendingSize();
      this.queue.clear();
      if (dropped > 0) {
        this.diagnosticsStore.increment('eventsDropped', dropped);
      }
      this.diagnosticsStore.set('queueSize', 0);
    }
  }

  trackError(error: unknown, context: PixelAnalyticsErrorContext = {}): void {
    const raw = error instanceof Error ? error.message : String(error);
    const name = error instanceof Error ? error.name : 'Error';
    this.track({
      name: 'application.error',
      category: 'application',
      properties: {
        message: sanitizeErrorMessage(raw, this.config.privacy.maxStringLength),
        name,
        handled: context.handled ?? false,
        component: context.component,
        ...context.properties,
      },
    });
  }

  trackPerformance(input: PixelAnalyticsPerformanceInput): void {
    this.track({
      name: 'performance.custom',
      category: 'performance',
      properties: {
        measurement: input.name,
        durationMs: input.durationMs,
        ...input.properties,
      },
    });
  }

  enable(): void {
    this.enabledState.set(true);
  }

  disable(): void {
    this.enabledState.set(false);
  }

  async flush(options?: { urgent?: boolean }): Promise<void> {
    if (!this.enabledState() || this.flushing) {
      return;
    }
    if (
      this.config.consent.required &&
      this.consentService.consent() === 'denied' &&
      this.config.consent.onRevoke !== 'stop-and-flush'
    ) {
      return;
    }

    this.flushing = true;
    try {
      while (this.drainingTracks) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      const started = performance.now?.() ?? Date.now();
      const events = this.queue.drain(this.config.queue.batchSize);
      if (events.length === 0) {
        return;
      }

      const batches = splitAnalyticsBatch(events, this.config);
      let sentAny = false;
      for (const batch of batches) {
        try {
          await withAnalyticsRetry(
            async () => {
              const failures = await this.router.sendBatch(batch, options);
              if (failures > 0) {
                throw new Error('analytics provider failure');
              }
            },
            this.config,
            () => this.diagnosticsStore.increment('retryCount'),
          );
          this.diagnosticsStore.increment('eventsSent', batch.length);
          sentAny = true;
        } catch {
          const overflowDropped = this.queue.requeueFront(batch);
          this.diagnosticsStore.increment('providerFailures');
          if (overflowDropped > 0) {
            this.diagnosticsStore.increment('eventsDropped', overflowDropped);
          }
          // Stop draining further batches this cycle after a failure.
          break;
        }
      }

      this.diagnosticsStore.set('queueSize', this.queue.size());
      this.diagnosticsStore.set(
        'lastFlushDurationMs',
        (performance.now?.() ?? Date.now()) - started,
      );

      if (sentAny && this.queue.size() > 0 && this.enabledState()) {
        // Continue draining remaining events only after successful progress.
        this.flushing = false;
        await this.flush(options);
        return;
      }
    } finally {
      this.flushing = false;
    }
  }

  private bootstrap(): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    this.consentService.initialize(this.config);
    if (this.consentService.consent() === 'granted' || !this.config.consent.required) {
      this.identity.persist(this.config.session.idleTimeoutMs);
    }
    void this.router.initialize({ debug: this.config.debug });

    if (isBrowser()) {
      this.flushTimer = setInterval(() => {
        void this.flush();
      }, this.config.queue.flushIntervalMs);
      window.addEventListener('pagehide', this.onPageHide);
      this.destroyRef.onDestroy(() => {
        window.removeEventListener('pagehide', this.onPageHide);
      });
    }
  }

  private readonly onPageHide = (): void => {
    void this.flush({ urgent: true });
  };

  private async processTrack(input: PixelAnalyticsTrackInput): Promise<void> {
    if (!this.enabledState()) {
      return;
    }

    try {
      this.diagnosticsStore.increment('eventsCreated');
      this.identity.touchSession(this.config.session.idleTimeoutMs);

      // 1) Consent gates (before sanitize / hash work)
      if (this.config.consent.required && this.consentService.consent() === 'denied') {
        this.diagnosticsStore.increment('eventsDropped');
        return;
      }
      const canCollect = this.consentService.canCollect(this.config);
      const queuePending = this.consentService.shouldQueueWhilePending(this.config);
      if (!canCollect && !queuePending) {
        this.diagnosticsStore.increment('eventsDropped');
        return;
      }

      // 2) Sample (stable per anonymousId + event name)
      const omitUserId = !this.consentService.allowsIdentifiedTracking(this.config);
      const identity = this.identity.snapshot({ omitUserId });
      const category = input.category ?? inferPixelAnalyticsCategory(input.name, this.registry);
      if (isSampledOut({ name: input.name, category, identity }, this.config)) {
        this.diagnosticsStore.increment('eventsSampledOut');
        return;
      }

      // 3) Sanitize → build → validate
      const event = await this.buildEvent(input, this.registry);
      const validation = validateAnalyticsEvent(event, this.config, this.registry);
      if (!validation.valid) {
        if (this.config.debug) {
          // eslint-disable-next-line no-console
          console.warn('[pixel-analytics] dropped invalid event', validation.reason, event);
        }
        this.diagnosticsStore.increment('eventsDropped');
        return;
      }

      // 4) Queue
      if (!canCollect && queuePending) {
        const result = this.queue.enqueue(event, true);
        if (result.overflowed) {
          this.diagnosticsStore.increment('eventsDropped');
        }
        this.diagnosticsStore.increment('eventsQueued');
        this.diagnosticsStore.set('queueSize', this.queue.size());
        return;
      }

      const result = this.queue.enqueue(event, false);
      if (result.overflowed) {
        this.diagnosticsStore.increment('eventsDropped');
      }
      this.diagnosticsStore.increment('eventsQueued');
      this.diagnosticsStore.set('queueSize', this.queue.size());
      await this.router.track(event);

      if (this.queue.size() >= this.config.queue.batchSize) {
        await this.flush();
      }
    } catch {
      this.diagnosticsStore.increment('eventsDropped');
    }
  }

  private async buildEvent(
    input: PixelAnalyticsTrackInput,
    registry: PixelAnalyticsRegistry,
  ): Promise<PixelAnalyticsEvent> {
    const sanitized = await sanitizeAnalyticsProperties(input.properties, this.config);
    const resolvedContext = this.context.resolve(input.context);
    const page = resolvedContext.page
      ? {
          ...resolvedContext.page,
          url: sanitizeAnalyticsUrl(resolvedContext.page.url, this.config),
          referrer: sanitizeAnalyticsUrl(resolvedContext.page.referrer, this.config),
          path: resolvedContext.page.path?.split('?')[0],
          route: resolvedContext.page.route?.split('?')[0],
        }
      : undefined;
    const correlation =
      this.interactions.correlationForNextEvent(resolvedContext.correlation) ??
      (isBrowser()
        ? {
            traceId: createAnalyticsId().replace(/-/g, '').padEnd(32, '0').slice(0, 32),
            spanId: createAnalyticsId().replace(/-/g, '').padEnd(16, '0').slice(0, 16),
          }
        : undefined);
    const eventContext = {
      ...(page ? { ...resolvedContext, page } : resolvedContext),
      correlation,
    };
    const omitUserId = !this.consentService.allowsIdentifiedTracking(this.config);

    const event: PixelAnalyticsEvent = {
      id: createAnalyticsId(),
      name: input.name,
      category: input.category ?? inferPixelAnalyticsCategory(input.name, registry),
      timestamp: input.timestamp ?? new Date().toISOString(),
      schemaVersion: PIXEL_ANALYTICS_SCHEMA_VERSION,
      eventVersion: input.eventVersion,
      application: this.config.application,
      identity: this.identity.snapshot({ omitUserId }),
      context: eventContext,
      properties: sanitized.value,
      meta: {
        consent: this.consentService.consent(),
        sampled: true,
        sdk: { name: PIXEL_ANALYTICS_SDK_NAME, version: PIXEL_ANALYTICS_SDK_VERSION },
      },
    };

    if (safeJsonByteLength(event) > this.config.privacy.maxEventBytes) {
      return {
        ...event,
        properties: { truncated: true },
      };
    }

    return event;
  }

  private async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush({ urgent: true });
    await this.router.shutdown();
  }
}
