import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { providePixelAnalytics } from './provide-analytics';
import { PixelAnalyticsService } from '../core/analytics.service';
import { PixelAnalyticsTrackDirective } from './analytics-track.directive';
import { createPixelUiAnalyticsPort } from './pixel-ui-bridge';

@Component({
  imports: [PixelAnalyticsTrackDirective],
  template: `
    <button
      type="button"
      pixelAnalyticsTrack="ui.button.click"
      [analyticsProperties]="props"
      analyticsComponent="demo-button"
    >
      Save
    </button>
  `,
})
class TrackHostComponent {
  props: Record<string, unknown> = { action: 'save' };
}

describe('PixelAnalyticsTrackDirective', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        providePixelAnalytics({
          application: { id: 'app', environment: 'test' },
          consent: { required: false },
          validateRegistry: false,
          queue: { flushIntervalMs: 60_000 },
        }),
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('tracks on click when PixelAnalyticsService is available', () => {
    const analytics = TestBed.inject(PixelAnalyticsService);
    const spy = vi.spyOn(analytics, 'track');
    const fixture = TestBed.createComponent(TrackHostComponent);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ui.button.click',
        properties: { action: 'save' },
        context: { component: { name: 'demo-button' } },
      }),
    );
  });
});

describe('createPixelUiAnalyticsPort', () => {
  it('forwards track calls to PixelAnalyticsService', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        providePixelAnalytics({
          application: { id: 'app', environment: 'test' },
          consent: { required: false },
          validateRegistry: false,
          queue: { flushIntervalMs: 60_000 },
        }),
      ],
    });
    const analytics = TestBed.inject(PixelAnalyticsService);
    const spy = vi.spyOn(analytics, 'track');
    const port = createPixelUiAnalyticsPort(analytics);
    port.track({
      name: 'data.table.sort',
      component: { name: 'pixel-data-grid' },
      properties: { field: 'status' },
    });
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'data.table.sort',
        properties: { field: 'status' },
        context: { component: { name: 'pixel-data-grid' } },
      }),
    );
  });
});
