import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import PixelToggleComponent from './pixel-toggle';
import {
  PIXEL_UI_ANALYTICS,
  type PixelUiAnalyticsPort,
} from '../shared/analytics/pixel-ui-analytics';

@Component({
  imports: [PixelToggleComponent],
  template: `<pixel-toggle analyticsId="alerts" label="Alerts" />`,
})
class ToggleAnalyticsHost {}

describe('pixel-toggle analytics', () => {
  let port: PixelUiAnalyticsPort;

  beforeEach(() => {
    port = { track: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: PIXEL_UI_ANALYTICS, useValue: port }],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('emits ui.toggle.change on switch activation', () => {
    const fixture = TestBed.createComponent(ToggleAnalyticsHost);
    fixture.detectChanges();
    const control =
      fixture.nativeElement.querySelector('button') ??
      fixture.nativeElement.querySelector('[role="switch"]');
    control?.click();
    expect(port.track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ui.toggle.change',
        component: { name: 'pixel-toggle' },
        properties: expect.objectContaining({
          toggleId: 'alerts',
          checked: true,
          mode: 'switch',
        }),
      }),
    );
  });
});
