import { formatPixelLabel } from '../shared/format-label';

export { formatPixelLabel };

/** User-visible chrome copy for `pixel-notification-panel` (i18n via `labels` input). */
export interface PixelNotificationPanelLabels {
  readonly markAllRead: string;
  readonly markAllReadAria: string;
  readonly filterGroupAria: string;
  readonly filterAll: string;
  readonly filterUnread: string;
  readonly filterActionRequired: string;
  /** Accessible name when no category is selected. */
  readonly filterByCategoryAria: string;
  /** `{category}` — accessible name when a category filter is active. */
  readonly filterByCategorySelectedAria: string;
  readonly allCategories: string;
  readonly offlineNotice: string;
  readonly retry: string;
  readonly tryAgain: string;
  readonly loadingNotifications: string;
  readonly unavailableHeading: string;
  readonly noMatchingHeading: string;
  readonly noMatchingDescription: string;
  /** `{n}` / `{total}` — footer range text. */
  readonly showingCount: string;
  readonly loadMore: string;
  readonly loadingMore: string;
  /** `{n}` — unread badge accessible name. */
  readonly unreadBadgeAria: string;
  /** `{heading}` — list region accessible name. */
  readonly listAria: string;
  /** `{error}` — live region when load fails. */
  readonly liveLoadFailed: string;
  /** `{n}` — live region while offline with cached rows. */
  readonly liveOffline: string;
  /** `{n}` — live region unread summary (also used when idle). */
  readonly liveUnread: string;
}

export const DEFAULT_NOTIFICATION_PANEL_LABELS: PixelNotificationPanelLabels = {
  markAllRead: 'Mark all as read',
  markAllReadAria: 'Mark all notifications as read',
  filterGroupAria: 'Filter notifications',
  filterAll: 'All',
  filterUnread: 'Unread',
  filterActionRequired: 'Action Required',
  filterByCategoryAria: 'Filter by category',
  filterByCategorySelectedAria: 'Filter by category, {category} selected',
  allCategories: 'All categories',
  offlineNotice: 'Offline — showing cached notifications',
  retry: 'Retry',
  tryAgain: 'Try again',
  loadingNotifications: 'Loading notifications',
  unavailableHeading: 'Notifications unavailable',
  noMatchingHeading: 'No matching notifications',
  noMatchingDescription: 'Try another filter or category.',
  showingCount: 'Showing {n} of {total}',
  loadMore: 'Load more',
  loadingMore: 'Loading more notifications',
  unreadBadgeAria: '{n} unread notifications',
  listAria: '{heading} list',
  liveLoadFailed: 'Notification load failed. {error}',
  liveOffline: 'Offline. Showing {n} cached notifications.',
  liveUnread: '{n} unread notifications',
};

/** Status chip and screen-reader status copy for `pixel-notification-item`. */
export interface PixelNotificationItemStatusLabels {
  readonly failed: string;
  readonly completed: string;
  readonly scheduled: string;
  readonly archived: string;
  readonly actionRequired: string;
  readonly unread: string;
  readonly read: string;
  readonly inProgress: string;
  /** `{n}` — determinate progress status text. */
  readonly inProgressPercent: string;
  readonly noAdditionalDetails: string;
  /** `{title}` — progress bar accessible name. */
  readonly progressAria: string;
  /** `{n}` — occurrences chip accessible name. */
  readonly occurrencesAria: string;
}

export const DEFAULT_NOTIFICATION_ITEM_STATUS_LABELS: PixelNotificationItemStatusLabels = {
  failed: 'Failed',
  completed: 'Completed',
  scheduled: 'Scheduled',
  archived: 'Archived',
  actionRequired: 'Action Required',
  unread: 'Unread',
  read: 'Read',
  inProgress: 'In progress',
  inProgressPercent: 'In progress, {n} percent',
  noAdditionalDetails: 'No additional details',
  progressAria: 'Progress for {title}',
  occurrencesAria: '{n} occurrences',
};

/** User-visible copy for `pixel-notification-preferences`. */
export interface PixelNotificationPreferencesLabels {
  readonly reset: string;
  readonly mutedCategories: string;
  readonly noCategories: string;
  /** `{category}` — mute checkbox label. */
  readonly muteCategory: string;
  readonly interruptiveChannels: string;
  /** `{channel}` — disable-channel checkbox label. */
  readonly disableChannel: string;
  readonly quietHours: string;
  readonly enableQuietHours: string;
  readonly quietHoursStart: string;
  readonly quietHoursEnd: string;
}

export const DEFAULT_NOTIFICATION_PREFERENCES_LABELS: PixelNotificationPreferencesLabels = {
  reset: 'Reset',
  mutedCategories: 'Muted categories',
  noCategories: 'No categories available.',
  muteCategory: 'Mute {category}',
  interruptiveChannels: 'Interruptive channels',
  disableChannel: 'Disable {channel}',
  quietHours: 'Quiet hours',
  enableQuietHours: 'Enable quiet hours',
  quietHoursStart: 'Starts (HH:mm)',
  quietHoursEnd: 'Ends (HH:mm)',
};
