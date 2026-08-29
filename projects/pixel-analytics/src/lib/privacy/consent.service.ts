import { Injectable, signal } from '@angular/core';
import type { PixelAnalyticsConsentState } from '../core/analytics.types';
import type { ResolvedPixelAnalyticsConfig } from '../core/analytics.config';
import { isBrowser } from '../core/analytics.utils';

const CONSENT_KEY = 'pixel_analytics_consent';

@Injectable()
export class PixelAnalyticsConsentService {
  private readonly state = signal<PixelAnalyticsConsentState>('unknown');

  readonly consent = this.state.asReadonly();

  initialize(config: ResolvedPixelAnalyticsConfig): void {
    const stored = this.readStoredConsent();
    if (stored) {
      this.state.set(stored);
      return;
    }
    this.state.set(config.consent.defaultState);
  }

  setConsent(state: PixelAnalyticsConsentState): void {
    this.state.set(state);
    this.writeStoredConsent(state);
  }

  canCollect(config: ResolvedPixelAnalyticsConfig): boolean {
    if (!config.consent.required) {
      return true;
    }
    if (this.state() === 'granted') {
      return true;
    }
    // Anonymous collection while consent is unknown (no userId/traits on events).
    return (
      this.state() === 'unknown' && config.consent.beforeConsent === 'anonymous-only'
    );
  }

  shouldQueueWhilePending(config: ResolvedPixelAnalyticsConfig): boolean {
    return (
      config.consent.required &&
      this.state() === 'unknown' &&
      config.consent.beforeConsent === 'queue'
    );
  }

  /** True when events may include identify / userId. */
  allowsIdentifiedTracking(config: ResolvedPixelAnalyticsConfig): boolean {
    if (!config.consent.required) {
      return true;
    }
    return this.state() === 'granted';
  }

  private readStoredConsent(): PixelAnalyticsConsentState | null {
    if (!isBrowser()) {
      return null;
    }
    try {
      const value = globalThis.localStorage?.getItem(CONSENT_KEY);
      if (value === 'granted' || value === 'denied' || value === 'unknown') {
        return value;
      }
    } catch {
      // ignore
    }
    return null;
  }

  private writeStoredConsent(state: PixelAnalyticsConsentState): void {
    if (!isBrowser()) {
      return;
    }
    try {
      globalThis.localStorage?.setItem(CONSENT_KEY, state);
    } catch {
      // ignore
    }
  }

  clearStoredConsent(): void {
    if (!isBrowser()) {
      return;
    }
    try {
      globalThis.localStorage?.removeItem(CONSENT_KEY);
    } catch {
      // ignore
    }
  }
}
