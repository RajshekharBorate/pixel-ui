import { Injectable, signal } from '@angular/core';
import type { PixelAnalyticsIdentity } from '../core/analytics.types';
import { createAnalyticsId, isBrowser } from '../core/analytics.utils';

const ANONYMOUS_KEY = 'pixel_analytics_anonymous_id';
const SESSION_KEY = 'pixel_analytics_session_id';
const SESSION_STARTED_KEY = 'pixel_analytics_session_started';
const SESSION_ACTIVITY_KEY = 'pixel_analytics_session_activity';

/**
 * Identity is in-memory until {@link persist} is called (consent granted).
 * {@link clearPersisted} removes storage keys on deny / reset.
 */
@Injectable()
export class PixelAnalyticsIdentityService {
  private persisted = false;
  private readonly anonymousIdValue = signal(createAnalyticsId());
  private readonly sessionIdValue = signal(createAnalyticsId());
  private readonly userIdValue = signal<string | undefined>(undefined);
  private readonly groupIdValue = signal<string | undefined>(undefined);
  private lastActivityMs = Date.now();

  readonly anonymousId = this.anonymousIdValue.asReadonly();
  readonly sessionId = this.sessionIdValue.asReadonly();
  readonly userId = this.userIdValue.asReadonly();
  readonly groupId = this.groupIdValue.asReadonly();

  snapshot(options?: { omitUserId?: boolean }): PixelAnalyticsIdentity {
    return {
      anonymousId: this.anonymousIdValue(),
      sessionId: this.sessionIdValue(),
      userId: options?.omitUserId ? undefined : this.userIdValue(),
      groupId: this.groupIdValue(),
    };
  }

  identify(userId: string): void {
    const trimmed = userId.trim();
    if (!trimmed) {
      return;
    }
    this.userIdValue.set(trimmed);
  }

  group(groupId: string): void {
    const trimmed = groupId.trim();
    if (!trimmed) {
      return;
    }
    this.groupIdValue.set(trimmed);
  }

  /**
   * Touch activity clock; rotate session when idle past `idleTimeoutMs`.
   * Call on each successful track path.
   */
  touchSession(idleTimeoutMs: number): void {
    const now = Date.now();
    if (now - this.lastActivityMs > idleTimeoutMs) {
      this.rotateSession();
    }
    this.lastActivityMs = now;
    if (this.persisted) {
      this.writeStorage('session', SESSION_ACTIVITY_KEY, String(now));
    }
  }

  /** Persist ids after consent is granted. Prefers existing storage values when present. */
  persist(idleTimeoutMs = 1_800_000): void {
    if (!isBrowser()) {
      return;
    }
    const storedAnon = this.readStorage('local', ANONYMOUS_KEY);
    if (storedAnon) {
      this.anonymousIdValue.set(storedAnon);
    } else {
      this.writeStorage('local', ANONYMOUS_KEY, this.anonymousIdValue());
    }

    const storedSession = this.readStorage('session', SESSION_KEY);
    const lastActivity = Number(this.readStorage('session', SESSION_ACTIVITY_KEY) ?? 0);
    const idle = lastActivity > 0 && Date.now() - lastActivity > idleTimeoutMs;
    if (storedSession && !idle) {
      this.sessionIdValue.set(storedSession);
      this.lastActivityMs = lastActivity || Date.now();
    } else {
      this.rotateSession();
    }
    this.persisted = true;
  }

  /** Remove stored identifiers (consent denied / reset). Keeps fresh in-memory ids. */
  clearPersisted(): void {
    this.removeStorage('local', ANONYMOUS_KEY);
    this.removeStorage('session', SESSION_KEY);
    this.removeStorage('session', SESSION_STARTED_KEY);
    this.removeStorage('session', SESSION_ACTIVITY_KEY);
    this.persisted = false;
  }

  reset(): void {
    this.userIdValue.set(undefined);
    this.groupIdValue.set(undefined);
    this.anonymousIdValue.set(createAnalyticsId());
    this.sessionIdValue.set(createAnalyticsId());
    this.clearPersisted();
  }

  isPersisted(): boolean {
    return this.persisted;
  }

  private rotateSession(): void {
    const id = createAnalyticsId();
    this.sessionIdValue.set(id);
    this.lastActivityMs = Date.now();
    if (this.persisted || isBrowser()) {
      this.writeStorage('session', SESSION_KEY, id);
      this.writeStorage('session', SESSION_STARTED_KEY, String(Date.now()));
      this.writeStorage('session', SESSION_ACTIVITY_KEY, String(Date.now()));
    }
  }

  private readStorage(kind: 'local' | 'session', key: string): string | null {
    try {
      const storage = kind === 'local' ? globalThis.localStorage : globalThis.sessionStorage;
      return storage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  private writeStorage(kind: 'local' | 'session', key: string, value: string): void {
    try {
      const storage = kind === 'local' ? globalThis.localStorage : globalThis.sessionStorage;
      storage?.setItem(key, value);
    } catch {
      // Storage blocked — in-memory ids still work for the session.
    }
  }

  private removeStorage(kind: 'local' | 'session', key: string): void {
    try {
      const storage = kind === 'local' ? globalThis.localStorage : globalThis.sessionStorage;
      storage?.removeItem(key);
    } catch {
      // ignore
    }
  }
}
