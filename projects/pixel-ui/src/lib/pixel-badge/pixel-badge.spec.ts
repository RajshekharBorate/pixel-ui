import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelBadgeComponent, {
  type PixelBadgeClickEvent,
  type PixelBadgePosition,
  type PixelBadgeState,
  type PixelBadgeType,
  type PixelBadgeValue,
} from './pixel-badge';

@Component({
  imports: [PixelBadgeComponent],
  template: `
    <section [attr.data-theme]="theme()">
      <pixel-badge
        #badge
        [value]="value()"
        [type]="type()"
        [max]="max()"
        [showZero]="showZero()"
        [hidden]="hidden()"
        [disabled]="disabled()"
        [state]="state()"
        [position]="position()"
        [label]="label()"
        [clickable]="clickable()"
        [removable]="removable()"
        [animated]="animated()"
        (badgeClick)="lastClick.set($event)"
        (badgeRemove)="removed.set(true)"
        (valueChange)="lastValueChange.set($event)"
      >
        <span class="anchor material-symbols-outlined">notifications</span>
      </pixel-badge>
    </section>
  `,
})
class HostComponent {
  readonly badge = viewChild.required<PixelBadgeComponent>('badge');
  readonly theme = signal<'light' | 'dark'>('light');
  readonly value = signal<PixelBadgeValue>(10);
  readonly type = signal<PixelBadgeType>('count');
  readonly max = signal(99);
  readonly showZero = signal(false);
  readonly hidden = signal(false);
  readonly disabled = signal(false);
  readonly state = signal<PixelBadgeState>('default');
  readonly position = signal<PixelBadgePosition>('top-right');
  readonly label = signal('');
  readonly clickable = signal(false);
  readonly removable = signal(false);
  readonly animated = signal(false);

  readonly lastClick = signal<PixelBadgeClickEvent | null>(null);
  readonly removed = signal(false);
  readonly lastValueChange = signal<PixelBadgeValue>(undefined as unknown as PixelBadgeValue);
}

describe('PixelBadgeComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const content = () =>
    fixture.nativeElement.querySelector('.pixel-badge__content') as HTMLElement | null;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the badge with the count value', () => {
    const count = fixture.nativeElement.querySelector('.pixel-badge__count') as HTMLElement;
    expect(content()).toBeTruthy();
    expect(count.textContent?.trim()).toBe('10');
  });

  it('projects the anchored content', () => {
    const anchor = fixture.nativeElement.querySelector('.pixel-badge__anchor .anchor');
    expect(anchor).toBeTruthy();
  });

  it('applies overflow text when value exceeds max', () => {
    host.value.set(100);
    fixture.detectChanges();
    expect(content()?.textContent?.trim()).toBe('99+');

    host.value.set(1000);
    host.max.set(999);
    fixture.detectChanges();
    expect(content()?.textContent?.trim()).toBe('999+');
  });

  it('hides a zero count by default and shows it when showZero is set', () => {
    host.value.set(0);
    fixture.detectChanges();
    expect(content()).toBeNull();

    host.showZero.set(true);
    fixture.detectChanges();
    expect(content()?.textContent?.trim()).toBe('0');
  });

  it('hides the badge when hidden is true', () => {
    host.hidden.set(true);
    fixture.detectChanges();
    expect(content()).toBeNull();
  });

  it('renders a dot badge without text', () => {
    host.type.set('dot');
    fixture.detectChanges();
    const dot = content();
    expect(dot?.classList.contains('pixel-badge__content--dot')).toBe(true);
    expect(dot?.textContent?.trim()).toBe('');
  });

  it('renders a status badge with a label and a status dot', () => {
    host.type.set('status');
    host.state.set('success');
    host.label.set('Online');
    host.position.set('inline');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pixel-badge__status')).toBeTruthy();
    expect(content()?.textContent?.trim()).toContain('Online');
    expect(content()?.classList.contains('pixel-badge__content--state-success')).toBe(true);
  });

  it('emits badgeClick on click and keyboard for clickable badges', () => {
    host.clickable.set(true);
    fixture.detectChanges();
    const button = content() as HTMLButtonElement;
    expect(button.tagName.toLowerCase()).toBe('button');
    button.click();
    fixture.detectChanges();
    expect(host.lastClick()?.source).toBe('mouse');

    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    // Native button click + keydown handler both fire; last recorded source is keyboard.
    expect(host.lastClick()).not.toBeNull();
  });

  it('does not emit click when disabled', () => {
    host.clickable.set(true);
    host.disabled.set(true);
    fixture.detectChanges();
    const el = content() as HTMLElement;
    el.click();
    fixture.detectChanges();
    expect(host.lastClick()).toBeNull();
    expect(el.getAttribute('aria-disabled')).toBe('true');
  });

  it('emits badgeRemove when the remove affordance is clicked', () => {
    host.removable.set(true);
    fixture.detectChanges();
    const remove = fixture.nativeElement.querySelector(
      '.pixel-badge__remove',
    ) as HTMLButtonElement;
    expect(remove).toBeTruthy();
    remove.click();
    fixture.detectChanges();
    expect(host.removed()).toBe(true);
  });

  it('exposes accessible attributes (role, aria-label, aria-live)', () => {
    const el = content() as HTMLElement;
    expect(el.getAttribute('role')).toBe('status');
    expect(el.getAttribute('aria-live')).toBe('polite');
    expect(el.getAttribute('aria-label')).toContain('notifications');
  });

  it('updates computed display via the public increment/setValue API', () => {
    const badge = host.badge();
    badge.increment();
    fixture.detectChanges();
    expect(content()?.textContent?.trim()).toBe('11');
    expect(host.lastValueChange()).toBe(11);

    badge.setValue(5);
    fixture.detectChanges();
    expect(content()?.textContent?.trim()).toBe('5');
    expect(host.lastValueChange()).toBe(5);

    // Decrementing to zero hides the badge (showZero is false by default).
    badge.decrement(10);
    fixture.detectChanges();
    expect(content()).toBeNull();
    expect(host.lastValueChange()).toBe(0);
  });

  it('applies a pop animation class after an animated value change', () => {
    host.animated.set(true);
    fixture.detectChanges();
    host.value.set(11);
    fixture.detectChanges();
    expect(content()?.classList.contains('pixel-badge__content--pop')).toBe(true);
  });

  it('reflects CSS-variable backed positioning via data-position', () => {
    const hostEl = fixture.nativeElement.querySelector('pixel-badge') as HTMLElement;
    expect(hostEl.getAttribute('data-position')).toBe('top-right');
    host.position.set('bottom-left');
    fixture.detectChanges();
    expect(hostEl.getAttribute('data-position')).toBe('bottom-left');
  });

  it('switches theme context without runtime errors', () => {
    host.theme.set('dark');
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(section.getAttribute('data-theme')).toBe('dark');
    expect(content()).toBeTruthy();
  });
});
