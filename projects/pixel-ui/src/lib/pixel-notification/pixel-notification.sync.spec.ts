import { TestBed } from '@angular/core/testing';
import {
  PixelNotificationMemoryPersistenceAdapter,
  groupNotifications,
  isWithinQuietHours,
  toPersistedNotification,
  type PixelNotificationTransportAdapter,
  type PixelNotificationTransportEvent,
} from './pixel-notification.adapters';
import { providePixelNotifications } from './pixel-notification.config';
import { PixelNotificationService } from './pixel-notification.service';
import { PixelNotificationSyncService } from './pixel-notification.sync';
import { PixelToastService } from '../pixel-toast/pixel-toast.service';

class ToastServiceMock {
  show(): string {
    return 'toast-1';
  }
  update(): void {}
  setProgress(): void {}
  remove(): void {}
}

class FakeTransport implements PixelNotificationTransportAdapter {
  handler: ((event: PixelNotificationTransportEvent) => void) | null = null;
  readonly sent: unknown[] = [];
  readonly replays: number[] = [];

  connect(handler: (event: PixelNotificationTransportEvent) => void): () => void {
    this.handler = handler;
    return () => {
      this.handler = null;
    };
  }

  send(mutation: unknown): void {
    this.sent.push(mutation);
  }

  requestReplay(afterSequence: number): void {
    this.replays.push(afterSequence);
  }

  emit(event: PixelNotificationTransportEvent): void {
    this.handler?.(event);
  }
}

describe('PixelNotification adapters and sync', () => {
  let service: PixelNotificationService;
  let sync: PixelNotificationSyncService;
  let persistence: PixelNotificationMemoryPersistenceAdapter;
  let transport: FakeTransport;

  beforeEach(() => {
    persistence = new PixelNotificationMemoryPersistenceAdapter();
    transport = new FakeTransport();
    TestBed.configureTestingModule({
      providers: [
        providePixelNotifications({
          persistence,
          transport,
          analytics: { track: () => undefined },
        }),
        { provide: PixelToastService, useClass: ToastServiceMock },
      ],
    });
    service = TestBed.inject(PixelNotificationService);
    sync = TestBed.inject(PixelNotificationSyncService);
  });

  afterEach(() => {
    sync.stop();
  });

  it('strips action handlers when persisting records', () => {
    const id = service.publish({
      title: 'Persist me',
      actions: [
        {
          id: 'open',
          label: 'Open',
          handler: () => undefined,
        },
      ],
    });
    const persisted = toPersistedNotification(service.get(id)!);
    expect(persisted.actions[0]).toEqual({ id: 'open', label: 'Open' });
    expect('handler' in persisted.actions[0]!).toBe(false);
  });

  it('hydrates from persistence and requests transport replay on start', async () => {
    persistence.save([
      {
        id: 'n-1',
        title: 'Restored',
        message: '',
        severity: 'info',
        priority: 'normal',
        state: 'default',
        category: 'jobs',
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
        channels: ['inbox'],
        dedupeKey: '',
        data: {},
      },
    ]);

    await sync.start();

    expect(service.get('n-1')?.title).toBe('Restored');
    expect(sync.connected()).toBe(true);
    expect(transport.replays).toEqual([0]);
  });

  it('rejects out-of-order transport events and applies later sequences', async () => {
    await sync.start();
    sync.applyTransportEvent({
      type: 'upsert',
      sequence: 2,
      notification: { id: 'seq-2', title: 'Second' },
    });
    sync.applyTransportEvent({
      type: 'upsert',
      sequence: 1,
      notification: { id: 'seq-1', title: 'Stale' },
    });

    expect(service.get('seq-2')).toBeTruthy();
    expect(service.get('seq-1')).toBeNull();
    expect(sync.lastSequence()).toBe(2);
  });

  it('replaces state on snapshot and resolves conflicts with server records', async () => {
    service.publish({ id: 'local', title: 'Local' });
    await sync.start();

    sync.applyTransportEvent({
      type: 'snapshot',
      sequence: 5,
      notifications: [{ id: 'server', title: 'Server snapshot' }],
    });
    expect(service.notifications().map((item) => item.id)).toEqual(['server']);

    sync.applyTransportEvent({
      type: 'conflict',
      sequence: 6,
      clientMutationId: 'm-1',
      notification: { id: 'server', title: 'Server wins', dedupeKey: 'server' },
    });
    expect(service.get('server')?.title).toBe('Server wins');
  });

  it('forwards local mutations through the transport adapter', async () => {
    await sync.start();
    service.publish({ title: 'Outbound' });
    expect(transport.sent.length).toBeGreaterThan(0);
    expect(transport.sent.at(-1)).toMatchObject({ type: 'publish' });
  });

  it('continues without BroadcastChannel for multi-tab fan-out', async () => {
    const original = globalThis.BroadcastChannel;
    // @ts-expect-error intentional restricted-environment simulation
    delete globalThis.BroadcastChannel;
    try {
      await sync.start();
      expect(sync.connected()).toBe(true);
      service.publish({ title: 'Single tab' });
      expect(service.inbox()).toHaveLength(1);
    } finally {
      Object.defineProperty(globalThis, 'BroadcastChannel', {
        value: original,
        configurable: true,
        writable: true,
      });
    }
  });

  it('groups notifications by day and respects quiet-hours windows', () => {
    const morning = new Date('2026-07-19T09:00:00');
    const evening = new Date('2026-07-19T23:00:00');
    expect(
      isWithinQuietHours(
        {
          mutedCategories: [],
          disabledChannels: [],
          quietHoursEnabled: true,
          quietHoursStart: '22:00',
          quietHoursEnd: '07:00',
        },
        evening,
      ),
    ).toBe(true);
    expect(
      isWithinQuietHours(
        {
          mutedCategories: [],
          disabledChannels: [],
          quietHoursEnabled: true,
          quietHoursStart: '22:00',
          quietHoursEnd: '07:00',
        },
        morning,
      ),
    ).toBe(false);

    service.publish({
      id: 'a',
      title: 'A',
      createdAt: new Date('2026-07-18T12:00:00'),
    });
    service.publish({
      id: 'b',
      title: 'B',
      createdAt: new Date('2026-07-19T12:00:00'),
    });
    const groups = groupNotifications(service.notifications(), 'day');
    expect(groups).toHaveLength(2);
    expect(groups.map((group) => group.key)).toEqual(['2026-07-19', '2026-07-18']);
    expect(groups[0]?.notifications.map((item) => item.id)).toEqual(['b']);
    expect(groups[1]?.notifications.map((item) => item.id)).toEqual(['a']);
  });

  it('orders day groups newest-first with unread before read within a day', () => {
    service.publish({
      id: 'older-unread',
      title: 'Older unread',
      createdAt: new Date('2026-07-19T10:00:00'),
    });
    const newerId = service.publish({
      id: 'newer-read',
      title: 'Newer read',
      createdAt: new Date('2026-07-19T15:00:00'),
    });
    service.publish({
      id: 'yesterday',
      title: 'Yesterday',
      createdAt: new Date('2026-07-18T12:00:00'),
    });
    service.markRead(newerId);

    const groups = groupNotifications(service.notifications(), 'day');
    expect(groups.map((group) => group.key)).toEqual(['2026-07-19', '2026-07-18']);
    expect(groups[0]?.notifications.map((item) => item.id)).toEqual([
      'older-unread',
      'newer-read',
    ]);
    expect(groups[1]?.notifications.map((item) => item.id)).toEqual(['yesterday']);
  });

  it('suppresses interruptive channels while muted or channel-disabled', () => {
    service.setPreferences({ mutedCategories: ['security'] });
    const mutedId = service.publish({
      title: 'Muted toast',
      priority: 'high',
      category: 'security',
    });
    expect(service.get(mutedId)?.channels).toEqual(['inbox', 'toast']);
    expect(service.banners()).toHaveLength(0);

    service.setPreferences({
      mutedCategories: [],
      disabledChannels: ['dialog'],
    });
    const dialogId = service.publish({
      title: 'Dialog blocked',
      channels: ['inbox', 'dialog'],
    });
    expect(service.get(dialogId)?.channels).toEqual(['inbox', 'dialog']);
  });
});
