import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelAppShellComponent from '../pixel-app-shell/pixel-app-shell';
import PixelHeaderComponent from './pixel-header';

@Component({
  imports: [PixelHeaderComponent],
  template: `
    <pixel-header [sticky]="sticky()" [bordered]="bordered()">
      <h1>Title</h1>
      <button pixelHeaderActions type="button">Action</button>
    </pixel-header>
  `,
})
class HostComponent {
  readonly sticky = signal(false);
  readonly bordered = signal(true);
}

@Component({
  imports: [PixelAppShellComponent, PixelHeaderComponent],
  template: `
    <pixel-app-shell>
      <pixel-header sticky bordered><h1>Title</h1></pixel-header>
      <p>Content</p>
    </pixel-app-shell>
  `,
})
class InAppShellHostComponent {}

describe('PixelHeaderComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function getHeader(): HTMLElement {
    return fixture.nativeElement.querySelector('pixel-header') as HTMLElement;
  }

  it('renders a native <header> and projects default + actions content', () => {
    const el = getHeader();
    expect(el.querySelector('header')).toBeTruthy();
    expect(el.querySelector('h1')?.textContent).toBe('Title');
    expect(el.querySelector('.pixel-header__actions button')?.textContent).toBe('Action');
    expect(el.classList.contains('pixel-header--bordered')).toBe(true);
    expect(el.classList.contains('pixel-header--sticky')).toBe(false);
  });

  it('reacts to sticky and bordered changes', () => {
    host.sticky.set(true);
    host.bordered.set(false);
    fixture.detectChanges();

    const el = getHeader();
    expect(el.classList.contains('pixel-header--sticky')).toBe(true);
    expect(el.classList.contains('pixel-header--bordered')).toBe(false);
  });

  describe('composed inside pixel-app-shell', () => {
    it('suppresses its own sticky and bordered classes even though both inputs are true, since the shell provides its own wrapper-level sticky and toolbar-divider instead', () => {
      const appShellFixture = TestBed.createComponent(InAppShellHostComponent);
      appShellFixture.detectChanges();

      const el = appShellFixture.nativeElement.querySelector('pixel-header') as HTMLElement;
      expect(el.classList.contains('pixel-header--sticky')).toBe(false);
      expect(el.classList.contains('pixel-header--bordered')).toBe(false);
    });
  });
});
