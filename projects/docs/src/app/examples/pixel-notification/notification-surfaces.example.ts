import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  PixelButtonComponent,
  PixelNotificationBannerComponent,
  PixelNotificationItemComponent,
  PixelNotificationPreferencesComponent,
  PixelNotificationService,
  groupNotifications,
  type PixelNotificationPreferences,
  PIXEL_NOTIFICATION_DEFAULT_PREFERENCES,
} from 'pixel-ui';

@Component({
  selector: 'docs-notification-surfaces-example',
  imports: [
    PixelButtonComponent,
    PixelNotificationBannerComponent,
    PixelNotificationItemComponent,
    PixelNotificationPreferencesComponent,
  ],
  template: `
    <pixel-notification-banner
      [notifications]="notifications.banners()"
      (activated)="notifications.markRead($event.notification.id)"
      (actionClicked)="notifications.invokeAction($event.notification.id, $event.action.id)"
    />

    <div class="notification-surfaces__toolbar">
      <pixel-button appearance="outline" (click)="publishBanner()">Banner</pixel-button>
      <pixel-button appearance="outline" (click)="publishDialog()">Critical dialog</pixel-button>
      <pixel-button appearance="outline" (click)="publishJob()">Job lifecycle</pixel-button>
      <pixel-button appearance="text" (click)="notifications.clear()">Clear</pixel-button>
    </div>

    <pixel-notification-preferences
      [categories]="categories()"
      [(preferences)]="preferences"
      (preferencesChange)="onPreferences($event)"
    />

    <section class="notification-surfaces__page" aria-label="Full-page notification center recipe">
      <h3>Full-page recipe</h3>
      @for (group of grouped(); track group.key) {
        <h4>{{ group.label }}</h4>
        @for (item of group.notifications; track item.id) {
          <pixel-notification-item
            [notification]="item"
            density="compact"
            (activated)="notifications.markRead(item.id)"
          />
        }
      }
    </section>
  `,
  styles: `
    :host {
      display: grid;
      gap: var(--pixel-sys-space-lg, 1.5rem);
    }

    .notification-surfaces__toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: var(--pixel-sys-space-sm, 0.5rem);
    }

    .notification-surfaces__page {
      display: grid;
      gap: var(--pixel-sys-space-sm, 0.5rem);
    }

    .notification-surfaces__page h3,
    .notification-surfaces__page h4 {
      margin: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationSurfacesExample {
  protected readonly notifications = inject(PixelNotificationService);
  protected readonly preferences = signal<PixelNotificationPreferences>({
    ...PIXEL_NOTIFICATION_DEFAULT_PREFERENCES,
  });

  protected readonly categories = computed(() =>
    [...this.notifications.countsByCategory().keys()].sort(),
  );

  protected readonly grouped = computed(() =>
    groupNotifications(this.notifications.inbox(), 'day'),
  );

  protected onPreferences(next: PixelNotificationPreferences): void {
    this.preferences.set(next);
    this.notifications.setPreferences(next);
  }

  protected publishBanner(): void {
    this.notifications.publish({
      title: 'Maintenance window tonight',
      message: 'Read-only mode begins at 22:00 UTC.',
      severity: 'warning',
      category: 'ops',
      channels: ['inbox', 'banner'],
      actions: [{ id: 'details', label: 'Details', appearance: 'primary' }],
    });
  }

  protected publishDialog(): void {
    this.notifications.publish({
      title: 'Security approval required',
      message: 'Confirm this privileged access request to continue.',
      severity: 'error',
      priority: 'critical',
      category: 'security',
      channels: ['inbox', 'dialog'],
      actions: [
        { id: 'approve', label: 'Approve', appearance: 'primary' },
        { id: 'deny', label: 'Deny', appearance: 'danger' },
      ],
    });
  }

  protected publishJob(): void {
    const id = this.notifications.publish({
      title: 'Export running',
      message: 'Building CSV for 12,480 rows.',
      state: 'loading',
      progress: 18,
      category: 'jobs',
      dedupeKey: 'job:export-csv',
      channels: ['inbox', 'banner'],
    });
    window.setTimeout(() => {
      this.notifications.update(id, {
        title: 'Export ready',
        message: 'Download is available for 24 hours.',
        state: 'completed',
        progress: 100,
        severity: 'success',
      });
    }, 1200);
  }
}
