import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelButtonComponent from '../pixel-button/pixel-button';
import PixelMenuComponent from '../pixel-menu/pixel-menu';
import PixelMenuItemComponent from '../pixel-menu/pixel-menu-item';
import PixelPopoverComponent from './pixel-popover';
import PixelPopoverTriggerDirective from './pixel-popover-trigger';

class ResizeObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

@Component({
  imports: [PixelButtonComponent, PixelPopoverComponent, PixelPopoverTriggerDirective],
  template: `
    <section class="theme-shell" [attr.data-theme]="theme()">
      <button type="button" class="trigger" [pixelPopoverTriggerFor]="pop">Open</button>
      <pixel-button
        class="custom-trigger"
        appearance="icon"
        leadingIcon="notifications"
        ariaLabel="Open notifications"
        [pixelPopoverTriggerFor]="pop"
      />
      <button type="button" class="after">After</button>
      <pixel-popover #pop ariaLabel="Details" [autoFocus]="autoFocus()">
        <p>Rich content</p>
        <button type="button" class="inside">Inside action</button>
      </pixel-popover>
    </section>
  `,
})
class HostComponent {
  readonly popover = viewChild.required(PixelPopoverComponent);
  readonly autoFocus = signal(true);
  readonly theme = signal<'light' | 'dark'>('light');
}

@Component({
  imports: [
    PixelPopoverComponent,
    PixelPopoverTriggerDirective,
    PixelMenuComponent,
    PixelMenuItemComponent,
  ],
  template: `
    <button type="button" class="trigger" [pixelPopoverTriggerFor]="pop">Open</button>
    <pixel-popover #pop ariaLabel="Notifications">
      <button type="button" class="overflow" (click)="openMenu($event)">More</button>
    </pixel-popover>
    <pixel-menu #menu ariaLabel="Item actions">
      <pixel-menu-item>Archive</pixel-menu-item>
    </pixel-menu>
  `,
})
class NestedMenuHostComponent {
  readonly popover = viewChild.required(PixelPopoverComponent);
  readonly menu = viewChild.required(PixelMenuComponent);

  openMenu(event: MouseEvent): void {
    const trigger = event.currentTarget;
    if (trigger instanceof HTMLElement) {
      this.menu().open(trigger);
    }
  }
}

describe('PixelPopoverComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    (globalThis as Record<string, unknown>)['ResizeObserver'] ??= ResizeObserverMock;
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    host.popover().close({ restoreFocus: false });
  });

  function trigger(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.trigger') as HTMLButtonElement;
  }

  function panel(): HTMLElement {
    // Body-relocated while open — query the document, not the fixture.
    return document.querySelector('.pixel-popover__panel') as HTMLElement;
  }

  async function open(): Promise<void> {
    trigger().click();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('carries the disclosure ARIA contract on the trigger', async () => {
    expect(trigger().getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(trigger().getAttribute('aria-controls')).toBeNull();

    await open();
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(trigger().getAttribute('aria-controls')).toBe(host.popover().panelId);
  });

  it('opens as a non-modal dialog relocated to the overlay layer', async () => {
    await open();
    expect(host.popover().opened()).toBe(true);
    expect(panel().getAttribute('role')).toBe('dialog');
    expect(panel().getAttribute('aria-label')).toBe('Details');
    expect(panel().closest('.pixel-overlay-container')).toBeTruthy();
  });

  it('moves focus into the panel on open and restores it on Escape', async () => {
    trigger().focus();
    await open();
    // jsdom reports offsetParent=null for everything, so getFocusableElements falls back to
    // the panel itself here; in real browsers the first focusable child receives focus.
    expect(panel().contains(document.activeElement)).toBe(true);

    panel().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(host.popover().opened()).toBe(false);
    expect(document.activeElement).toBe(trigger());
  });

  it('closes on outside pointerdown without stealing focus back', async () => {
    await open();
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    expect(host.popover().opened()).toBe(false);
    expect(document.activeElement).not.toBe(trigger());
  });

  it('closes when focus moves past the panel (Tab-out)', async () => {
    await open();
    const inside = panel().querySelector('.inside') as HTMLButtonElement;
    const after = fixture.nativeElement.querySelector('.after') as HTMLButtonElement;
    inside.focus();
    inside.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: after }),
    );
    fixture.detectChanges();
    expect(host.popover().opened()).toBe(false);
  });

  it('toggles closed from a second trigger activation', async () => {
    await open();
    trigger().click();
    fixture.detectChanges();
    expect(host.popover().opened()).toBe(false);
  });

  it('respects autoFocus=false', async () => {
    host.autoFocus.set(false);
    fixture.detectChanges();
    trigger().focus();
    await open();
    expect(document.activeElement).toBe(trigger());
  });

  it('forwards disclosure ARIA and focus restoration through pixel-button hosts', async () => {
    await fixture.whenStable();
    const customTrigger = fixture.nativeElement.querySelector(
      '.custom-trigger button',
    ) as HTMLButtonElement;

    expect(customTrigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(customTrigger.getAttribute('aria-expanded')).toBe('false');

    customTrigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(customTrigger.getAttribute('aria-expanded')).toBe('true');
    expect(customTrigger.getAttribute('aria-controls')).toBe(host.popover().panelId);

    panel().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(customTrigger);
  });
});

describe('PixelPopoverComponent nested menu', () => {
  let fixture: ComponentFixture<NestedMenuHostComponent>;
  let host: NestedMenuHostComponent;

  beforeEach(async () => {
    (globalThis as Record<string, unknown>)['ResizeObserver'] ??= ResizeObserverMock;
    await TestBed.configureTestingModule({ imports: [NestedMenuHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(NestedMenuHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    host.menu().close({ restoreFocus: false });
    host.popover().close({ restoreFocus: false });
  });

  it('stays open when focus moves into a nested menu overlay', async () => {
    const trigger = fixture.nativeElement.querySelector('.trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const overflow = document.querySelector('.pixel-popover__panel .overflow') as HTMLButtonElement;
    overflow.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(host.menu().opened()).toBe(true);
    expect(host.popover().opened()).toBe(true);

    const menuItem = document.querySelector('.pixel-menu__panel [role="menuitem"]') as HTMLElement;
    expect(menuItem).toBeTruthy();
    overflow.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: menuItem }),
    );
    fixture.detectChanges();
    expect(host.popover().opened()).toBe(true);
  });
});
