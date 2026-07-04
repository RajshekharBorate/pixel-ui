import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelCardComponent, {
  PixelCardActivateEvent,
  PixelCardAppearance,
  PixelCardPadding,
} from './pixel-card';

@Component({
  imports: [PixelCardComponent],
  template: `
    <section class="theme-shell" [attr.data-theme]="theme()">
      <pixel-card
        [appearance]="appearance()"
        [padding]="padding()"
        [cardTitle]="cardTitle()"
        [cardSubtitle]="cardSubtitle()"
        [interactive]="interactive()"
        [disabled]="disabled()"
        [selectable]="selectable()"
        [selected]="selected()"
        [showSkeleton]="showSkeleton()"
        ariaLabel="Test card"
        (activate)="onActivate($event)"
      >
        <img pixelCardMedia src="data:," alt="" />
        <span class="body-probe">Body content</span>
        <button pixelCardActions type="button" class="action-probe">Open</button>
      </pixel-card>
    </section>
  `,
})
class HostComponent {
  readonly appearance = signal<PixelCardAppearance>('elevated');
  readonly padding = signal<PixelCardPadding>('md');
  readonly cardTitle = signal('');
  readonly cardSubtitle = signal('');
  readonly interactive = signal(false);
  readonly disabled = signal(false);
  readonly selectable = signal(false);
  readonly selected = signal(false);
  readonly showSkeleton = signal(false);
  readonly theme = signal<'light' | 'dark'>('light');
  readonly events: PixelCardActivateEvent[] = [];

  onActivate(event: PixelCardActivateEvent): void {
    this.events.push(event);
  }
}

describe('PixelCardComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function card(): HTMLElement {
    return fixture.nativeElement.querySelector('pixel-card') as HTMLElement;
  }

  it('renders projected body, media, and actions content', () => {
    expect(card().querySelector('.body-probe')?.textContent).toContain('Body content');
    expect(card().querySelector('.pixel-card__media img')).toBeTruthy();
    expect(card().querySelector('.pixel-card__actions .action-probe')).toBeTruthy();
  });

  it('is a non-interactive plain surface by default', () => {
    expect(card().getAttribute('role')).toBeNull();
    expect(card().getAttribute('tabindex')).toBeNull();
    expect(card().getAttribute('data-appearance')).toBe('elevated');
  });

  it('reacts to appearance and padding changes', () => {
    host.appearance.set('outlined');
    host.padding.set('none');
    fixture.detectChanges();
    expect(card().getAttribute('data-appearance')).toBe('outlined');
    expect(card().getAttribute('data-padding')).toBe('none');
  });

  it('renders the built-in header only when title or subtitle is set', () => {
    expect(card().querySelector('.pixel-card__title')).toBeNull();
    host.cardTitle.set('Report');
    host.cardSubtitle.set('Updated today');
    fixture.detectChanges();
    expect(card().querySelector('.pixel-card__title')?.textContent).toContain('Report');
    expect(card().querySelector('.pixel-card__subtitle')?.textContent).toContain('Updated today');
  });

  it('exposes button semantics when interactive', () => {
    host.interactive.set(true);
    fixture.detectChanges();
    expect(card().getAttribute('role')).toBe('button');
    expect(card().getAttribute('tabindex')).toBe('0');
    expect(card().getAttribute('aria-disabled')).toBe('false');
    expect(card().getAttribute('aria-label')).toBe('Test card');
  });

  it('activates on click, Enter, and Space (keyup), tracking the source', () => {
    host.interactive.set(true);
    fixture.detectChanges();

    card().dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    card().click();
    expect(host.events.length).toBe(1);
    expect(host.events[0].source).toBe('mouse');

    card().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(host.events.length).toBe(2);
    expect(host.events[1].source).toBe('keyboard');

    card().dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(host.events.length).toBe(2);
    card().dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));
    expect(host.events.length).toBe(3);
    expect(host.events[2].source).toBe('keyboard');
  });

  it('blocks activation and leaves the tab order when disabled', () => {
    host.interactive.set(true);
    host.disabled.set(true);
    fixture.detectChanges();

    expect(card().getAttribute('tabindex')).toBeNull();
    expect(card().getAttribute('aria-disabled')).toBe('true');
    card().click();
    card().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(host.events.length).toBe(0);
  });

  it('reflects selection through aria-pressed for selectable interactive cards', () => {
    host.interactive.set(true);
    host.selectable.set(true);
    fixture.detectChanges();
    expect(card().getAttribute('aria-pressed')).toBe('false');

    host.selected.set(true);
    fixture.detectChanges();
    expect(card().getAttribute('aria-pressed')).toBe('true');
    expect(card().classList.contains('pixel-card--selected')).toBe(true);
  });

  it('swaps to a skeleton placeholder and back', () => {
    host.showSkeleton.set(true);
    fixture.detectChanges();
    expect(card().querySelector('pixel-skeleton')).toBeTruthy();
    expect(card().querySelector('.pixel-card__body')).toBeNull();

    host.showSkeleton.set(false);
    fixture.detectChanges();
    expect(card().querySelector('pixel-skeleton')).toBeNull();
    expect(card().querySelector('.body-probe')).toBeTruthy();
  });
});
