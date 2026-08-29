import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PIXEL_UI_ANALYTICS,
  type PixelUiAnalyticsPort,
} from '../shared/analytics/pixel-ui-analytics';
import PixelPopoverComponent from './pixel-popover';

@Component({
  imports: [PixelPopoverComponent],
  template: `
    <button #trigger type="button">Open</button>
    <pixel-popover
      analyticsId="notifications"
      position="above"
      align="end"
      ariaLabel="Sensitive user details"
      [autoFocus]="false"
      [analyticsProperties]="{ popoverId: 'override', feature: 'inbox' }"
    />
  `,
})
class PopoverAnalyticsHost {
  readonly popover = viewChild.required(PixelPopoverComponent);
}

describe('pixel-popover analytics', () => {
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

  it('emits open and close without accessible-label text', () => {
    const fixture = TestBed.createComponent(PopoverAnalyticsHost);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const popover = fixture.componentInstance.popover();

    popover.open(trigger);
    popover.close({ restoreFocus: false });

    expect(port.track).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        name: 'ui.popover.open',
        component: { name: 'pixel-popover' },
        properties: {
          popoverId: 'notifications',
          feature: 'inbox',
          position: 'above',
          align: 'end',
        },
      }),
    );
    expect(port.track).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        name: 'ui.popover.close',
        component: { name: 'pixel-popover' },
        properties: {
          popoverId: 'notifications',
          feature: 'inbox',
          position: 'above',
          align: 'end',
        },
      }),
    );
  });
});
