import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import PixelButtonComponent from './pixel-button';
import {
  PIXEL_UI_ANALYTICS,
  type PixelUiAnalyticsPort,
} from '../shared/analytics/pixel-ui-analytics';

@Component({
  imports: [PixelButtonComponent],
  template: `
    <pixel-button analyticsAction="save" [analyticsProperties]="{ feature: 'claims' }">
      Save
    </pixel-button>
  `,
})
class ButtonAnalyticsHost {}

describe('pixel-button analytics', () => {
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

  it('emits ui.button.click when analyticsAction is set', () => {
    const fixture = TestBed.createComponent(ButtonAnalyticsHost);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    expect(port.track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ui.button.click',
        component: { name: 'pixel-button' },
        properties: expect.objectContaining({ action: 'save', feature: 'claims' }),
      }),
    );
  });

  it('keeps analyticsAction after analyticsProperties overrides', () => {
    @Component({
      imports: [PixelButtonComponent],
      template: `
        <pixel-button
          analyticsAction="save"
          [analyticsProperties]="{ action: 'hijack', feature: 'claims' }"
        >
          Save
        </pixel-button>
      `,
    })
    class OverrideHost {}

    const fixture = TestBed.createComponent(OverrideHost);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    expect(port.track).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({ action: 'save', feature: 'claims' }),
      }),
    );
  });
});
