import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import PixelMenuComponent from './pixel-menu';
import PixelMenuItemComponent from './pixel-menu-item';
import PixelMenuTriggerDirective from './pixel-menu-trigger';
import PixelButtonComponent from '../pixel-button/pixel-button';
import {
  PIXEL_UI_ANALYTICS,
  type PixelUiAnalyticsPort,
} from '../shared/analytics/pixel-ui-analytics';

@Component({
  imports: [
    PixelMenuComponent,
    PixelMenuItemComponent,
    PixelMenuTriggerDirective,
    PixelButtonComponent,
  ],
  template: `
    <pixel-button [pixelMenuTriggerFor]="actions">Actions</pixel-button>
    <pixel-menu #actions analyticsId="row-actions">
      <pixel-menu-item analyticsAction="edit">Edit</pixel-menu-item>
    </pixel-menu>
  `,
})
class MenuAnalyticsHost {
  readonly menu = viewChild.required<PixelMenuComponent>('actions');
}

describe('pixel-menu analytics', () => {
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

  it('emits open / select / close', async () => {
    const fixture = TestBed.createComponent(MenuAnalyticsHost);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('pixel-button button') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(port.track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ui.menu.open',
        properties: expect.objectContaining({ menuId: 'row-actions' }),
      }),
    );

    const item = document.querySelector('.pixel-menu__item') as HTMLElement;
    item.click();
    fixture.detectChanges();
    expect(port.track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ui.menu.select',
        properties: expect.objectContaining({ menuId: 'row-actions', action: 'edit' }),
      }),
    );
    expect(port.track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ui.menu.close',
        properties: expect.objectContaining({ menuId: 'row-actions', reason: 'select' }),
      }),
    );
  });

  it('opens an interaction scope for root menus', async () => {
    const end = vi.fn();
    port = {
      track: vi.fn(),
      beginInteraction: vi.fn(() => ({ end })),
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PIXEL_UI_ANALYTICS, useValue: port }],
    });

    const fixture = TestBed.createComponent(MenuAnalyticsHost);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('pixel-button button') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(port.beginInteraction).toHaveBeenCalledWith('menu:row-actions');

    const item = document.querySelector('.pixel-menu__item') as HTMLElement;
    item.click();
    fixture.detectChanges();
    expect(end).toHaveBeenCalled();
  });

  it('does not emit when analyticsDisabled', async () => {
    @Component({
      imports: [
        PixelMenuComponent,
        PixelMenuItemComponent,
        PixelMenuTriggerDirective,
        PixelButtonComponent,
      ],
      template: `
        <pixel-button [pixelMenuTriggerFor]="actions">Actions</pixel-button>
        <pixel-menu #actions analyticsId="row-actions" analyticsDisabled>
          <pixel-menu-item analyticsAction="edit">Edit</pixel-menu-item>
        </pixel-menu>
      `,
    })
    class MutedMenuHost {}

    const fixture = TestBed.createComponent(MutedMenuHost);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('pixel-button button') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    expect(port.track).not.toHaveBeenCalled();
  });
});
