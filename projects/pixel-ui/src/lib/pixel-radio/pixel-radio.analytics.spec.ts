import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import PixelRadioGroupComponent from './pixel-radio-group';
import {
  PIXEL_UI_ANALYTICS,
  type PixelUiAnalyticsPort,
} from '../shared/analytics/pixel-ui-analytics';

@Component({
  imports: [PixelRadioGroupComponent],
  template: `
    <pixel-radio-group
      analyticsId="priority"
      [options]="[
        { value: 'low', label: 'Low' },
        { value: 'high', label: 'High' },
      ]"
    />
  `,
})
class RadioAnalyticsHost {}

describe('pixel-radio-group analytics', () => {
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

  it('emits ui.radio.select without raw value by default', () => {
    const fixture = TestBed.createComponent(RadioAnalyticsHost);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="radio"]');
    input?.click();
    expect(port.track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ui.radio.select',
        component: { name: 'pixel-radio' },
        properties: expect.objectContaining({
          groupId: 'priority',
          hasValue: true,
        }),
      }),
    );
    const call = vi.mocked(port.track).mock.calls[0]?.[0];
    expect(call?.properties?.['value']).toBeUndefined();
  });
});
