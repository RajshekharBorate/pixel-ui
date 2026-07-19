import { TestBed } from '@angular/core/testing';
import { PixelToastService } from '../pixel-toast/pixel-toast.service';
import type { PixelToastConfig } from '../pixel-toast/pixel-toast.types';
import {
  pixelNotificationDefaultChannelPolicy,
  providePixelNotifications,
} from './pixel-notification.config';
import { PixelNotificationService } from './pixel-notification.service';

class ToastServiceMock {
  readonly shown: PixelToastConfig[] = [];
  readonly updates: { readonly id: string; readonly patch: Partial<PixelToastConfig> }[] = [];
  readonly progress: { readonly id: string; readonly value: number }[] = [];
  readonly removed: string[] = [];

  show(config: PixelToastConfig): string {
    this.shown.push(config);
    return `toast-${this.shown.length}`;
  }

  update(id: string, patch: Partial<PixelToastConfig>): void {
    this.updates.push({ id, patch });
  }

  setProgress(id: string, value: number): void {
    this.progress.push({ id, value });
  }

  remove(id: string): void {
    this.removed.push(id);
  }
}

describe('PixelNotificationService', () => {
  let service: PixelNotificationService;
  let toast: ToastServiceMock;

  beforeEach(() => {
    toast = new ToastServiceMock();
    TestBed.configureTestingModule({
      providers: [
        providePixelNotifications(),
        { provide: PixelToastService, useValue: toast },
      ],
    });
    service = TestBed.inject(PixelNotificationService);
  });

  it('keeps normal-priority notifications in the durable inbox without interrupting', () => {
    const id = service.publish({
      title: 'Report ready',
      message: 'Your export can be downloaded.',
      category: 'reports',
    });

    expect(service.notifications()).toHaveLength(1);
    expect(service.inbox()).toHaveLength(1);
    expect(service.unreadCount()).toBe(1);
    expect(service.get(id)?.channels).toEqual(['inbox']);
    expect(toast.shown).toHaveLength(0);
  });

  it('routes high-priority records to inbox and PixelToastService', () => {
    const id = service.publish({
      title: 'Approval required',
      message: 'A policy is waiting for your review.',
      severity: 'warning',
      priority: 'high',
      actions: [{ id: 'review', label: 'Review', appearance: 'primary' }],
    });

    expect(service.get(id)?.channels).toEqual(['inbox', 'toast']);
    expect(toast.shown).toHaveLength(1);
    expect(toast.shown[0]).toMatchObject({
      type: 'warning',
      title: 'Approval required',
      timeOut: 8000,
      duplicateKey: `pixel-notification:${id}`,
    });
    expect(toast.shown[0]?.actions).toEqual([
      { id: 'review', label: 'Review', ariaLabel: undefined, primary: true },
    ]);
  });

  it('honors explicit channels and excludes toast-only records from inbox counts', () => {
    service.publish({
      title: 'Copied',
      severity: 'success',
      channels: ['toast'],
    });

    expect(service.notifications()).toHaveLength(1);
    expect(service.inbox()).toHaveLength(0);
    expect(service.unreadCount()).toBe(0);
    expect(toast.shown).toHaveLength(1);
  });

  it('deduplicates active records, increments occurrences, and makes them unread again', () => {
    const firstId = service.publish({
      title: 'Build failed',
      severity: 'error',
      dedupeKey: 'build:42',
    });
    service.markRead(firstId);
    const secondId = service.publish({
      title: 'Build failed again',
      severity: 'error',
      dedupeKey: 'build:42',
    });

    expect(secondId).toBe(firstId);
    expect(service.notifications()).toHaveLength(1);
    expect(service.get(firstId)).toMatchObject({
      title: 'Build failed again',
      occurrences: 2,
      readAt: null,
    });
    expect(service.unreadCount()).toBe(1);
  });

  it('supports read, archive, restore, remove, and category projections', () => {
    const first = service.publish({ title: 'One', category: 'security' });
    service.publish({ title: 'Two', category: 'security' });

    expect(service.countsByCategory().get('security')).toBe(2);
    service.markRead(first);
    expect(service.unreadCount()).toBe(1);
    service.archive(first);
    expect(service.inbox()).toHaveLength(1);
    expect(service.archived()).toHaveLength(1);
    service.restore(first);
    expect(service.inbox()).toHaveLength(2);
    service.remove(first);
    expect(service.notifications()).toHaveLength(1);
  });

  it('updates an active toast and forwards determinate progress', () => {
    const id = service.publish({
      title: 'Exporting',
      state: 'loading',
      priority: 'high',
      progress: 10,
    });
    service.update(id, { title: 'Almost done', progress: 80 });

    expect(toast.progress).toContainEqual({ id: 'toast-1', value: 10 });
    expect(toast.updates[0]).toMatchObject({
      id: 'toast-1',
      patch: { title: 'Almost done' },
    });
    expect(toast.progress).toContainEqual({ id: 'toast-1', value: 80 });
  });

  it('keeps critical toasts persistent and removes them when archived', () => {
    const id = service.publish({
      title: 'Account locked',
      severity: 'error',
      priority: 'critical',
    });

    expect(toast.shown[0]?.disableTimeOut).toBe(true);
    service.archive(id);
    expect(toast.removed).toEqual(['toast-1']);
  });

  it('emits and invokes typed actions while marking the notification read', async () => {
    const handler = vi.fn();
    const id = service.publish({
      title: 'Access request',
      actions: [{ id: 'approve', label: 'Approve', handler }],
    });

    const event = await service.invokeAction(id, 'approve');

    expect(handler).toHaveBeenCalledOnce();
    expect(event?.action.id).toBe('approve');
    expect(service.actionEvents()?.notification.id).toBe(id);
    expect(service.get(id)?.readAt).not.toBeNull();
  });

  it('prunes expired records without polling', () => {
    const id = service.publish({
      title: 'Temporary',
      expiresAt: 100,
    });

    expect(service.pruneExpired(101).map((item) => item.id)).toEqual([id]);
    expect(service.notifications()).toHaveLength(0);
  });
});

describe('pixelNotificationDefaultChannelPolicy', () => {
  it('uses explicit channels and only interrupts for high or critical priority', () => {
    const base = {
      id: 'n1',
      title: 'Test',
      message: '',
      severity: 'neutral' as const,
      state: 'default' as const,
      category: '',
      source: '',
      icon: '',
      imageSrc: '',
      createdAt: 1,
      updatedAt: 1,
      expiresAt: null,
      readAt: null,
      archivedAt: null,
      progress: null,
      occurrences: 1,
      actions: [],
      dedupeKey: '',
      data: {},
    };

    expect(
      pixelNotificationDefaultChannelPolicy({
        ...base,
        priority: 'normal',
        channels: [],
      }).channels,
    ).toEqual(['inbox']);
    expect(
      pixelNotificationDefaultChannelPolicy({
        ...base,
        priority: 'critical',
        channels: [],
      }).channels,
    ).toEqual(['inbox', 'toast']);
    expect(
      pixelNotificationDefaultChannelPolicy({
        ...base,
        priority: 'normal',
        channels: ['banner', 'banner'],
      }).channels,
    ).toEqual(['banner']);
  });
});
