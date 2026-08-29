import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import PixelSelectComponent from './pixel-select';
import {
  PIXEL_UI_ANALYTICS,
  type PixelUiAnalyticsPort,
} from '../shared/analytics/pixel-ui-analytics';

@Component({
  imports: [PixelSelectComponent],
  template: `
    <pixel-select
      analyticsId="status"
      label="Status"
      [options]="[
        { value: 'open', label: 'Open' },
        { value: 'closed', label: 'Closed' },
      ]"
    />
  `,
})
class SelectAnalyticsHost {}

describe('pixel-select analytics', () => {
  let port: PixelUiAnalyticsPort;

  beforeEach(() => {
    class MockIntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      takeRecords = vi.fn(() => []);
      root = null;
      rootMargin = '';
      thresholds = [];
    }
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    port = { track: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: PIXEL_UI_ANALYTICS, useValue: port }],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('emits ui.select.open when the panel opens', () => {
    const fixture = TestBed.createComponent(SelectAnalyticsHost);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('button');
    trigger?.click();
    fixture.detectChanges();
    expect(port.track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ui.select.open',
        component: { name: 'pixel-select' },
        properties: expect.objectContaining({
          selectId: 'status',
          multiple: false,
        }),
      }),
    );
  });
});
