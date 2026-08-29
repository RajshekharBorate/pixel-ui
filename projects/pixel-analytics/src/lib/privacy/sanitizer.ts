import type { ResolvedPixelAnalyticsConfig } from '../core/analytics.config';

export interface PixelAnalyticsSanitizeResult {
  readonly value: Record<string, unknown> | undefined;
  readonly dropped: boolean;
  readonly blockedKeys: readonly string[];
}

const BLOCK_KEY_PATTERN =
  /(password|token|secret|authorization|cookie|ssn|cvv|creditcard|apikey|bearer|jwt|otp|iban|pin)/i;

const URL_LIKE_KEYS = new Set([
  'url',
  'href',
  'referrer',
  'urlafterredirects',
  'pageurl',
  'requesturl',
]);

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isBlockedKey(key: string, blockSet: Set<string>): boolean {
  const normalized = normalizeKey(key);
  if (blockSet.has(normalized)) {
    return true;
  }
  return BLOCK_KEY_PATTERN.test(normalized);
}

function maskString(value: string): string {
  if (value.length <= 4) {
    return '****';
  }
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

/**
 * Pseudonymize with HMAC-SHA-256 when `privacy.hashSecret` is set.
 * Without subtle crypto, the field is dropped (not length-encoded).
 * Unsalted digests are pseudonymization, not anonymization.
 */
async function hashString(
  value: string,
  secret: string | undefined,
): Promise<string | undefined> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    return undefined;
  }
  const encoder = new TextEncoder();
  if (secret) {
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export async function sanitizeAnalyticsProperties(
  input: Record<string, unknown> | undefined,
  config: ResolvedPixelAnalyticsConfig,
  depth = 0,
): Promise<PixelAnalyticsSanitizeResult> {
  if (!input || !config.privacy.enabled) {
    return { value: input, dropped: false, blockedKeys: [] };
  }

  const blockSet = new Set(config.privacy.blockFields.map(normalizeKey));
  const maskSet = new Set(config.privacy.maskFields.map(normalizeKey));
  const hashSet = new Set(config.privacy.hashFields.map(normalizeKey));
  const blockedKeys: string[] = [];

  const walk = async (value: unknown, currentDepth: number, keyHint = ''): Promise<unknown> => {
    if (currentDepth > config.privacy.maxPropertyDepth) {
      return undefined;
    }
    if (value === null || typeof value === 'boolean' || typeof value === 'number') {
      return value;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'function') {
      return undefined;
    }
    if (typeof EventTarget !== 'undefined' && value instanceof EventTarget) {
      return undefined;
    }
    if (typeof value === 'string') {
      const normalizedHint = normalizeKey(keyHint);
      if (URL_LIKE_KEYS.has(normalizedHint) || looksLikeUrl(value)) {
        return sanitizeAnalyticsUrl(value, config) ?? undefined;
      }
      return value.length > config.privacy.maxStringLength
        ? value.slice(0, config.privacy.maxStringLength)
        : value;
    }
    if (Array.isArray(value)) {
      const items: unknown[] = [];
      for (const item of value.slice(0, 50)) {
        items.push(await walk(item, currentDepth + 1, keyHint));
      }
      return items;
    }
    if (!isPlainObject(value)) {
      // Class instances / DOM-ish objects — drop rather than serialize sparsely.
      return undefined;
    }
    const output: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      if (isBlockedKey(key, blockSet)) {
        blockedKeys.push(key);
        continue;
      }
      const normalized = normalizeKey(key);
      if (hashSet.has(normalized) && typeof child === 'string') {
        const hashed = await hashString(child, config.privacy.hashSecret);
        if (hashed !== undefined) {
          output[key] = hashed;
        }
        continue;
      }
      if (maskSet.has(normalized) && typeof child === 'string') {
        output[key] = maskString(child);
        continue;
      }
      output[key] = await walk(child, currentDepth + 1, key);
    }
    return output;
  };

  const sanitized = (await walk(input, depth)) as Record<string, unknown> | undefined;
  if (blockedKeys.length > 0 && Object.keys(sanitized ?? {}).length === 0) {
    return { value: undefined, dropped: true, blockedKeys };
  }
  return { value: sanitized, dropped: false, blockedKeys };
}

function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) || value.startsWith('/') && value.includes('?');
}

export function sanitizeAnalyticsUrl(
  url: string | undefined,
  config: ResolvedPixelAnalyticsConfig,
): string | undefined {
  if (!url) {
    return url;
  }
  try {
    const absolute = /^https?:\/\//i.test(url);
    const parsed = new URL(url, 'http://localhost');
    const pathAndQuery = config.privacy.allowQueryParams
      ? `${parsed.pathname}${parsed.search}`
      : parsed.pathname;
    let result = absolute ? `${parsed.origin}${pathAndQuery}` : pathAndQuery;
    if (config.privacy.stripUrlHash) {
      result = result.split('#')[0] ?? result;
    }
    return result;
  } catch {
    return url.split('#')[0]?.split('?')[0];
  }
}

/** Strip query/hash from free-form error messages. */
export function sanitizeErrorMessage(message: string, maxLength: number): string {
  const withoutUrls = message.replace(/https?:\/\/[^\s]+/gi, (match) => {
    try {
      const parsed = new URL(match);
      return `${parsed.origin}${parsed.pathname}`;
    } catch {
      return match.split('?')[0] ?? match;
    }
  });
  return withoutUrls.length > maxLength ? withoutUrls.slice(0, maxLength) : withoutUrls;
}
