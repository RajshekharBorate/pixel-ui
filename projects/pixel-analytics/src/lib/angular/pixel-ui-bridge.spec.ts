import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createPixelUiAnalyticsPort } from './pixel-ui-bridge';
import { PixelAnalyticsService } from '../core/analytics.service';
import { providePixelAnalytics } from './provide-analytics';
import { createAnalyticsTestingController } from '../testing/testing';

const analyticsProviders = [
  provideHttpClient(),
  provideHttpClientTesting(),
  providePixelAnalytics({
    application: { id: 'app', environment: 'test' },
    consent: { required: false },
    queue: { batchSize: 10, flushIntervalMs: 60_000 },
    validateRegistry: false,
  }),
];

describe('createPixelUiAnalyticsPort', () => {
  let service: PixelAnalyticsService;
  let controller: ReturnType<typeof createAnalyticsTestingController>;

  beforeEach(() => {
    controller = createAnalyticsTestingController();
    TestBed.configureTestingModule({
      providers: [...analyticsProviders, ...controller.providers],
    });
    service = TestBed.inject(PixelAnalyticsService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  async function settleTrack(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  it('shares traceId across events in a menu interaction', async () => {
    const port = createPixelUiAnalyticsPort(service);
    const handle = port.beginInteraction!('menu:export');
    port.track({ name: 'ui.menu.open', component: { name: 'pixel-menu' } });
    await settleTrack();
    port.track({ name: 'ui.menu.select', component: { name: 'pixel-menu-item' } });
    await settleTrack();
    handle.end();

    const events = controller.events().filter((event) => event.name.startsWith('ui.menu.'));
    expect(events).toHaveLength(2);
    const firstTrace = events[0]?.context.correlation?.traceId;
    expect(firstTrace).toBeTruthy();
    expect(events[1]?.context.correlation?.traceId).toBe(firstTrace);
    expect(events[0]?.context.correlation?.interactionId).toBe('menu:export');
    expect(events[1]?.context.correlation?.parentSpanId).toBe(events[0]?.context.correlation?.spanId);
  });
});
