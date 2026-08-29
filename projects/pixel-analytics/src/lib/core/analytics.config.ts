import type {
  PixelAnalyticsBeforeConsentPolicy,
  PixelAnalyticsConsentState,
  PixelAnalyticsOnRevokePolicy,
} from './analytics.types';

export interface PixelAnalyticsPrivacyConfig {
  /** @default true */
  readonly enabled?: boolean;
  readonly blockFields?: readonly string[];
  readonly maskFields?: readonly string[];
  readonly hashFields?: readonly string[];
  /**
   * HMAC secret for `hashFields` (pseudonymization). Without it, SHA-256 still runs
   * when `crypto.subtle` exists — unsalted hashes are not anonymization.
   */
  readonly hashSecret?: string;
  /** @default false */
  readonly allowQueryParams?: boolean;
  /** @default true */
  readonly stripUrlHash?: boolean;
  /** @default 4 */
  readonly maxPropertyDepth?: number;
  /** @default 256 */
  readonly maxStringLength?: number;
  /** @default 32000 */
  readonly maxEventBytes?: number;
}

export interface PixelAnalyticsConsentConfig {
  /** @default true */
  readonly required?: boolean;
  /** @default 'unknown' */
  readonly defaultState?: PixelAnalyticsConsentState;
  /** @default 'drop' */
  readonly beforeConsent?: PixelAnalyticsBeforeConsentPolicy;
  /** Max events held while consent unknown when beforeConsent is 'queue'. @default 50 */
  readonly pendingQueueLimit?: number;
  /** @default 'stop' */
  readonly onRevoke?: PixelAnalyticsOnRevokePolicy;
}

export interface PixelAnalyticsQueueConfig {
  /** @default 20 */
  readonly batchSize?: number;
  /** @default 5000 */
  readonly flushIntervalMs?: number;
  /** @default 500 */
  readonly maxSize?: number;
  /** @default 262144 */
  readonly maxBatchBytes?: number;
}

export interface PixelAnalyticsRetryConfig {
  /** @default true */
  readonly enabled?: boolean;
  /** @default 3 */
  readonly maxAttempts?: number;
  /** @default 500 */
  readonly baseDelayMs?: number;
}

export interface PixelAnalyticsSamplingConfig {
  /** @default 1 */
  readonly defaultRate?: number;
  /** @default 0.25 */
  readonly performanceRate?: number;
  /** @default 1 */
  readonly errorRate?: number;
  /** Event names that always bypass sampling. */
  readonly bypass?: readonly string[];
}

export interface PixelAnalyticsHttpConfig {
  readonly endpoint: string;
  readonly headers?: Readonly<Record<string, string>>;
  /** @default true */
  readonly useBeaconOnUnload?: boolean;
  /**
   * Map event property keys on the wire.
   * @default 'camelCase'
   */
  readonly propertyKeyCase?: 'camelCase' | 'snake_case';
}

export interface PixelAnalyticsSessionConfig {
  /**
   * Rotate `sessionId` after this many ms of inactivity (touch on each track).
   * @default 1_800_000 (30 minutes)
   */
  readonly idleTimeoutMs?: number;
}

export interface PixelAnalyticsApplicationConfig {
  readonly id: string;
  readonly name?: string;
  readonly version?: string;
  readonly environment: string;
}

export interface PixelAnalyticsConfig {
  /** @default true */
  readonly enabled?: boolean;
  readonly application: PixelAnalyticsApplicationConfig;
  readonly http?: PixelAnalyticsHttpConfig;
  readonly privacy?: PixelAnalyticsPrivacyConfig;
  readonly consent?: PixelAnalyticsConsentConfig;
  readonly queue?: PixelAnalyticsQueueConfig;
  readonly retry?: PixelAnalyticsRetryConfig;
  readonly sampling?: PixelAnalyticsSamplingConfig;
  readonly session?: PixelAnalyticsSessionConfig;
  /** Extra event definitions merged into the app-scoped registry. */
  readonly events?: readonly import('../events/event-registry').PixelAnalyticsEventDefinition[];
  /** @default false */
  readonly debug?: boolean;
  /** @default false — enable in production governance */
  readonly validateRegistry?: boolean;
}

export interface ResolvedPixelAnalyticsConfig {
  readonly enabled: boolean;
  readonly application: PixelAnalyticsApplicationConfig;
  readonly http?: PixelAnalyticsHttpConfig;
  readonly privacy: Required<
    Pick<
      PixelAnalyticsPrivacyConfig,
      | 'enabled'
      | 'blockFields'
      | 'maskFields'
      | 'hashFields'
      | 'allowQueryParams'
      | 'stripUrlHash'
      | 'maxPropertyDepth'
      | 'maxStringLength'
      | 'maxEventBytes'
    >
  > & {
    readonly hashSecret?: string;
  };
  readonly consent: Required<
    Pick<
      PixelAnalyticsConsentConfig,
      | 'required'
      | 'defaultState'
      | 'beforeConsent'
      | 'pendingQueueLimit'
      | 'onRevoke'
    >
  >;
  readonly queue: Required<PixelAnalyticsQueueConfig>;
  readonly retry: Required<PixelAnalyticsRetryConfig>;
  readonly sampling: Required<Pick<PixelAnalyticsSamplingConfig, 'defaultRate' | 'performanceRate' | 'errorRate'>> & {
    readonly bypass: readonly string[];
  };
  readonly session: Required<PixelAnalyticsSessionConfig>;
  readonly debug: boolean;
  readonly validateRegistry: boolean;
}

const DEFAULT_BLOCK_FIELDS = [
  'password',
  'token',
  'authorization',
  'cookie',
  'ssn',
  'creditCard',
  'cvv',
  'secret',
] as const;

const DEFAULT_MASK_FIELDS = ['email', 'phone'] as const;

/** Merges partial user config with enterprise-safe defaults. */
export function resolvePixelAnalyticsConfig(
  config: PixelAnalyticsConfig,
): ResolvedPixelAnalyticsConfig {
  return {
    enabled: config.enabled ?? true,
    application: config.application,
    http: config.http,
    privacy: {
      enabled: config.privacy?.enabled ?? true,
      blockFields: config.privacy?.blockFields ?? DEFAULT_BLOCK_FIELDS,
      maskFields: config.privacy?.maskFields ?? DEFAULT_MASK_FIELDS,
      hashFields: config.privacy?.hashFields ?? [],
      hashSecret: config.privacy?.hashSecret,
      allowQueryParams: config.privacy?.allowQueryParams ?? false,
      stripUrlHash: config.privacy?.stripUrlHash ?? true,
      maxPropertyDepth: config.privacy?.maxPropertyDepth ?? 4,
      maxStringLength: config.privacy?.maxStringLength ?? 256,
      maxEventBytes: config.privacy?.maxEventBytes ?? 32_000,
    },
    consent: {
      required: config.consent?.required ?? true,
      defaultState: config.consent?.defaultState ?? 'unknown',
      beforeConsent: config.consent?.beforeConsent ?? 'drop',
      pendingQueueLimit: config.consent?.pendingQueueLimit ?? 50,
      onRevoke: config.consent?.onRevoke ?? 'stop',
    },
    queue: {
      batchSize: config.queue?.batchSize ?? 20,
      flushIntervalMs: config.queue?.flushIntervalMs ?? 5_000,
      maxSize: config.queue?.maxSize ?? 500,
      maxBatchBytes: config.queue?.maxBatchBytes ?? 262_144,
    },
    retry: {
      enabled: config.retry?.enabled ?? true,
      maxAttempts: config.retry?.maxAttempts ?? 3,
      baseDelayMs: config.retry?.baseDelayMs ?? 500,
    },
    sampling: {
      defaultRate: config.sampling?.defaultRate ?? 1,
      performanceRate: config.sampling?.performanceRate ?? 0.25,
      errorRate: config.sampling?.errorRate ?? 1,
      bypass: config.sampling?.bypass ?? [],
    },
    session: {
      idleTimeoutMs: config.session?.idleTimeoutMs ?? 1_800_000,
    },
    debug: config.debug ?? false,
    validateRegistry: config.validateRegistry ?? false,
  };
}
