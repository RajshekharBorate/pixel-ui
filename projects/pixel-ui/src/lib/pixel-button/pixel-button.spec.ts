import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelButtonComponent, { PixelButtonChangeEvent } from './pixel-button';
import {
  PIXEL_SYS_COLOR,
  PIXEL_TEST_THEME,
  cssVar,
  expectDarkSysPrimary,
  expectLightSysPrimary,
} from '../../testing/theme-tokens';
import type { PixelThemeId } from '../theme/pixel-theme';

@Component({
  imports: [PixelButtonComponent],
  template: `
    <section class="theme-shell" [attr.data-theme]="theme()">
      <pixel-button
        [size]="size()"
        [state]="state()"
        [appearance]="appearance()"
        [fabShape]="fabShape()"
        [toggleable]="toggleable()"
        [pressed]="pressed()"
        [className]="className()"
        [ngClass]="ngClass()"
        [ariaLabel]="ariaLabel()"
        [ariaDescribedBy]="ariaDescribedBy()"
        [leadingIcon]="leadingIcon()"
        [fullWidth]="fullWidth()"
        (click)="handleClick($event)"
        (change)="handleChange($event)"
        (toggle)="handleToggle($event)"
      >
        Host Button
      </pixel-button>
      <p id="button-help">Helpful copy</p>
    </section>
  `,
})
class HostComponent {
  readonly size = signal<'xs' | 'sm' | 'md' | 'lg'>('md');
  readonly state = signal<'default' | 'disabled' | 'error' | 'success' | 'loading'>('default');
  readonly appearance = signal<'solid' | 'outline' | 'text' | 'icon' | 'mini-fab'>('solid');
  readonly fabShape = signal<'circle' | 'square'>('circle');
  readonly toggleable = signal(false);
  readonly pressed = signal(false);
  readonly className = signal('external-class');
  readonly ngClass = signal<Record<string, boolean>>({ highlighted: true });
  readonly ariaLabel = signal('Host button');
  readonly ariaDescribedBy = signal('button-help');
  readonly leadingIcon = signal('OK');
  readonly fullWidth = signal(false);
  readonly theme = signal<PixelThemeId>(PIXEL_TEST_THEME.light);
  clickEvents: Array<MouseEvent | KeyboardEvent> = [];
  changeEvents: PixelButtonChangeEvent[] = [];
  toggleEvents: boolean[] = [];

  handleClick(event: MouseEvent | KeyboardEvent): void {
    this.clickEvents.push(event);
  }

  handleChange(event: PixelButtonChangeEvent): void {
    this.changeEvents.push(event);
    this.pressed.set(event.pressed);
  }

  handleToggle(event: boolean): void {
    this.toggleEvents.push(event);
  }
}

describe('PixelButtonComponent', () => {
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

  function getNativeButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  }

  function getComponentInstance(): PixelButtonComponent {
    return fixture.debugElement.children[0].children[0].componentInstance as PixelButtonComponent;
  }

  it('creates the host and component', () => {
    expect(host).toBeTruthy();
    expect(getComponentInstance()).toBeTruthy();
  });

  it('reacts to input signal changes', () => {
    host.size.set('lg');
    host.appearance.set('outline');
    host.fullWidth.set(true);
    fixture.detectChanges();

    const button = getNativeButton();
    expect(button.classList.contains('pixel-button--lg')).toBe(true);
    expect(button.classList.contains('pixel-button--outline')).toBe(true);
    expect(button.classList.contains('pixel-button--full-width')).toBe(true);
  });

  it('renders icon and mini-fab appearances with icon-only layout', () => {
    host.appearance.set('icon');
    host.leadingIcon.set('close');
    fixture.detectChanges();

    let button = getNativeButton();
    let icon = button.querySelector('.pixel-button__icon--only') as HTMLElement;
    let label = button.querySelector('.pixel-button__label') as HTMLElement | null;

    expect(button.classList.contains('pixel-button--icon')).toBe(true);
    expect(icon?.textContent?.trim()).toBe('close');
    expect(label).toBeNull();

    host.appearance.set('mini-fab');
    host.leadingIcon.set('edit');
    fixture.detectChanges();

    button = getNativeButton();
    icon = button.querySelector('.pixel-button__icon--only') as HTMLElement;
    expect(button.classList.contains('pixel-button--mini-fab')).toBe(true);
    expect(icon?.textContent?.trim()).toBe('edit');
    expect(button.classList.contains('pixel-button--shape-square')).toBe(false);

    host.fabShape.set('square');
    fixture.detectChanges();

    button = getNativeButton();
    expect(button.classList.contains('pixel-button--shape-square')).toBe(true);
    expect(button.getAttribute('data-icon-shape')).toBe('square');

    host.appearance.set('icon');
    host.leadingIcon.set('close');
    fixture.detectChanges();

    button = getNativeButton();
    expect(button.classList.contains('pixel-button--icon')).toBe(true);
    expect(button.classList.contains('pixel-button--shape-square')).toBe(true);
    expect(button.getAttribute('data-icon-shape')).toBe('square');

    host.fabShape.set('circle');
    fixture.detectChanges();

    button = getNativeButton();
    expect(button.classList.contains('pixel-button--shape-square')).toBe(false);
    expect(button.getAttribute('data-icon-shape')).toBe('circle');
  });

  it('normalizes custom classes without ngClass', () => {
    const button = getNativeButton();
    expect(button.classList.contains('external-class')).toBe(true);
    expect(button.classList.contains('highlighted')).toBe(true);
  });

  it('emits click events on activation', () => {
    const button = getNativeButton();
    button.click();

    expect(host.clickEvents).toHaveLength(1);
  });

  it('emits change and toggle events for controlled toggle interactions', () => {
    host.toggleable.set(true);
    fixture.detectChanges();

    const button = getNativeButton();
    button.click();
    fixture.detectChanges();

    expect(host.changeEvents).toHaveLength(1);
    expect(host.changeEvents[0]).toMatchObject({
      pressed: true,
      state: 'default',
      source: 'mouse',
    });
    expect(host.toggleEvents).toEqual([true]);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.classList.contains('pixel-button--pressed')).toBe(true);
  });

  it('updates computed disabled and loading state when inputs change', () => {
    host.state.set('loading');
    fixture.detectChanges();

    const component = getComponentInstance();
    const button = getNativeButton();

    expect(component['resolvedState']()).toBe('loading');
    expect(component['isLoading']()).toBe(true);
    expect(component['isDisabled']()).toBe(true);
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.querySelector('pixel-loader.pixel-button__loader')).toBeTruthy();
  });

  it('tracks keyboard interaction state for accessibility', () => {
    host.toggleable.set(true);
    fixture.detectChanges();

    const button = getNativeButton();
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    expect(button.classList.contains('pixel-button--keyboard-active')).toBe(true);

    button.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
    fixture.detectChanges();

    expect(button.classList.contains('pixel-button--keyboard-active')).toBe(false);
    expect(button.getAttribute('aria-label')).toBe('Host button');
    expect(button.getAttribute('aria-describedby')).toContain('button-help');
  });

  it('exposes the component CSS variables in light mode', () => {
    const hostElement = fixture.nativeElement.querySelector('pixel-button') as HTMLElement;

    expectLightSysPrimary(hostElement);
    expect(cssVar(hostElement, '--pixel-button-text-primary')).toBe(
      'var(--pixel-sys-on-primary, #ffffff)',
    );
    expect(cssVar(hostElement, '--pixel-button-bg')).toBe('var(--pixel-sys-primary, #2962ff)');
  });

  it('switches CSS variables when a dark theme parent is applied', () => {
    host.theme.set(PIXEL_TEST_THEME.dark);
    fixture.detectChanges();

    const hostElement = fixture.nativeElement.querySelector('pixel-button') as HTMLElement;

    expectDarkSysPrimary(hostElement);
    expect(cssVar(hostElement, '--pixel-sys-surface-container-low')).toBe(
      PIXEL_SYS_COLOR.dark.surfaceContainerLow,
    );
    expect(cssVar(hostElement, '--pixel-button-surface')).toBe(
      'var(--pixel-sys-surface-container-low, #fdfbff)',
    );
  });

  it('prevents interaction when disabled', () => {
    host.state.set('disabled');
    host.toggleable.set(true);
    fixture.detectChanges();

    const button = getNativeButton();
    button.click();

    expect(host.clickEvents).toHaveLength(0);
    expect(host.changeEvents).toHaveLength(0);
    expect(button.getAttribute('aria-disabled')).toBe('true');
  });
});
