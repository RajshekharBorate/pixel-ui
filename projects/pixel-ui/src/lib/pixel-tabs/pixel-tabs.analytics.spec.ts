import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import PixelTabsComponent from './pixel-tabs';
import PixelTabComponent from './pixel-tab';
import {
  PIXEL_UI_ANALYTICS,
  type PixelUiAnalyticsPort,
} from '../shared/analytics/pixel-ui-analytics';

@Component({
  imports: [PixelTabsComponent, PixelTabComponent],
  template: `
    <pixel-tabs analyticsId="detail">
      <pixel-tab label="One" analyticsId="one">A</pixel-tab>
      <pixel-tab label="Two" analyticsId="two">B</pixel-tab>
    </pixel-tabs>
  `,
})
class TabsAnalyticsHost {}

describe('pixel-tabs analytics', () => {
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

  it('emits ui.tabs.change on selection', () => {
    const fixture = TestBed.createComponent(TabsAnalyticsHost);
    fixture.detectChanges();
    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]');
    (tabs[1] as HTMLElement).click();
    expect(port.track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ui.tabs.change',
        component: { name: 'pixel-tabs' },
        properties: expect.objectContaining({
          tabsId: 'detail',
          index: 1,
          tabId: 'two',
        }),
      }),
    );
  });
});
