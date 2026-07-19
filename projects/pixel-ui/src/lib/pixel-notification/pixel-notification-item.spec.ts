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
        (activated)="activatedEvents.push($event)"
        (actionClicked)="actionEvents.push($event)"
        (overflowClicked)="overflowEvents.push($event)"
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
  readonly theme = signal<'light' | 'dark'>('light');
  readonly activatedEvents: PixelNotificationItemActivateEvent[] = [];
  readonly actionEvents: PixelNotificationItemActionEvent[] = [];
  readonly overflowEvents: PixelNotificationItemOverflowEvent[] = [];
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
    expect(itemElement().querySelector('.pixel-notification-item__unread-dot')).toBeTruthy();
    expect(itemElement().querySelector('time')?.getAttribute('datetime')).toContain('2026-07-19');
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
    expect(itemElement().querySelector('.pixel-notification-item__unread-dot')).toBeNull();
    expect(itemElement().querySelector('pixel-progress-bar')).toBeTruthy();
    expect(itemElement().querySelector('.pixel-notification-item__state--failed')).toBeTruthy();
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
    expect(itemElement().querySelector('.pixel-notification-item__state')?.textContent).toContain(
      'Completed',
    );
    expect(document.head.textContent).toContain('prefers-reduced-motion: reduce');
  });
});
