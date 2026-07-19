import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelNotificationItemComponent,
  type PixelNotification,
} from 'pixel-ui';

const now = Date.now();

function item(
  id: string,
  patch: Partial<PixelNotification>,
): PixelNotification {
  return {
    id,
    title: 'Notification title',
    message: 'Supporting copy explains what changed and what the user can do next.',
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
  selector: 'docs-notification-item-states-example',
  imports: [PixelNotificationItemComponent],
  template: `
    <div class="notification-states">
      @for (state of states; track state.item.id) {
        <section>
          <h3>{{ state.label }}</h3>
          <pixel-notification-item
            [notification]="state.item"
            [density]="state.compact ? 'compact' : 'default'"
            [showSkeleton]="state.skeleton"
            showOverflow
          />
        </section>
      }
    </div>
  `,
  styles: `
    .notification-states {
      display: grid;
      gap: var(--pixel-sys-space-lg, 1.5rem);
    }

    section {
      display: grid;
      gap: var(--pixel-sys-space-xs, 0.25rem);
    }

    h3 {
      margin: 0;
      color: var(--pixel-sys-on-surface-variant, #44474f);
      font: var(--pixel-sys-label-md, 600 0.875rem/1.25rem sans-serif);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationItemStatesExample {
  protected readonly states = [
    {
      label: 'Unread with actions',
      compact: false,
      skeleton: false,
      item: item('unread', {
        title: 'Approval required',
        message: 'Travel request TR-104 is waiting for your review.',
        severity: 'warning',
        category: 'Approvals',
        source: 'Workflow',
        actions: [
          { id: 'review', label: 'Review', appearance: 'primary' },
          { id: 'later', label: 'Later' },
        ],
      }),
    },
    {
      label: 'Read, compact, repeated',
      compact: true,
      skeleton: false,
      item: item('read', {
        title: 'Monthly report is ready',
        severity: 'success',
        readAt: now,
        occurrences: 3,
      }),
    },
    {
      label: 'Loading with determinate progress',
      compact: false,
      skeleton: false,
      item: item('loading', {
        title: 'Exporting customer report',
        state: 'loading',
        progress: 64,
      }),
    },
    {
      label: 'Failed job',
      compact: false,
      skeleton: false,
      item: item('failed', {
        title: 'Export failed',
        message: 'The report could not be generated. Try again.',
        severity: 'error',
        state: 'failed',
        actions: [{ id: 'retry', label: 'Retry', appearance: 'primary' }],
      }),
    },
    {
      label: 'Archived',
      compact: false,
      skeleton: false,
      item: item('archived', {
        title: 'Maintenance completed',
        readAt: now,
        archivedAt: now,
      }),
    },
    {
      label: 'Loading skeleton',
      compact: false,
      skeleton: true,
      item: item('skeleton', { title: 'Loading' }),
    },
  ] as const;
}
