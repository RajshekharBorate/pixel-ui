import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  model,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import PixelBadgeComponent from '../pixel-badge/pixel-badge';
import PixelButtonComponent from '../pixel-button/pixel-button';
import PixelDividerComponent from '../pixel-divider/pixel-divider';
import PixelEmptyStateComponent from '../pixel-empty-state/pixel-empty-state';
import PixelMenuComponent from '../pixel-menu/pixel-menu';
import PixelMenuItemComponent from '../pixel-menu/pixel-menu-item';
import PixelMenuTriggerDirective from '../pixel-menu/pixel-menu-trigger';
import {
  formatNotificationCategoryLabel,
  groupNotifications,
  isActionRequiredNotification,
  sortNotificationsForDisplay,
} from './pixel-notification.adapters';
import PixelNotificationItemComponent, {
  type PixelNotificationItemActionEvent,
  type PixelNotificationItemActivateEvent,
  type PixelNotificationItemOverflowEvent,
} from './pixel-notification-item';
import {
  DEFAULT_NOTIFICATION_PANEL_LABELS,
  formatPixelLabel,
  type PixelNotificationPanelLabels,
} from './pixel-notification-labels';
import type { PixelNotification } from './pixel-notification.types';

export type { PixelNotificationPanelLabels } from './pixel-notification-labels';
export { DEFAULT_NOTIFICATION_PANEL_LABELS, formatPixelLabel } from './pixel-notification-labels';

export type PixelNotificationPanelFilter = 'all' | 'unread' | 'action-required';
export type PixelNotificationPanelCommand =
  | 'mark-all-read'
  | 'load-more'
  | 'retry'
  | 'view-all';

export interface PixelNotificationPanelCommandEvent {
  readonly command: PixelNotificationPanelCommand;
  readonly source: 'mouse' | 'keyboard';
  readonly originalEvent: MouseEvent | KeyboardEvent;
}

const SKELETON_NOTIFICATION: PixelNotification = {
  id: 'pixel-notification-panel-skeleton',
  title: 'Loading notification',
  message: '',
  severity: 'neutral',
  priority: 'normal',
  state: 'loading',
  category: '',
  source: '',
  icon: '',
  imageSrc: '',
  createdAt: 0,
  updatedAt: 0,
  expiresAt: null,
  readAt: null,
  archivedAt: null,
  progress: null,
  occurrences: 1,
  actions: [],
  channels: ['inbox'],
  dedupeKey: '',
  data: {},
};

let nextNotificationPanelId = 0;

/**
 * Desktop notification-center panel content. Compose it inside `pixel-popover`; it owns list
 * filtering and bounded incremental rendering while emitting all application mutations as intents.
 */
@Component({
  selector: 'pixel-notification-panel',
  imports: [
    PixelBadgeComponent,
    PixelButtonComponent,
    PixelDividerComponent,
    PixelEmptyStateComponent,
    PixelMenuComponent,
    PixelMenuItemComponent,
    PixelMenuTriggerDirective,
    PixelNotificationItemComponent,
  ],
  templateUrl: './pixel-notification-panel.html',
  styleUrl: './pixel-notification-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-notification-panel-host',
    '[attr.id]': 'id() || fallbackId',
    '[attr.data-loading]': 'loading()',
    '[attr.data-offline]': 'offline()',
    '[attr.aria-busy]': "loading() || loadingMore() ? 'true' : null",
  },
})
export default class PixelNotificationPanelComponent {
  protected readonly fallbackId = `pixel-notification-panel-${++nextNotificationPanelId}`;
  protected readonly skeletonRows = [0, 1, 2] as const;
  protected readonly skeletonNotification = SKELETON_NOTIFICATION;
  private readonly renderLimit = signal(0);

  /**
   * @type {readonly PixelNotification[]}
   * @default []
   * @description Records available to the panel; normally bind `PixelNotificationService.inbox()`.
   */
  readonly notifications = input<readonly PixelNotification[]>([]);

  /**
   * @type {string}
   * @default ''
   * @description Optional stable host id.
   */
  readonly id = input('');

  /**
   * @type {string}
   * @default 'Notifications'
   * @description Panel heading and list accessible-name prefix.
   */
  readonly heading = input('Notifications');

  /**
   * @type {'all' | 'unread' | 'action-required'}
   * @default 'all'
   * @description Two-way filter selection for all, unread, or action-required records.
   */
  readonly filter = model<PixelNotificationPanelFilter>('all');

  /**
   * @type {string}
   * @default ''
   * @description Two-way category selection; empty means every category.
   */
  readonly category = model('');

  /**
   * @type {number}
   * @default 20
   * @description Initial and incremental render window for long variable-height lists.
   */
  readonly pageSize = input(20, { transform: numberAttribute });

  /**
   * @type {number | null}
   * @default null
   * @description Optional total for the footer "Showing X of Y" when the inbox is paged externally.
   * When omitted, Y is the filtered in-memory count.
   */
  readonly totalCount = input<number | null, unknown>(null, {
    transform: (value) => {
      if (value === null || value === undefined || value === '') {
        return null;
      }
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    },
  });

  /**
   * @type {boolean}
   * @default false
   * @description Shows skeleton rows when no records have loaded.
   */
  readonly loading = input(false, { transform: booleanAttribute });

  /**
   * @type {boolean}
   * @default false
   * @description Shows non-blocking progress while another page is requested.
   */
  readonly loadingMore = input(false, { transform: booleanAttribute });

  /**
   * @type {boolean}
   * @default false
   * @description Indicates that the application data source has more records.
   */
  readonly hasMore = input(false, { transform: booleanAttribute });

  /**
   * @type {boolean}
   * @default false
   * @description Displays a persistent offline status without hiding cached records.
   */
  readonly offline = input(false, { transform: booleanAttribute });

  /**
   * @type {string}
   * @default ''
   * @description Blocking load error. Cached records remain available when non-empty.
   */
  readonly errorMessage = input('');

  /**
   * @type {boolean}
   * @default true
   * @description Displays the footer intent for an application-composed full-page center.
   */
  readonly showViewAll = input(true, { transform: booleanAttribute });

  /**
   * @type {string}
   * @default 'View Notification Center'
   * @description Label for the full-page navigation intent.
   */
  readonly viewAllLabel = input('View Notification Center');

  /**
   * @type {string}
   * @default 'No notifications'
   * @description Empty-state heading when the unfiltered inbox has no records.
   */
  readonly emptyHeading = input('No notifications');

  /**
   * @type {string}
   * @default 'You are all caught up.'
   * @description Empty-state supporting copy.
   */
  readonly emptyDescription = input('You are all caught up.');

  /**
   * @type {Partial<PixelNotificationPanelLabels>}
   * @default {}
   * @description Partial override map for panel chrome, filters, empty/error copy, and live-region
   * strings. Merged with {@link DEFAULT_NOTIFICATION_PANEL_LABELS}. Templates may use `{n}`,
   * `{total}`, `{heading}`, `{category}`, or `{error}` placeholders.
   */
  readonly labels = input<Partial<PixelNotificationPanelLabels>>({});

  /** Emits when a record's main control is activated. */
  readonly notificationActivated = output<PixelNotificationItemActivateEvent>();

  /** Emits an inline notification action intent. */
  readonly actionClicked = output<PixelNotificationItemActionEvent>();

  /** Emits an item overflow intent for application-owned menus. */
  readonly overflowClicked = output<PixelNotificationItemOverflowEvent>();

  /** Emits when an item dismiss (close) control is activated. */
  readonly dismissClicked = output<PixelNotificationItemActivateEvent>();

  /** Emits toolbar, pagination, recovery, and full-page navigation intents. */
  readonly command = output<PixelNotificationPanelCommandEvent>();

  protected readonly unreadCount = computed(
    () => this.notifications().filter((item) => item.readAt === null).length,
  );
  protected readonly categories = computed(() =>
    [...new Set(this.notifications().map((item) => item.category).filter(Boolean))].sort(
      (left, right) => left.localeCompare(right),
    ),
  );
  protected readonly filteredNotifications = computed(() => {
    const filter = this.filter();
    const category = this.category();
    return sortNotificationsForDisplay(
      this.notifications().filter((item) => {
        const matchesFilter =
          filter === 'all'
            ? true
            : filter === 'unread'
              ? item.readAt === null
              : isActionRequiredNotification(item);
        return matchesFilter && (!category || item.category === category);
      }),
    );
  });
  protected readonly effectiveLimit = computed(() =>
    Math.max(this.renderLimit(), Math.max(1, this.pageSize())),
  );
  protected readonly visibleNotifications = computed(() =>
    this.filteredNotifications().slice(0, this.effectiveLimit()),
  );
  protected readonly visibleGroups = computed(() =>
    groupNotifications(this.visibleNotifications(), 'day'),
  );
  protected readonly hasInternalMore = computed(
    () => this.visibleNotifications().length < this.filteredNotifications().length,
  );
  protected readonly hasAnyMore = computed(() => this.hasInternalMore() || this.hasMore());
  protected readonly showingCount = computed(() => this.visibleNotifications().length);
  protected readonly totalDisplayCount = computed(() => {
    const explicit = this.totalCount();
    return explicit === null ? this.filteredNotifications().length : Math.max(0, explicit);
  });
  protected readonly showFooter = computed(
    () =>
      this.visibleNotifications().length > 0 ||
      this.hasAnyMore() ||
      this.showViewAll(),
  );
  protected readonly isFiltered = computed(
    () => this.filter() !== 'all' || Boolean(this.category()),
  );
  /** Resolved chrome labels (defaults + `labels` overrides). */
  protected readonly l = computed(
    (): PixelNotificationPanelLabels => ({
      ...DEFAULT_NOTIFICATION_PANEL_LABELS,
      ...this.labels(),
    }),
  );
  protected readonly unreadBadgeAria = computed(() =>
    formatPixelLabel(this.l().unreadBadgeAria, { n: this.unreadCount() }),
  );
  protected readonly listAriaLabel = computed(() =>
    formatPixelLabel(this.l().listAria, { heading: this.heading() }),
  );
  protected readonly showingCountLabel = computed(() =>
    formatPixelLabel(this.l().showingCount, {
      n: this.showingCount(),
      total: this.totalDisplayCount(),
    }),
  );
  protected readonly categoryFilterAria = computed(() => {
    const selected = this.category();
    if (!selected) {
      return this.l().filterByCategoryAria;
    }
    return formatPixelLabel(this.l().filterByCategorySelectedAria, {
      category: this.categoryLabel(selected),
    });
  });
  protected readonly liveStatus = computed(() => {
    const labels = this.l();
    if (this.loading()) {
      return labels.loadingNotifications;
    }
    if (this.errorMessage()) {
      return formatPixelLabel(labels.liveLoadFailed, { error: this.errorMessage() });
    }
    if (this.offline()) {
      return formatPixelLabel(labels.liveOffline, {
        n: this.filteredNotifications().length,
      });
    }
    return formatPixelLabel(labels.liveUnread, { n: this.unreadCount() });
  });

  protected selectFilter(filter: PixelNotificationPanelFilter): void {
    this.filter.set(filter);
    if (filter === 'all') {
      this.category.set('');
    }
    this.renderLimit.set(Math.max(1, this.pageSize()));
  }

  protected selectCategory(category: string): void {
    this.category.set(category);
    this.renderLimit.set(Math.max(1, this.pageSize()));
  }

  /** Display form of a stored category value for menu labels and aria text. */
  protected categoryLabel(category: string): string {
    return formatNotificationCategoryLabel(category);
  }

  protected onLoadMore(event: MouseEvent | KeyboardEvent): void {
    if (this.hasInternalMore()) {
      this.renderLimit.set(this.effectiveLimit() + Math.max(1, this.pageSize()));
      return;
    }
    this.emitCommand('load-more', event);
  }

  protected emitCommand(
    command: PixelNotificationPanelCommand,
    event: MouseEvent | KeyboardEvent,
  ): void {
    this.command.emit({
      command,
      source:
        event instanceof KeyboardEvent || (event instanceof MouseEvent && event.detail === 0)
          ? 'keyboard'
          : 'mouse',
      originalEvent: event,
    });
  }
}
