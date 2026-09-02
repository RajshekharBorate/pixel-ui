import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import PixelPaginatorComponent from './pixel-paginator';
import {
  PIXEL_UI_ANALYTICS,
  type PixelUiAnalyticsPort,
} from '../shared/analytics/pixel-ui-analytics';

@Component({
  imports: [PixelPaginatorComponent],
  template: `<pixel-paginator analyticsId="claims" [length]="100" [pageSize]="10" />`,
})
class PaginatorAnalyticsHost {}

describe('pixel-paginator analytics', () => {
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

  it('emits ui.paginator.page on next', () => {
    const fixture = TestBed.createComponent(PaginatorAnalyticsHost);
    fixture.detectChanges();
    const next = fixture.nativeElement.querySelector(
      'button[aria-label="Next page"], button[aria-label*="Next"]',
    ) as HTMLButtonElement | null;
    expect(next).toBeTruthy();
    next!.click();
    expect(port.track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ui.paginator.page',
        properties: expect.objectContaining({
          paginatorId: 'claims',
          pageIndex: 1,
          previousPageIndex: 0,
          pageSize: 10,
        }),
      }),
    );
  });

  it('does not emit when analyticsDisabled', () => {
    @Component({
      imports: [PixelPaginatorComponent],
      template: `<pixel-paginator analyticsDisabled analyticsId="claims" [length]="100" [pageSize]="10" />`,
    })
    class MutedPaginatorHost {}

    const fixture = TestBed.createComponent(MutedPaginatorHost);
    fixture.detectChanges();
    const next = fixture.nativeElement.querySelector(
      'button[aria-label="Next page"], button[aria-label*="Next"]',
    ) as HTMLButtonElement | null;
    next!.click();
    expect(port.track).not.toHaveBeenCalled();
  });
});
