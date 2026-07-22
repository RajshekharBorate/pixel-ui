import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelNotificationPanelComponent, {
  type PixelNotificationPanelCommandEvent,
  type PixelNotificationPanelFilter,
} from './pixel-notification-panel';
import { formatNotificationCategoryLabel } from './pixel-notification.adapters';
import type {
  PixelNotificationItemActionEvent,
  PixelNotificationItemActivateEvent,
} from './pixel-notification-item';
import type { PixelNotification } from './pixel-notification.types';

const now = new Date('2026-07-19T12:00:00Z').getTime();
const yesterday = now - 24 * 60 * 60 * 1000;

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
      [totalCount]="totalCount()"
      [loading]="loading()"
      [loadingMore]="loadingMore()"
      [hasMore]="hasMore()"
      [offline]="offline()"
      [errorMessage]="errorMessage()"
      [showViewAll]="showViewAll()"
      (notificationActivated)="activatedEvents.push($event)"
      (actionClicked)="actionEvents.push($event)"
      (dismissClicked)="dismissEvents.push($event)"
      (command)="commandEvents.push($event)"
    />
  `,
})
class HostComponent {
  readonly notifications = signal<readonly PixelNotification[]>([
    record('one', {
      category: 'Approvals',
      actions: [{ id: 'review', label: 'Review' }],
      priority: 'high',
    }),
    record('two', { category: 'reports', readAt: now }),
    record('three', { category: 'reports', createdAt: yesterday, updatedAt: yesterday }),
  ]);
  readonly filter = signal<PixelNotificationPanelFilter>('all');
  readonly category = signal('');
  readonly pageSize = signal(2);
  readonly totalCount = signal<number | null>(null);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly hasMore = signal(false);
  readonly offline = signal(false);
  readonly errorMessage = signal('');
  readonly showViewAll = signal(true);
  readonly activatedEvents: PixelNotificationItemActivateEvent[] = [];
  readonly actionEvents: PixelNotificationItemActionEvent[] = [];
  readonly dismissEvents: PixelNotificationItemActivateEvent[] = [];
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

  it('renders heading, unread badge, filters, day groups, and a bounded window', () => {
    expect(panel().querySelector('h2')?.textContent).toContain('Notifications');
    expect(panel().querySelector('pixel-badge')?.textContent).toMatch(/2/);
    expect(renderedItems()).toHaveLength(2);
    expect(panel().querySelector('.pixel-notification-panel__group-label')?.textContent).toMatch(
      /Today|Yesterday|Jul/,
    );
    expect(panel().querySelector('.pixel-notification-panel__count')?.textContent).toContain(
      'Showing 2 of 3',
    );
    expect(buttonWithText('All').getAttribute('aria-pressed')).toBe('true');
    expect(buttonWithText('Action Required')).toBeTruthy();
    expect(buttonWithText('Mark all as read')).toBeTruthy();
    expect(buttonWithText('Load more')).toBeTruthy();
  });

  it('reactively filters unread, action-required, and categories', () => {
    buttonWithText('Unread').click();
    fixture.detectChanges();
    expect(host.filter()).toBe('unread');
    expect(renderedItems()).toHaveLength(2);

    buttonWithText('Action Required').click();
    fixture.detectChanges();
    expect(host.filter()).toBe('action-required');
    expect(renderedItems()).toHaveLength(1);
    expect(renderedItems()[0].textContent).toContain('Notification one');

    host.filter.set('unread');
    host.category.set('reports');
    fixture.detectChanges();
    expect(host.category()).toBe('reports');
    const categoryTrigger = panel().querySelector(
      '.pixel-notification-panel__category-trigger button',
    ) as HTMLButtonElement;
    expect(categoryTrigger.getAttribute('aria-pressed')).toBe('true');
    expect(categoryTrigger.classList.contains('pixel-button--pressed')).toBe(true);
    expect(categoryTrigger.querySelector('.material-symbols-outlined')?.textContent).toContain(
      'filter_alt',
    );
    expect(categoryTrigger.classList.contains('pixel-button--mini-fab')).toBe(true);
    expect(categoryTrigger.getAttribute('aria-label')).toBe(
      'Filter by category, Reports selected',
    );
    expect(panel().textContent).toContain('Reports');
    expect(
      panel().querySelector('button[aria-label^="Clear category filter"]'),
    ).toBeNull();
    expect(renderedItems()).toHaveLength(1);

    buttonWithText('All').click();
    fixture.detectChanges();
    expect(host.filter()).toBe('all');
    expect(host.category()).toBe('');
    expect(
      panel()
        .querySelector('.pixel-notification-panel__category-trigger button')
        ?.getAttribute('aria-pressed'),
    ).toBeNull();
    expect(renderedItems()).toHaveLength(2);
  });

  it('renders unread items before read items within the same day window', () => {
    const today = Date.now();
    const dayAgo = today - 24 * 60 * 60 * 1000;
    host.notifications.set([
      record('read-today', {
        category: 'reports',
        readAt: today,
        createdAt: today - 1_000,
        updatedAt: today + 60_000,
      }),
      record('unread-today', {
        category: 'reports',
        createdAt: today - 60_000,
        updatedAt: today - 60_000,
      }),
      record('unread-yesterday', {
        category: 'reports',
        createdAt: dayAgo,
        updatedAt: dayAgo,
      }),
    ]);
    host.pageSize.set(3);
    fixture.detectChanges();

    const labels = Array.from(
      panel().querySelectorAll('.pixel-notification-panel__group-label'),
    ).map((node) => node.textContent?.trim());
    expect(labels[0]).toBe('Today');
    expect(labels[1]).toBe('Yesterday');
    expect(Array.from(renderedItems()).map((item) => item.textContent)).toEqual([
      expect.stringContaining('Notification unread-today'),
      expect.stringContaining('Notification read-today'),
      expect.stringContaining('Notification unread-yesterday'),
    ]);
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

  it('emits typed mark-all, view-all, item activation, action, and dismiss intents', () => {
    buttonWithText('Mark all as read').click();
    buttonWithText('View Notification Center').click();

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
    expect(host.dismissEvents[0].notification.id).toBe('one');
    expect(
      firstItem.querySelector('.pixel-notification-item__aside .material-symbols-outlined')
        ?.textContent,
    ).toContain('close');
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
    expect(panel().querySelector('.pixel-notification-panel__notice')?.textContent).toContain(
      'Offline',
    );

    host.offline.set(false);
    host.filter.set('unread');
    host.notifications.set([record('read', { readAt: now })]);
    fixture.detectChanges();
    expect(panel().querySelector('pixel-empty-state')?.textContent).toContain(
      'No matching notifications',
    );
  });

  it('uses native controls with keyboard-identifiable command payloads', () => {
    const markAll = buttonWithText('Mark all as read');
    expect(markAll.tagName).toBe('BUTTON');
    markAll.click();
    expect(host.commandEvents[0].source).toBe('keyboard');
    expect(panel().querySelector('[role="group"]')?.getAttribute('aria-label')).toBe(
      'Filter notifications',
    );
  });
});

describe('formatNotificationCategoryLabel', () => {
  it('title-cases slugs and hyphen/underscore separated names', () => {
    expect(formatNotificationCategoryLabel('jobs')).toBe('Jobs');
    expect(formatNotificationCategoryLabel('security')).toBe('Security');
    expect(formatNotificationCategoryLabel('action-required')).toBe('Action Required');
    expect(formatNotificationCategoryLabel('monthly_reports')).toBe('Monthly Reports');
    expect(formatNotificationCategoryLabel('Approvals')).toBe('Approvals');
  });
});
