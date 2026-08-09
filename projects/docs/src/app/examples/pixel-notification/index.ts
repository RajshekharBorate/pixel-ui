import { createDocExample } from '../../shared/example-source.util';
import { NotificationCoreExample } from './notification-core.example';
import { NotificationItemStatesExample } from './notification-item-states.example';
import { NotificationPushExample } from './notification-push.example';
import { NotificationSurfacesExample } from './notification-surfaces.example';

export const NOTIFICATION_EXAMPLES = [
  createDocExample({
    id: 'notification-core',
    title: 'Desktop panel, routing, and unread state',
    category: 'Foundation',
    description:
      'Open the header bell to use the anchored desktop panel. Normal events remain in the inbox; high and critical events also bridge to PixelToastService.',
    component: NotificationCoreExample,
    imports: [
      'PixelNotificationService',
      'PixelNotificationPanelComponent',
      'PixelPopoverComponent',
      'PixelPopoverTriggerDirective',
      'PixelBadgeComponent',
      'PixelToastContainerComponent',
      'PixelButtonComponent',
    ],
    html: `<pixel-toast-container />

<pixel-badge type="notification" [value]="notifications.unreadCount()">
  <pixel-button
    appearance="icon"
    leadingIcon="notifications"
    [pixelPopoverTriggerFor]="notificationPopover"
  />
</pixel-badge>

<pixel-popover #notificationPopover align="end" panelWidth="26rem">
  <pixel-notification-panel
    [notifications]="notifications.inbox()"
    [(filter)]="panelFilter"
    [(category)]="panelCategory"
    (notificationActivated)="notifications.markRead($event.notification.id)"
    (dismissClicked)="notifications.archive($event.notification.id)"
    (command)="onPanelCommand($event)"
  />
</pixel-popover>`,
    typescript: `private readonly notifications = inject(PixelNotificationService);
readonly panelFilter = signal<PixelNotificationPanelFilter>('all');
readonly panelCategory = signal('');

publishNormal(): void {
  this.notifications.publish({
    title: 'Monthly report is ready',
    severity: 'success',
    category: 'reports',
    dedupeKey: 'report:monthly',
  });
}

publishHigh(): void {
  this.notifications.publish({
    title: 'Approval required',
    severity: 'warning',
    priority: 'high', // default policy: inbox + toast
    dedupeKey: 'approval:TR-104',
  });
}

onPanelCommand(event: PixelNotificationPanelCommandEvent): void {
  if (event.command === 'mark-all-read') {
    this.notifications.markAllRead();
  }
}`,
    scss: `.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pixel-sys-space-sm, 0.5rem);
}`,
  }),
  createDocExample({
    id: 'notification-item-states',
    title: 'Notification item state matrix',
    category: 'States',
    description:
      'Unread/read, compact, repeated, loading, failed, archived, action, and skeleton treatments.',
    component: NotificationItemStatesExample,
    imports: ['PixelNotificationItemComponent'],
    html: `@for (state of states; track state.item.id) {
  <pixel-notification-item
    [notification]="state.item"
    [density]="state.compact ? 'compact' : 'default'"
    [showSkeleton]="state.skeleton"
    showOverflow
  />
}`,
    typescript: `readonly states = [
  {
    label: 'Loading',
    item: createNotification({ state: 'loading', progress: 64 }),
  },
  {
    label: 'Failed',
    item: createNotification({ state: 'failed', severity: 'error' }),
  },
];`,
    scss: `.notification-states {
  display: grid;
  gap: var(--pixel-sys-space-lg, 1.5rem);
}`,
  }),
  createDocExample({
    id: 'notification-surfaces',
    title: 'Banner, dialog, preferences, and full-page recipe',
    category: 'Enterprise',
    description:
      'Banner stack, critical dialog escalation, preference muting/quiet hours, day-grouped full-page composition, and a job-lifecycle update.',
    component: NotificationSurfacesExample,
    imports: [
      'PixelNotificationService',
      'PixelNotificationBannerComponent',
      'PixelNotificationPreferencesComponent',
      'PixelNotificationItemComponent',
      'PixelButtonComponent',
      'groupNotifications',
      'PIXEL_NOTIFICATION_DEFAULT_PREFERENCES',
    ],
    html: `<pixel-notification-banner [notifications]="notifications.banners()" />

<pixel-notification-preferences
  [categories]="categories()"
  [(preferences)]="preferences"
  (preferencesChange)="notifications.setPreferences($event)"
/>

@for (group of grouped(); track group.key) {
  <h4>{{ group.label }}</h4>
  @for (item of group.notifications; track item.id) {
    <pixel-notification-item [notification]="item" density="compact" />
  }
}`,
    typescript: `private readonly notifications = inject(PixelNotificationService);
readonly preferences = signal({ ...PIXEL_NOTIFICATION_DEFAULT_PREFERENCES });
readonly grouped = computed(() => groupNotifications(notifications.inbox(), 'day'));

publishDialog(): void {
  this.notifications.publish({
    title: 'Security approval required',
    priority: 'critical',
    channels: ['inbox', 'dialog'],
  });
}`,
    scss: `.notification-surfaces__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pixel-sys-space-sm, 0.5rem);
}`,
  }),
  createDocExample({
    id: 'notification-push',
    title: 'Web Push soft-ask and preferences',
    category: 'Web Push',
    description:
      'Enable push → OS recipe → Review/Explore on the system toast. Focuses or opens the docs tab, routes to /components/pixel-notification/examples, scrolls, and highlights the recipe button (full PixelNavigate target chains supported).',
    component: NotificationPushExample,
    imports: [
      'PixelNotificationPushPromptComponent',
      'PixelNotificationPreferencesComponent',
      'PixelNavAnchorDirective',
      'PixelPushNotificationService',
      'PixelPushNotificationBridge',
      'PixelNavigateService',
      'providePixelPushNotifications',
      'PixelPushMemorySubscriptionAdapter',
      'buildOsNotificationOptions',
      'shouldShowOsNotification',
      'resolveOsNotificationVisuals',
    ],
    html: `<pixel-notification-push-prompt deviceLabel="docs-demo" />
<span pixelNavAnchor="push-recipe-severity">
  <pixel-button (click)="simulateSystemNotification('severity')">OS · severity glyph</pixel-button>
</span>`,
    typescript: `// App shell: provideDocsPixelPushNotifications() + push.start()
// so the SW bridge survives leaving this page.
const nav = {
  route: ['components', 'pixel-notification', 'examples'],
  target: [
    { type: 'section', id: 'example-notification-push' },
    { type: 'section', id: 'push-recipe-avatar' },
  ],
  highlight: true,
  timeoutMs: 8000,
};`,
  }),
] as const;
