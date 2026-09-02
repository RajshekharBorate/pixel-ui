import { Injectable, signal } from '@angular/core';
import type {
  PixelAnalyticsEventContext,
  PixelAnalyticsPageContext,
} from '../core/analytics.types';
import { isBrowser } from '../core/analytics.utils';

@Injectable()
export class PixelAnalyticsContextService {
  private readonly overrides = signal<Partial<PixelAnalyticsEventContext>>({});

  setContext(patch: Partial<PixelAnalyticsEventContext>): void {
    this.overrides.update((current) => ({
      ...current,
      ...patch,
      page: patch.page ? { ...current.page, ...patch.page } : current.page,
      component: patch.component
        ? { ...current.component, ...patch.component }
        : current.component,
      device: patch.device ? { ...current.device, ...patch.device } : current.device,
      correlation: patch.correlation
        ? { ...current.correlation, ...patch.correlation }
        : current.correlation,
      entity: patch.entity !== undefined ? patch.entity : current.entity,
    }));
  }

  clearEntity(): void {
    this.overrides.update((current) => {
      const next = { ...current };
      delete next.entity;
      return next;
    });
  }

  clearContext(): void {
    this.overrides.set({});
  }

  buildPageContext(
    input?: Partial<PixelAnalyticsPageContext>,
    options?: { allowQueryParams?: boolean; stripUrlHash?: boolean },
  ): PixelAnalyticsPageContext | undefined {
    if (!isBrowser()) {
      return input;
    }
    const locationRef = window.location;
    let url = locationRef.href;
    if (!options?.allowQueryParams) {
      url = `${locationRef.origin}${locationRef.pathname}`;
    }
    if (options?.stripUrlHash !== false) {
      url = url.split('#')[0] ?? url;
    }

    let referrer = document.referrer || undefined;
    if (referrer && !options?.allowQueryParams) {
      try {
        const parsed = new URL(referrer);
        referrer = `${parsed.origin}${parsed.pathname}`;
      } catch {
        referrer = referrer.split('?')[0]?.split('#')[0];
      }
    }

    return {
      url,
      path: locationRef.pathname,
      title: document.title || undefined,
      referrer,
      ...input,
    };
  }

  resolve(input?: Partial<PixelAnalyticsEventContext>): PixelAnalyticsEventContext {
    const overrides = this.overrides();
    return {
      ...overrides,
      ...input,
      page: input?.page ?? overrides.page,
      component: input?.component ?? overrides.component,
      device: input?.device ?? overrides.device ?? this.detectDevice(),
      viewport: input?.viewport ?? overrides.viewport ?? this.detectViewport(),
      locale: input?.locale ?? overrides.locale ?? (isBrowser() ? navigator.language : undefined),
      timezone:
        input?.timezone ??
        overrides.timezone ??
        (isBrowser() ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined),
      correlation: input?.correlation ?? overrides.correlation,
      entity: input?.entity ?? overrides.entity,
    };
  }

  private detectViewport(): PixelAnalyticsEventContext['viewport'] {
    if (!isBrowser()) {
      return undefined;
    }
    return { width: window.innerWidth, height: window.innerHeight };
  }

  private detectDevice(): PixelAnalyticsEventContext['device'] {
    if (!isBrowser()) {
      return undefined;
    }
    const ua = navigator.userAgent;
    const width = window.innerWidth;
    const type: 'mobile' | 'tablet' | 'desktop' =
      width < 600 ? 'mobile' : width < 900 ? 'tablet' : 'desktop';
    return {
      type,
      os: /Windows/i.test(ua)
        ? 'Windows'
        : /Mac/i.test(ua)
          ? 'macOS'
          : /Android/i.test(ua)
            ? 'Android'
            : /iPhone|iPad/i.test(ua)
              ? 'iOS'
              : undefined,
      browser: /Edg\//i.test(ua)
        ? 'Edge'
        : /Chrome\//i.test(ua)
          ? 'Chrome'
          : /Firefox\//i.test(ua)
            ? 'Firefox'
            : /Safari\//i.test(ua)
              ? 'Safari'
              : undefined,
    };
  }
}
