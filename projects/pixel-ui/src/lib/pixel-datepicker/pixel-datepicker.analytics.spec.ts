import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PIXEL_UI_ANALYTICS,
  type PixelUiAnalyticsPort,
} from '../shared/analytics/pixel-ui-analytics';
import PixelDatepickerComponent from './pixel-datepicker';

@Component({
  imports: [PixelDatepickerComponent],
  template: `<pixel-datepicker analyticsId="invoice-date" label="Invoice date" />`,
})
class DatepickerAnalyticsHost {}

describe('pixel-datepicker analytics', () => {
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

  it('emits open and presence-only select events by default', () => {
    const fixture = TestBed.createComponent(DatepickerAnalyticsHost);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector(
      '.pixel-input__action--trailing button',
    ) as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    expect(port.track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ui.date.open',
        component: { name: 'pixel-datepicker' },
        properties: expect.objectContaining({
          pickerId: 'invoice-date',
          hasValue: false,
        }),
      }),
    );

    const input = fixture.nativeElement.querySelector(
      '.pixel-input__native',
    ) as HTMLInputElement;
    input.value = '2026-08-14';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    fixture.detectChanges();

    const selectCall = vi.mocked(port.track).mock.calls.find(
      ([event]) => event.name === 'ui.date.select',
    )?.[0];
    expect(selectCall).toEqual(
      expect.objectContaining({
        component: { name: 'pixel-datepicker' },
        properties: expect.objectContaining({
          pickerId: 'invoice-date',
          hasValue: true,
        }),
      }),
    );
    expect(selectCall?.properties).not.toHaveProperty('value');
  });
});
