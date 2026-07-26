import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelSplitButtonComponent from './pixel-split-button';
import PixelMenuComponent from '../pixel-menu/pixel-menu';
import PixelMenuItemComponent from '../pixel-menu/pixel-menu-item';

@Component({
  imports: [PixelSplitButtonComponent, PixelMenuComponent, PixelMenuItemComponent],
  template: `
    <pixel-split-button
      [menu]="saveMenu"
      [disabled]="disabled()"
      [appearance]="appearance()"
      menuAriaLabel="More save options"
      (click)="primaryClicks.set(primaryClicks() + 1)"
    >
      Save
    </pixel-split-button>
    <pixel-menu #saveMenu ariaLabel="Save options">
      <pixel-menu-item (selected)="menuSelects.set(menuSelects() + 1)">Save as…</pixel-menu-item>
    </pixel-menu>
  `,
})
class HostComponent {
  readonly saveMenuRef = viewChild.required<PixelMenuComponent>('saveMenu');
  readonly disabled = signal(false);
  readonly appearance = signal<'solid' | 'outline'>('solid');
  readonly primaryClicks = signal(0);
  readonly menuSelects = signal(0);
}

describe('PixelSplitButtonComponent', () => {
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

  it('renders primary and caret segments', () => {
    const split = fixture.nativeElement.querySelector('pixel-split-button') as HTMLElement;
    expect(split.getAttribute('role')).toBe('group');
    const buttons = split.querySelectorAll('button.pixel-button');
    expect(buttons.length).toBe(2);
    expect(buttons[0]?.textContent).toContain('Save');
    expect(buttons[1]?.getAttribute('aria-label')).toBe('More save options');
    expect(buttons[1]?.getAttribute('aria-haspopup')).toBe('menu');
  });

  it('emits click from the primary segment only', () => {
    const primary = fixture.nativeElement.querySelector(
      '.pixel-split-button__primary button',
    ) as HTMLButtonElement;
    primary.click();
    fixture.detectChanges();
    expect(host.primaryClicks()).toBe(1);
  });

  it('opens the menu from the caret', async () => {
    const caret = fixture.nativeElement.querySelector(
      '.pixel-split-button__caret button',
    ) as HTMLButtonElement;
    caret.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.saveMenuRef().opened()).toBe(true);
    expect(document.querySelector('.pixel-menu__panel--open')).toBeTruthy();
  });
});
