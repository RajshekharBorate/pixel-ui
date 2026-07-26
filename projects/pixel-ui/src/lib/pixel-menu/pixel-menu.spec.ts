import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelMenuComponent from './pixel-menu';
import PixelMenuItemComponent from './pixel-menu-item';
import PixelMenuTriggerDirective from './pixel-menu-trigger';
import PixelButtonComponent from '../pixel-button/pixel-button';

@Component({
  imports: [
    PixelMenuComponent,
    PixelMenuItemComponent,
    PixelMenuTriggerDirective,
    PixelButtonComponent,
  ],
  template: `
    <pixel-button [pixelMenuTriggerFor]="actions">Actions</pixel-button>
    <pixel-menu #actions ariaLabel="Actions">
      <pixel-menu-item (selected)="selected.set(selected() + 1)">Edit</pixel-menu-item>
    </pixel-menu>

    <div
      class="ctx"
      tabindex="0"
      [pixelMenuTriggerFor]="ctx"
      pixelMenuTrigger="contextmenu"
    >
      Surface
    </div>
    <pixel-menu #ctx ariaLabel="Context">
      <pixel-menu-item (selected)="ctxSelected.set(ctxSelected() + 1)">Copy</pixel-menu-item>
    </pixel-menu>
  `,
})
class HostComponent {
  readonly actionsRef = viewChild.required<PixelMenuComponent>('actions');
  readonly ctxRef = viewChild.required<PixelMenuComponent>('ctx');
  readonly selected = signal(0);
  readonly ctxSelected = signal(0);
}

describe('PixelMenuComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('opens on click from pixelMenuTriggerFor', async () => {
    const trigger = fixture.nativeElement.querySelector('pixel-button button') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.actionsRef().opened()).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe(host.actionsRef().panelId);
  });

  it('opens on contextmenu at the pointer', async () => {
    const surface = fixture.nativeElement.querySelector('.ctx') as HTMLElement;
    surface.dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 40, clientY: 60 }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.ctxRef().opened()).toBe(true);
    expect(document.querySelector('.pixel-overlay-point-origin')).toBeTruthy();
    expect(document.querySelector('.pixel-menu__panel--open')).toBeTruthy();
  });

  it('opens context menu via Shift+F10 near the focused surface', async () => {
    const surface = fixture.nativeElement.querySelector('.ctx') as HTMLElement;
    surface.focus();
    surface.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'F10', shiftKey: true, bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.ctxRef().opened()).toBe(true);
  });
});
