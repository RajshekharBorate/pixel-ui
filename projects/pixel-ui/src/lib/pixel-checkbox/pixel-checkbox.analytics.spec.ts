import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import PixelCheckboxComponent from './pixel-checkbox';
import {
  PIXEL_UI_ANALYTICS,
  type PixelUiAnalyticsPort,
} from '../shared/analytics/pixel-ui-analytics';

@Component({
  imports: [PixelCheckboxComponent],
  template: `
    <pixel-checkbox analyticsId="terms" label="Accept" />
  `,
})
class CheckboxAnalyticsHost {}

describe('pixel-checkbox analytics', () => {
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

  it('emits ui.checkbox.toggle on activation', () => {
    const fixture = TestBed.createComponent(CheckboxAnalyticsHost);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('input')?.click();
    expect(port.track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ui.checkbox.toggle',
        component: { name: 'pixel-checkbox' },
        properties: expect.objectContaining({
          checkboxId: 'terms',
          checked: true,
        }),
      }),
    );
  });
});
