import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelNotificationPanelComponent, {
  type PixelNotificationPanelCommandEvent,
  type PixelNotificationPanelFilter,
} from './pixel-notification-panel';
import type {
  PixelNotificationItemActionEvent,
  PixelNotificationItemActivateEvent,
  PixelNotificationItemOverflowEvent,
} from './pixel-notification-item';
import type { PixelNotification } from './pixel-notification.types';

const now = new Date('2026-07-19T12:00:00Z').getTime();

function record(
  id: string,
  patch: Partial<PixelNotification> = {},
): PixelNotification {
  return {
    id,
    title: `Notification ${id}`,
    message: `Details for ${id}`,
    severity: 'info',
    priority: 'normal',
    state: 'default',
    category: 'System',
    source: 'Pixel UI',
    icon: '',
    imageSrc: '',
    createdAt: now,
    updatedAt: now,
    expiresAt: null,
    readAt: null,
    archivedAt: null,
    progress: null,
    occurrences: 1,
    actions: [],
    channels: ['inbox'],
    dedupeKey: id,
    data: {},
    ...patch,
  };
}

@Component({
  imports: [PixelNotificationPanelComponent],
  template: `
    <pixel-notification-panel
      [notifications]="notifications()"
      [filter]="filter()"
      (filterChange)="filter.set($event)"
      [category]="category()"
      (categoryChange)="category.set($event)"
      [pageSize]="pageSize()"
      [loading]="loading()"
      [loadingMore]="loadingMore()"
      [hasMore]="hasMore()"
      [offline]="offline()"
      [errorMessage]="errorMessage()"
      [showViewAll]="showViewAll()"
      (notificationActivated)="activatedEvents.push($event)"
      (actionClicked)="actionEvents.push($event)"
      (overflowClicked)="overflowEvents.push($event)"
      (command)="commandEvents.push($event)"
    />
  `,
})
class HostComponent {
  readonly notifications = signal<readonly PixelNotification[]>([
    record('one', { category: 'Approvals', actions: [{ id: 'review', label: 'Review' }] }),
    record('two', { category: 'Reports', readAt: now }),
    record('three', { category: 'Reports' }),
  ]);
  readonly filter = signal<PixelNotificationPanelFilter>('all');
  readonly category = signal('');
  readonly pageSize = signal(2);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly hasMore = signal(false);
  readonly offline = signal(false);
  readonly errorMessage = signal('');
  readonly showViewAll = signal(true);
  readonly activatedEvents: PixelNotificationItemActivateEvent[] = [];
  readonly actionEvents: PixelNotificationItemActionEvent[] = [];
  readonly overflowEvents: PixelNotificationItemOverflowEvent[] = [];
  readonly commandEvents: PixelNotificationPanelCommandEvent[] = [];
}

describe('PixelNotificationPanelComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function panel(): HTMLElement {
    return fixture.nativeElement.querySelector('pixel-notification-panel') as HTMLElement;
  }

  function renderedItems(): NodeListOf<HTMLElement> {
    return panel().querySelectorAll('pixel-notification-item:not([aria-busy="true"])');
  }

  function buttonWithText(text: string): HTMLButtonElement {
    const buttons = Array.from(panel().querySelectorAll('button')) as HTMLButtonElement[];
    const button = buttons.find((candidate) => candidate.textContent?.trim().includes(text));
    if (!button) {
      throw new Error(`Button not found: ${text}`);
    }
    return button;
  }

  it('renders heading, unread count, filters, and a bounded initial record window', () => {
    expect(panel().querySelector('h2')?.textContent).toContain('Notifications');
    expect(panel().querySelector('.pixel-notification-panel__header p')?.textContent).toContain(
      '2 unread',
    );
    expect(renderedItems()).toHaveLength(2);
    expect(buttonWithText('All').getAttribute('aria-pressed')).toBe('true');
    expect(buttonWithText('Load more')).toBeTruthy();
  });

  it('reactively filters unread records and categories through controlled models', () => {
    buttonWithText('Unread').click();
    fixture.detectChanges();
    expect(host.filter()).toBe('unread');
    expect(renderedItems()).toHaveLength(2);

    buttonWithText('Reports').click();
    fixture.detectChanges();
    expect(host.category()).toBe('Reports');
    expect(renderedItems()).toHaveLength(1);
    expect(renderedItems()[0].textContent).toContain('Notification three');
  });

  it('increments the local render window before requesting an external page', () => {
    buttonWithText('Load more').click();
    fixture.detectChanges();
    expect(renderedItems()).toHaveLength(3);
    expect(host.commandEvents).toHaveLength(0);

    host.hasMore.set(true);
    fixture.detectChanges();
    buttonWithText('Load more').click();
    expect(host.commandEvents.at(-1)?.command).toBe('load-more');
  });

  it('emits typed mark-all, view-all, item activation, action, and overflow intents', () => {
    buttonWithText('Mark all read').click();
    buttonWithText('View all notifications').click();

    const firstItem = renderedItems()[0];
    (firstItem.querySelector('.pixel-notification-item__main') as HTMLButtonElement).click();
    (firstItem.querySelector('.pixel-notification-item__actions button') as HTMLButtonElement).click();
    (
      firstItem.querySelector(
        '.pixel-notification-item__aside pixel-button button',
      ) as HTMLButtonElement
    ).click();

    expect(host.commandEvents.map((event) => event.command)).toEqual([
      'mark-all-read',
      'view-all',
    ]);
    expect(host.activatedEvents[0].notification.id).toBe('one');
    expect(host.actionEvents[0].action.id).toBe('review');
    expect(host.overflowEvents[0].notification.id).toBe('one');
  });

  it('renders loading, error/retry, offline, and filtered-empty states accessibly', () => {
    host.notifications.set([]);
    host.loading.set(true);
    fixture.detectChanges();
    expect(panel().getAttribute('aria-busy')).toBe('true');
    expect(panel().querySelectorAll('pixel-notification-item')).toHaveLength(3);

    host.loading.set(false);
    host.errorMessage.set('The server could not be reached.');
    fixture.detectChanges();
    expect(panel().querySelector('pixel-empty-state')?.textContent).toContain(
      'Notifications unavailable',
    );
    buttonWithText('Try again').click();
    expect(host.commandEvents.at(-1)?.command).toBe('retry');

    host.errorMessage.set('');
    host.notifications.set([record('cached')]);
    host.offline.set(true);
    fixture.detectChanges();
    expect(panel().querySelector('[role="status"]')?.textContent).toContain('Offline');

    host.offline.set(false);
    host.filter.set('unread');
    host.notifications.set([record('read', { readAt: now })]);
    fixture.detectChanges();
    expect(panel().querySelector('pixel-empty-state')?.textContent).toContain(
      'No matching notifications',
    );
  });

  it('uses native controls with keyboard-identifiable command payloads', () => {
    const markAll = buttonWithText('Mark all read');
    expect(markAll.tagName).toBe('BUTTON');
    markAll.click();
    expect(host.commandEvents[0].source).toBe('keyboard');
    expect(panel().querySelector('[role="group"]')?.getAttribute('aria-label')).toBe(
      'Filter notifications',
    );
  });
});
