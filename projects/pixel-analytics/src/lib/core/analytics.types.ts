/** Stable envelope schema version. Bump only on breaking envelope changes. */
export const PIXEL_ANALYTICS_SCHEMA_VERSION = '1' as const;

export type PixelAnalyticsSchemaVersion = typeof PIXEL_ANALYTICS_SCHEMA_VERSION;

export type PixelAnalyticsEventCategory =
  | 'navigation'
  | 'interaction'
  | 'form'
  | 'data'
  | 'application'
  | 'performance'
  | 'custom';

export type PixelAnalyticsConsentState = 'unknown' | 'granted' | 'denied';

export type PixelAnalyticsBeforeConsentPolicy = 'drop' | 'queue' | 'anonymous-only';

export type PixelAnalyticsOnRevokePolicy = 'stop' | 'stop-and-flush';

export interface PixelAnalyticsApplicationContext {
  readonly id: string;
  readonly name?: string;
  readonly version?: string;
  readonly environment: string;
}

export interface PixelAnalyticsIdentity {
  readonly anonymousId: string;
  readonly userId?: string;
  readonly sessionId: string;
  readonly groupId?: string;
  readonly deviceId?: string;
}

export interface PixelAnalyticsPageContext {
  readonly url?: string;
  readonly path?: string;
  readonly route?: string;
  readonly title?: string;
  readonly referrer?: string;
}

export interface PixelAnalyticsComponentContext {
  readonly name?: string;
  readonly version?: string;
  readonly instanceId?: string;
}

export interface PixelAnalyticsDeviceContext {
  readonly type?: 'mobile' | 'tablet' | 'desktop';
  readonly os?: string;
  readonly browser?: string;
}

export interface PixelAnalyticsViewportContext {
  readonly width: number;
  readonly height: number;
}

export interface PixelAnalyticsCorrelationContext {
  readonly traceId?: string;
  readonly spanId?: string;
  readonly requestId?: string;
}

export interface PixelAnalyticsEventContext {
  readonly page?: PixelAnalyticsPageContext;
  readonly component?: PixelAnalyticsComponentContext;
  readonly locale?: string;
  readonly timezone?: string;
  readonly viewport?: PixelAnalyticsViewportContext;
  readonly device?: PixelAnalyticsDeviceContext;
  readonly correlation?: PixelAnalyticsCorrelationContext;
}

export interface PixelAnalyticsEventMeta {
  readonly sampled?: boolean;
  readonly consent?: PixelAnalyticsConsentState;
  readonly sdk?: { readonly name: string; readonly version: string };
  readonly [key: string]: unknown;
}

/** Canonical vendor-neutral analytics event. */
export interface PixelAnalyticsEvent<
  TName extends string = string,
  TProperties extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly id: string;
  readonly name: TName;
  readonly category: PixelAnalyticsEventCategory;
  readonly timestamp: string;
  readonly schemaVersion: PixelAnalyticsSchemaVersion;
  readonly eventVersion?: string;
  readonly application: PixelAnalyticsApplicationContext;
  readonly identity: PixelAnalyticsIdentity;
  readonly context: PixelAnalyticsEventContext;
  readonly properties?: TProperties;
  readonly meta?: PixelAnalyticsEventMeta;
}

export interface PixelAnalyticsTrackInput<
  TName extends string = string,
  TProperties extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly name: TName;
  readonly category?: PixelAnalyticsEventCategory;
  readonly properties?: TProperties;
  readonly eventVersion?: string;
  readonly context?: Partial<PixelAnalyticsEventContext>;
  readonly timestamp?: string;
}

export interface PixelAnalyticsPageInput {
  readonly name?: string;
  readonly category?: PixelAnalyticsEventCategory;
  readonly properties?: Record<string, unknown>;
  readonly context?: Partial<PixelAnalyticsEventContext>;
}

export interface PixelAnalyticsIdentifyInput {
  readonly userId: string;
  readonly traits?: Record<string, unknown>;
}

export interface PixelAnalyticsGroupInput {
  readonly groupId: string;
  readonly traits?: Record<string, unknown>;
}

export interface PixelAnalyticsPerformanceInput {
  readonly name: string;
  readonly durationMs: number;
  readonly properties?: Record<string, unknown>;
}

export interface PixelAnalyticsErrorContext {
  readonly component?: string;
  readonly handled?: boolean;
  readonly properties?: Record<string, unknown>;
}

export interface PixelAnalyticsDiagnostics {
  readonly eventsCreated: number;
  readonly eventsQueued: number;
  readonly eventsSent: number;
  readonly eventsDropped: number;
  readonly eventsSampledOut: number;
  readonly providerFailures: number;
  readonly retryCount: number;
  readonly queueSize: number;
  readonly lastFlushDurationMs: number;
}

export type PixelAnalyticsEventName = string;
