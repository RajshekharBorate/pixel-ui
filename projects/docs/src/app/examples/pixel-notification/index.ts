import { createDocExample } from '../../shared/example-source.util';
import { NotificationCoreExample } from './notification-core.example';
import { NotificationItemStatesExample } from './notification-item-states.example';
import { NotificationPushExample } from './notification-push.example';
import { NotificationPushPromptDelayedExample } from './notification-push-prompt-delayed.example';
import { NotificationPushPromptInlineExample } from './notification-push-prompt-inline.example';
import { NotificationPushPromptValueMomentExample } from './notification-push-prompt-value-moment.example';
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
const nav = {
  route: ['components', 'pixel-notification', 'examples'],
  target: { type: 'section', id: 'push-recipe-severity' },
  highlight: true,
  focus: false, // avoid stacking button focus ring on nav highlight
  timeoutMs: 8000,
};`,
  }),
  createDocExample({
    id: 'notification-push-prompt-inline',
    title: 'Push soft-ask — inline (settings)',
    category: 'Web Push',
    description:
      'Recipe A: always-available soft-ask for settings / preferences. No auto dialog; Enable is the only path to the native permission prompt.',
    component: NotificationPushPromptInlineExample,
    imports: ['PixelNotificationPushPromptComponent', 'PixelPushPromptContentDirective', 'PixelPushNotificationService'],
    html: `<pixel-notification-push-prompt deviceLabel="docs-settings">
  <div pixelPushPromptContent>
    <h3>Stay informed on the go</h3>
    <p>Approvals and mentions reach you even when this tab is closed.</p>
  </div>
</pixel-notification-push-prompt>`,
    typescript: `// Drop-in — no scheduler. App still needs providePixelPushNotifications().
// Optional: labels={{ heading, description }} or [pixelPushPromptContent].
protected readonly push = inject(PixelPushNotificationService);`,
  }),
  createDocExample({
    id: 'notification-push-prompt-delayed',
    title: 'Push soft-ask — delayed dialog',
    category: 'Web Push',
    description:
      'Recipe B: enterprise delayed soft-ask. Standard dialog chrome — title opposite close, footer CTAs end-aligned (Not now → Enable). Flat body; no benefit chips.',
    component: NotificationPushPromptDelayedExample,
    imports: [
      'PixelPushPromptScheduler',
      'providePixelPushPromptScheduler',
      'PixelButtonComponent',
    ],
    html: `<pixel-button (click)="scheduler.show('manual')">Show soft-ask now</pixel-button>`,
    typescript: `providers: [
  providePixelPushPromptScheduler({
    mode: 'delayed',
    delayMs: 3_000, // demo; production ~45_000
    cooldownMs: 60_000,
    storageKey: 'pixel-docs-push-prompt-delayed',
    deviceLabel: 'docs-delayed',
    // dialogTitle omitted → labels.heading in header; promptSurface flat + layout dialog
  }),
]
protected readonly scheduler = inject(PixelPushPromptScheduler);`,
  }),
  createDocExample({
    id: 'notification-push-prompt-value-moment',
    title: 'Push soft-ask — value moment',
    category: 'Web Push',
    description:
      'Recipe C: soft-ask after a meaningful action. Contextual labels become the dialog title; footer actions match confirm-dialog alignment.',
    component: NotificationPushPromptValueMomentExample,
    imports: [
      'PixelPushPromptScheduler',
      'providePixelPushPromptScheduler',
      'PixelButtonComponent',
    ],
    html: `<pixel-button (click)="completeJob()">Complete job</pixel-button>`,
    typescript: `providers: [
  providePixelPushPromptScheduler({
    mode: 'event',
    storageKey: 'pixel-docs-push-prompt-value-moment',
    labels: {
      heading: 'Get notified when this finishes',
      description: 'We’ll ping you when the job completes.',
    },
    autoStart: false,
  }),
]
completeJob(): void {
  this.jobDone.set(true);
  this.scheduler.showAfterValueMoment();
}`,
  }),
] as const;
