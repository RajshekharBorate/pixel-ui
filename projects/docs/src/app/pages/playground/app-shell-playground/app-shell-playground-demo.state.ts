import { Injectable, signal } from '@angular/core';
import type {
  PixelNotificationItemDensity,
  PixelNotificationPanelFilter,
  PixelNotificationTimestampMode,
  PixelSelectOption,
} from 'pixel-ui';

export type NotificationDemoSurface = 'panel' | 'list' | 'both';

/** Shared notification-demo knobs for the shell bell and Notifications page. */
@Injectable()
export class AppShellPlaygroundDemoState {
  readonly panelFilter = signal<PixelNotificationPanelFilter>('all');
  readonly panelCategory = signal('');
  readonly demoSurface = signal<NotificationDemoSurface>('both');
  readonly demoApplyToBell = signal(true);
  readonly demoHeading = signal('Notifications');
  readonly demoPageSize = signal(5);
  readonly demoShowViewAll = signal(true);
  readonly demoViewAllLabel = signal('View Notification Center');
  readonly demoLoading = signal(false);
  readonly demoLoadingMore = signal(false);
  readonly demoHasMore = signal(false);
  readonly demoOffline = signal(false);
  readonly demoErrorMessage = signal('');
  readonly demoEmptyHeading = signal('No notifications');
  readonly demoEmptyDescription = signal('You are all caught up.');
  readonly demoItemDensity = signal<PixelNotificationItemDensity>('compact');
  readonly demoShowUnreadIndicator = signal(true);
  readonly demoShowActions = signal(true);
  readonly demoShowOverflow = signal(true);
  readonly demoShowDismiss = signal(false);
  readonly demoMaxInlineActions = signal(2);
  readonly demoTimestampMode = signal<PixelNotificationTimestampMode>('relative');
  readonly demoItemsDisabled = signal(false);
  readonly demoShowSkeleton = signal(false);

  readonly surfaceOptions: readonly PixelSelectOption[] = [
    { value: 'both', label: 'Panel + page list' },
    { value: 'panel', label: 'Panel only' },
    { value: 'list', label: 'Page list only' },
  ];
  readonly pageSizeOptions: readonly PixelSelectOption[] = [
    { value: 3, label: '3 (force Load more)' },
    { value: 5, label: '5' },
    { value: 10, label: '10' },
    { value: 20, label: '20' },
  ];
  readonly densityOptions: readonly PixelSelectOption[] = [
    { value: 'compact', label: 'Compact' },
    { value: 'default', label: 'Default' },
  ];
  readonly timestampOptions: readonly PixelSelectOption[] = [
    { value: 'relative', label: 'Relative' },
    { value: 'absolute', label: 'Absolute' },
  ];
  readonly maxActionsOptions: readonly PixelSelectOption[] = [
    { value: 0, label: '0 (overflow only)' },
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
  ];

  setDemoSurface(value: unknown): void {
    if (value === 'panel' || value === 'list' || value === 'both') {
      this.demoSurface.set(value);
    }
  }

  setDemoPageSize(value: unknown): void {
    const next = Number(value);
    if (Number.isFinite(next) && next > 0) {
      this.demoPageSize.set(next);
    }
  }

  setDemoDensity(value: unknown): void {
    if (value === 'compact' || value === 'default') {
      this.demoItemDensity.set(value);
    }
  }

  setDemoTimestampMode(value: unknown): void {
    if (value === 'relative' || value === 'absolute') {
      this.demoTimestampMode.set(value);
    }
  }

  setDemoMaxInlineActions(value: unknown): void {
    const next = Number(value);
    if (Number.isFinite(next) && next >= 0) {
      this.demoMaxInlineActions.set(next);
    }
  }
}
