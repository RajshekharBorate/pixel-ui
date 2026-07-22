import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelNotificationItemComponent, {
  type PixelNotificationItemActionEvent,
  type PixelNotificationItemActivateEvent,
  type PixelNotificationItemOverflowEvent,
} from './pixel-notification-item';
import type { PixelNotification } from './pixel-notification.types';

function notification(
  patch: Partial<PixelNotification> = {},
): PixelNotification {
  return {
    id: 'notification-1',
    title: 'Approval required',
    message: 'Travel request TR-104 is waiting.',
    severity: 'warning',
    priority: 'high',
    state: 'default',
    category: 'Approvals',
    source: 'Workflow',
    icon: '',
    imageSrc: '',
    createdAt: new Date('2026-07-19T12:00:00Z').getTime(),
    updatedAt: new Date('2026-07-19T12:00:00Z').getTime(),
    expiresAt: null,
    readAt: null,
    archivedAt: null,
    progress: null,
    occurrences: 1,
    actions: [
      { id: 'review', label: 'Review', appearance: 'primary' },
      { id: 'later', label: 'Later' },
      { id: 'archive', label: 'Archive' },
    ],
    channels: ['inbox'],
    dedupeKey: 'approval:TR-104',
    data: {},
    ...patch,
  };
}

@Component({
  imports: [PixelNotificationItemComponent],
  template: `
    <section [attr.data-theme]="theme()">
      <pixel-notification-item
        [notification]="item()"
        [density]="density()"
        [disabled]="disabled()"
        [showSkeleton]="showSkeleton()"
        [timestampMode]="timestampMode()"
        [timestampLabel]="timestampLabel()"
        [avatarText]="avatarText()"
        [showDismiss]="showDismiss()"
        (activated)="activatedEvents.push($event)"
        (actionClicked)="actionEvents.push($event)"
        (overflowClicked)="overflowEvents.push($event)"
        (dismissClicked)="dismissEvents.push($event)"
      >
        <span pixelNotificationMeta class="meta-probe">Custom meta</span>
        <button pixelNotificationActions class="projection-probe" type="button">Projected</button>
      </pixel-notification-item>
    </section>
  `,
})
class HostComponent {
  readonly item = signal(notification());
  readonly density = signal<'compact' | 'default'>('default');
  readonly disabled = signal(false);
  readonly showSkeleton = signal(false);
  readonly timestampMode = signal<'relative' | 'absolute'>('relative');
  readonly timestampLabel = signal('');
  readonly avatarText = signal('');
  readonly showDismiss = signal(false);
  readonly theme = signal<'light' | 'dark'>('light');
  readonly activatedEvents: PixelNotificationItemActivateEvent[] = [];
  readonly actionEvents: PixelNotificationItemActionEvent[] = [];
  readonly overflowEvents: PixelNotificationItemOverflowEvent[] = [];
  readonly dismissEvents: PixelNotificationItemActivateEvent[] = [];
}

describe('PixelNotificationItemComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function itemElement(): HTMLElement {
    return fixture.nativeElement.querySelector('pixel-notification-item') as HTMLElement;
  }

  it('renders canonical copy, source metadata, timestamp, and unread state', () => {
    expect(itemElement().querySelector('.pixel-notification-item__title')?.textContent).toContain(
      'Approval required',
    );
    expect(itemElement().querySelector('.pixel-notification-item__message')?.textContent).toContain(
      'TR-104',
    );
    expect(itemElement().getAttribute('data-read')).toBe('false');
    expect(itemElement().querySelector('.pixel-notification-item--unread')).toBeTruthy();
    expect(itemElement().querySelector('.pixel-notification-item__unread-dot')).toBeTruthy();
    // Source initials use pixel-avatar; severity icons are the fallback when no person media exists.
    expect(itemElement().querySelector('pixel-avatar')).toBeTruthy();
    expect(itemElement().querySelector('time')?.getAttribute('datetime')).toContain('2026-07-19');
  });

  it('uses pixel-avatar for photo/initials and flat Material icons for icon-only rows', () => {
    host.item.set(notification({ imageSrc: 'https://example.com/a.png', source: '' }));
    fixture.detectChanges();
    expect(itemElement().querySelector('pixel-avatar')).toBeTruthy();
    expect(itemElement().querySelector('.pixel-notification-item__icon')).toBeNull();

    host.item.set(notification({ imageSrc: '', source: '' }));
    host.avatarText.set('AB');
    fixture.detectChanges();
    expect(itemElement().querySelector('pixel-avatar')).toBeTruthy();
    expect(itemElement().querySelector('.pixel-notification-item__icon')).toBeNull();

    host.avatarText.set('');
    host.item.set(notification({ imageSrc: '', source: '', icon: 'campaign' }));
    fixture.detectChanges();
    expect(itemElement().querySelector('pixel-avatar')).toBeNull();
    expect(itemElement().querySelector('.pixel-notification-item__icon')?.textContent).toContain(
      'campaign',
    );

    host.item.set(notification({ imageSrc: '', source: '', icon: '', severity: 'warning' }));
    fixture.detectChanges();
    expect(itemElement().querySelector('pixel-avatar')).toBeNull();
    expect(itemElement().querySelector('.pixel-notification-item__icon')?.textContent).toContain(
      'warning',
    );
  });

  it('defaults to a relative timestamp with an absolute title tooltip', () => {
    host.item.set(notification({ createdAt: Date.now() - 5 * 60_000 }));
    fixture.detectChanges();
    const time = itemElement().querySelector('time') as HTMLTimeElement;
    expect(time.textContent?.trim().toLowerCase()).toMatch(/minute/);
    expect(time.getAttribute('title')?.length).toBeGreaterThan(0);
  });

  it('supports absolute mode and explicit timestampLabel overrides', () => {
    host.item.set(notification({ createdAt: Date.now() - 5 * 60_000 }));
    host.timestampMode.set('absolute');
    fixture.detectChanges();
    const absolute = itemElement().querySelector('time')?.textContent?.trim() ?? '';
    expect(absolute.toLowerCase()).not.toMatch(/minute ago|minutes ago|^now$/);

    host.timestampLabel.set('Custom stamp');
    fixture.detectChanges();
    expect(itemElement().querySelector('time')?.textContent?.trim()).toBe('Custom stamp');
  });

  it('provides native keyboard activation and connected accessible descriptions', () => {
    const control = itemElement().querySelector(
      '.pixel-notification-item__main',
    ) as HTMLButtonElement;
    const article = itemElement().querySelector('article') as HTMLElement;

    expect(control.tagName).toBe('BUTTON');
    expect(control.getAttribute('aria-label')).toContain('Approval required');
    expect(article.getAttribute('aria-labelledby')).toContain('-title');
    expect(article.getAttribute('aria-describedby')).toContain('-status');

    control.click();
    expect(host.activatedEvents).toHaveLength(1);
    expect(host.activatedEvents[0].source).toBe('keyboard');
  });

  it('reacts to read, failed, archived, progress, density, and dark-theme changes', () => {
    host.item.set(
      notification({
        readAt: Date.now(),
        archivedAt: Date.now(),
        state: 'failed',
        progress: 48,
      }),
    );
    host.density.set('compact');
    host.theme.set('dark');
    fixture.detectChanges();

    expect(itemElement().getAttribute('data-read')).toBe('true');
    expect(itemElement().getAttribute('data-archived')).toBe('true');
    expect(itemElement().getAttribute('data-state')).toBe('failed');
    expect(itemElement().getAttribute('data-density')).toBe('compact');
    expect(itemElement().querySelector('.pixel-notification-item--unread')).toBeNull();
    expect(itemElement().querySelector('pixel-chip.pixel-notification-item__state')?.textContent).toContain(
      'Failed',
    );
    expect(itemElement().querySelector('pixel-progress-bar')).toBeTruthy();
  });

  it('emits typed inline action and overflow intents without activating the item', () => {
    const buttons = itemElement().querySelectorAll('pixel-button button');
    (buttons[0] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(host.actionEvents).toHaveLength(1);
    expect(host.actionEvents[0].action.id).toBe('review');
    expect(host.activatedEvents).toHaveLength(0);

    const overflow = itemElement().querySelector(
      '.pixel-notification-item__aside pixel-button button',
    ) as HTMLButtonElement;
    overflow.click();
    expect(host.overflowEvents[0].hiddenActions.map((action) => action.id)).toEqual(['archive']);
  });

  it('prefers dismiss over overflow and emits dismissClicked', () => {
    host.showDismiss.set(true);
    fixture.detectChanges();

    const dismiss = itemElement().querySelector(
      '.pixel-notification-item__aside pixel-button button',
    ) as HTMLButtonElement;
    expect(
      itemElement().querySelector('.pixel-notification-item__aside .material-symbols-outlined')
        ?.textContent,
    ).toContain('close');
    dismiss.click();
    expect(host.dismissEvents).toHaveLength(1);
    expect(host.overflowEvents).toHaveLength(0);
    expect(host.activatedEvents).toHaveLength(0);
  });

  it('disables every built-in interaction and exposes disabled semantics', () => {
    host.disabled.set(true);
    fixture.detectChanges();

    const main = itemElement().querySelector(
      '.pixel-notification-item__main',
    ) as HTMLButtonElement;
    expect(main.disabled).toBe(true);
    expect(
      Array.from(itemElement().querySelectorAll('pixel-button button')).every(
        (button) => (button as HTMLButtonElement).disabled,
      ),
    ).toBe(true);
  });

  it('renders projected meta/actions and a footprint-matched skeleton', () => {
    expect(itemElement().querySelector('.meta-probe')).toBeTruthy();
    expect(itemElement().querySelector('.projection-probe')).toBeTruthy();

    host.showSkeleton.set(true);
    fixture.detectChanges();
    expect(itemElement().getAttribute('aria-busy')).toBe('true');
    expect(itemElement().querySelectorAll('pixel-skeleton')).toHaveLength(3);
    expect(itemElement().querySelector('.pixel-notification-item__main')).toBeNull();
  });

  it('preserves semantic state in dark theme and declares reduced-motion styling', () => {
    host.theme.set('dark');
    host.item.set(notification({ state: 'completed', readAt: Date.now() }));
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-theme="dark"]'),
    ).toBeTruthy();
    expect(
      itemElement().querySelector('pixel-chip.pixel-notification-item__state')?.textContent,
    ).toContain('Completed');
    expect(document.head.textContent).toContain('prefers-reduced-motion: reduce');
  });
});
