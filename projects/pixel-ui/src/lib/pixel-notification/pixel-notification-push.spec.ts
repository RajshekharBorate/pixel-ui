import { TestBed } from '@angular/core/testing';
import { PixelToastService } from '../pixel-toast/pixel-toast.service';
import { PixelNavigateService } from '../services/navigate/navigate.service';
import { providePixelNotifications } from './pixel-notification.config';
import { PixelNotificationService } from './pixel-notification.service';
import {
  PixelPushMemorySubscriptionAdapter,
  decodeVapidPublicKey,
  parsePixelPushPayload,
  toPushSubscriptionRecord,
} from './pixel-notification-push.adapters';
import { PixelPushNotificationBridge } from './pixel-notification-push.bridge';
import { providePixelPushNotifications } from './pixel-notification-push.provide';
import { PixelPushNotificationService } from './pixel-notification-push.service';
import {
  buildOsNotificationOptions,
  readPixelPushPrefsCache,
  shouldShowOsNotification,
  writePixelPushPrefsCache,
} from './pixel-notification-push.sw';
import {
  materialSymbolsOutlinedUrl,
  resolveOsNotificationVisuals,
  severityToMaterialIconName,
} from './pixel-notification-push.visuals';

function mockPushSubscription(endpoint = 'https://push.example/sub/1'): PushSubscription {
  return {
    endpoint,
    expirationTime: null,
    options: { userVisibleOnly: true, applicationServerKey: null },
    getKey: () => null,
    toJSON: () => ({
      endpoint,
      expirationTime: null,
      keys: { p256dh: 'p256', auth: 'auth' },
    }),
    unsubscribe: async () => true,
  } as unknown as PushSubscription;
}

describe('pixel-notification-push adapters', () => {
  it('decodeVapidPublicKey round-trips URL-safe base64', () => {
    const bytes = decodeVapidPublicKey('AQID');
    expect(Array.from(bytes)).toEqual([1, 2, 3]);
  });

  it('parsePixelPushPayload accepts nested and bare notification shapes', () => {
    expect(
      parsePixelPushPayload({
        notification: { title: 'Hello', message: 'World' },
        push: { tag: 't1' },
      }),
    ).toEqual({
      notification: { title: 'Hello', message: 'World' },
      push: { tag: 't1' },
    });
    expect(parsePixelPushPayload(JSON.stringify({ title: 'Bare' }))).toEqual({
      notification: { title: 'Bare' },
      push: undefined,
    });
    expect(parsePixelPushPayload('not-json')).toBeNull();
  });

  it('toPushSubscriptionRecord maps browser subscription JSON', () => {
    const record = toPushSubscriptionRecord(mockPushSubscription(), {
      deviceLabel: 'test',
      now: new Date('2026-08-08T12:00:00.000Z'),
    });
    expect(record).toEqual({
      endpoint: 'https://push.example/sub/1',
      expirationTime: null,
      keys: { p256dh: 'p256', auth: 'auth' },
      userAgent: expect.any(String),
      deviceLabel: 'test',
      createdAt: '2026-08-08T12:00:00.000Z',
    });
  });
});

describe('PixelPushNotificationService', () => {
  let adapter: PixelPushMemorySubscriptionAdapter;
  let pushSubscription: PushSubscription;
  let permission: NotificationPermission;

  const registration = {
    pushManager: {
      getSubscription: async () => pushSubscription,
      subscribe: async () => {
        pushSubscription = mockPushSubscription();
        return pushSubscription;
      },
    },
  } as unknown as ServiceWorkerRegistration;

  beforeEach(() => {
    TestBed.resetTestingModule();
    adapter = new PixelPushMemorySubscriptionAdapter();
    pushSubscription = null as unknown as PushSubscription;
    permission = 'default';

    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: {
        get permission() {
          return permission;
        },
        requestPermission: async () => {
          permission = 'granted';
          return permission;
        },
      },
    });
    Object.defineProperty(window, 'PushManager', {
      configurable: true,
      value: function PushManager() {},
    });
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        getRegistration: async () => registration,
        ready: Promise.resolve(registration),
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        controller: null,
      },
    });

    TestBed.configureTestingModule({
      providers: [
        providePixelPushNotifications({
          subscription: adapter,
          serviceWorker: { getRegistration: async () => registration },
        }),
      ],
    });
  });

  it('reports unsupported when PushManager is missing', async () => {
    Object.defineProperty(window, 'PushManager', { configurable: true, value: undefined });
    const service = TestBed.inject(PixelPushNotificationService);
    await service.refresh();
    expect(service.permission()).toBe('unsupported');
    expect(service.supported()).toBe(false);
  });

  it('enable subscribes, persists, and exposes subscribed status', async () => {
    const service = TestBed.inject(PixelPushNotificationService);
    const result = await service.enable({ deviceLabel: 'unit' });
    expect(result.error).toBeUndefined();
    expect(result.ok).toBe(true);
    expect(result.permission).toBe('granted');
    expect(result.subscription?.endpoint).toBe('https://push.example/sub/1');
    expect(adapter.getSaved()?.deviceLabel).toBe('unit');
    expect(service.status()).toBe('subscribed');
  });

  it('disable unsubscribes and clears the adapter record', async () => {
    const service = TestBed.inject(PixelPushNotificationService);
    await service.enable();
    const result = await service.disable();
    expect(result.ok).toBe(true);
    expect(result.subscription).toBeNull();
    expect(adapter.getSaved()).toBeNull();
    expect(service.status()).toBe('idle');
  });

  it('enable fails clearly when permission is denied', async () => {
    permission = 'denied';
    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: {
        get permission() {
          return permission;
        },
        requestPermission: async () => permission,
      },
    });
    const service = TestBed.inject(PixelPushNotificationService);
    const result = await service.enable();
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/denied/i);
    expect(service.status()).toBe('error');
  });

  it('fails to inject when providePixelPushNotifications is missing', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    expect(() => TestBed.inject(PixelPushNotificationService)).toThrow();
  });

  it('rebindAfterLogin re-saves an existing subscription without prompting', async () => {
    const service = TestBed.inject(PixelPushNotificationService);
    await service.enable({ deviceLabel: 'a' });
    const result = await service.rebindAfterLogin({ deviceLabel: 'b' });
    expect(result.ok).toBe(true);
    expect(adapter.getSaved()?.deviceLabel).toBe('b');
  });

  it('clearOnLogout unsubscribes like disable', async () => {
    const service = TestBed.inject(PixelPushNotificationService);
    await service.enable();
    const result = await service.clearOnLogout();
    expect(result.ok).toBe(true);
    expect(adapter.getSaved()).toBeNull();
  });
});

describe('pixel-notification-push visuals', () => {
  it('materialSymbolsOutlinedUrl builds gstatic Material SVG paths', () => {
    expect(materialSymbolsOutlinedUrl('warning')).toBe(
      'https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/warning/default/48px.svg',
    );
    expect(severityToMaterialIconName('error')).toBe('error');
    expect(severityToMaterialIconName('success')).toBe('check_circle');
  });

  it('resolveOsNotificationVisuals prefers push.icon then avatar then severity', () => {
    expect(
      resolveOsNotificationVisuals({
        notification: { title: 'A', severity: 'warning', imageSrc: 'https://a.test/p.png' },
        push: { icon: 'https://a.test/explicit.png' },
      }).icon,
    ).toBe('https://a.test/explicit.png');

    expect(
      resolveOsNotificationVisuals({
        notification: { title: 'A', severity: 'error', imageSrc: 'https://a.test/avatar.png' },
      }).icon,
    ).toBe('https://a.test/avatar.png');

    expect(
      resolveOsNotificationVisuals({
        notification: { title: 'A', severity: 'info' },
        push: { leading: 'severity' },
      }).icon,
    ).toContain('/info/default/48px.svg');

    expect(
      resolveOsNotificationVisuals({
        notification: { title: 'A', imageSrc: 'https://a.test/avatar.png' },
        push: { leading: 'none', image: 'https://a.test/hero.jpg' },
      }),
    ).toEqual({
      image: 'https://a.test/hero.jpg',
      badge: undefined,
    });
  });
});

describe('pixel-notification-push SW helpers', () => {
  it('shouldShowOsNotification honors muted categories, disabled push, and quiet hours', () => {
    const payload = {
      notification: { title: 'Hi', category: 'security', priority: 'high' as const },
    };
    expect(
      shouldShowOsNotification(payload, {
        mutedCategories: ['security'],
        disabledChannels: [],
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        updatedAt: 0,
      }),
    ).toBe(false);
    expect(
      shouldShowOsNotification(payload, {
        mutedCategories: [],
        disabledChannels: ['push'],
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        updatedAt: 0,
      }),
    ).toBe(false);
    expect(
      shouldShowOsNotification(
        payload,
        {
          mutedCategories: [],
          disabledChannels: [],
          quietHoursEnabled: true,
          quietHoursStart: '00:00',
          quietHoursEnd: '23:59',
          updatedAt: 0,
        },
        new Date(2026, 0, 1, 12, 0, 0),
      ),
    ).toBe(false);
  });

  it('buildOsNotificationOptions maps title, tag, actions, and Material icon', () => {
    const built = buildOsNotificationOptions({
      notification: {
        title: 'Approve',
        message: 'Item waiting',
        severity: 'warning',
        dedupeKey: 'a:1',
        actions: [
          { id: 'ok', label: 'OK' },
          { id: 'no', label: 'No' },
          { id: 'x', label: 'Extra' },
        ],
      },
    });
    const options = built.options as NotificationOptions & {
      icon?: string;
      image?: string;
      actions?: unknown[];
    };
    expect(built.title).toBe('Approve');
    expect(options.tag).toBe('a:1');
    expect(options.actions).toHaveLength(2);
    expect(options.icon).toContain('materialsymbolsoutlined/warning/default/48px.svg');
    expect(options.image).toBeUndefined();
  });

  it('buildOsNotificationOptions uses imageSrc as avatar icon, not hero image', () => {
    const built = buildOsNotificationOptions({
      notification: {
        title: 'Chat',
        message: 'New message',
        severity: 'info',
        imageSrc: 'https://cdn.example.com/avatar.png',
      },
      push: { image: 'https://cdn.example.com/hero.jpg' },
    });
    const options = built.options as NotificationOptions & {
      icon?: string;
      image?: string;
      badge?: string;
    };
    expect(options.icon).toBe('https://cdn.example.com/avatar.png');
    expect(options.image).toBe('https://cdn.example.com/hero.jpg');
    expect(options.badge).toContain('materialsymbolsoutlined/info/default/24px.svg');
  });

  it('write/read prefs cache round-trips', () => {
    const store = new Map<string, string>();
    const storage: Storage = {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => {
        store.set(key, value);
      },
      removeItem: (key) => {
        store.delete(key);
      },
      clear: () => store.clear(),
      key: () => null,
      get length() {
        return store.size;
      },
    };
    writePixelPushPrefsCache(
      {
        mutedCategories: ['jobs'],
        disabledChannels: ['push'],
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      },
      storage,
    );
    expect(readPixelPushPrefsCache(storage)?.mutedCategories).toEqual(['jobs']);
  });
});

describe('PixelPushNotificationBridge', () => {
  it('ingestPayload publishes into the notification store', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        providePixelNotifications(),
        providePixelPushNotifications({
          subscription: new PixelPushMemorySubscriptionAdapter(),
        }),
        {
          provide: PixelToastService,
          useValue: { show: () => 't', update() {}, setProgress() {}, remove() {} },
        },
      ],
    });
    const bridge = TestBed.inject(PixelPushNotificationBridge);
    const notifications = TestBed.inject(PixelNotificationService);
    const id = bridge.ingestPayload({
      notification: {
        id: 'push-1',
        title: 'From SW',
        priority: 'high',
        dedupeKey: 'sw:1',
      },
    });
    expect(id).toBe('push-1');
    expect(notifications.get('push-1')?.title).toBe('From SW');
    expect(bridge.lastReceived()?.notification.title).toBe('From SW');
  });

  it('handleActivation invokes bound handlers and navigates', async () => {
    const openFromNotification = vi.fn(async () => null);
    const bound = vi.fn();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        providePixelNotifications(),
        providePixelPushNotifications({
          subscription: new PixelPushMemorySubscriptionAdapter(),
        }),
        {
          provide: PixelToastService,
          useValue: { show: () => 't', update() {}, setProgress() {}, remove() {} },
        },
        {
          provide: PixelNavigateService,
          useValue: { openFromNotification },
        },
      ],
    });
    const bridge = TestBed.inject(PixelPushNotificationBridge);
    const notifications = TestBed.inject(PixelNotificationService);
    notifications.bindActionHandlers({ review: bound });
    notifications.publish({
      id: 'push-click-1',
      title: 'Approve',
      priority: 'high',
      actions: [{ id: 'review', label: 'Review', nav: { queryParams: { x: '1' } } }],
      data: { nav: { queryParams: { x: '1' } } },
    });

    await bridge.handleActivation({
      notificationId: 'push-click-1',
      actionId: 'review',
    });

    expect(bound).toHaveBeenCalledOnce();
    expect(notifications.get('push-click-1')?.readAt).not.toBeNull();
    expect(bridge.lastActivated()?.actionId).toBe('review');
    expect(openFromNotification).toHaveBeenCalledOnce();
    notifications.unbindActionHandlers();
  });
});
