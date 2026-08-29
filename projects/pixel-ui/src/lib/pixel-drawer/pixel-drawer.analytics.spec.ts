import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PIXEL_UI_ANALYTICS,
  type PixelUiAnalyticsPort,
} from '../shared/analytics/pixel-ui-analytics';
import PixelDrawerComponent from './pixel-drawer';

@Component({
  imports: [PixelDrawerComponent],
  template: `
    <pixel-drawer
      analyticsId="filters"
      position="start"
      size="lg"
      title="Sensitive account title"
      [analyticsProperties]="{ drawerId: 'override', reason: 'override', feature: 'catalog' }"
    />
  `,
})
class DrawerAnalyticsHost {
  readonly drawer = viewChild.required(PixelDrawerComponent);
}

describe('pixel-drawer analytics', () => {
  let port: PixelUiAnalyticsPort;

  beforeEach(() => {
    port = { track: vi.fn() };
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    TestBed.configureTestingModule({
      providers: [{ provide: PIXEL_UI_ANALYTICS, useValue: port }],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  it('emits open and close without title text and keeps reserved properties', () => {
    const fixture = TestBed.createComponent(DrawerAnalyticsHost);
    fixture.detectChanges();
    const drawer = fixture.componentInstance.drawer();

    drawer.open.set(true);
    fixture.detectChanges();
    drawer.close('escape');
    fixture.detectChanges();

    expect(port.track).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        name: 'ui.drawer.open',
        component: { name: 'pixel-drawer' },
        properties: {
          drawerId: 'filters',
          feature: 'catalog',
          reason: 'override',
          position: 'start',
          size: 'lg',
        },
      }),
    );
    expect(port.track).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        name: 'ui.drawer.close',
        component: { name: 'pixel-drawer' },
        properties: {
          drawerId: 'filters',
          feature: 'catalog',
          reason: 'escape',
          position: 'start',
          size: 'lg',
        },
      }),
    );
  });
});
