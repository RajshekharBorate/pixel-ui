import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PixelDialogService } from '../pixel-dialog/pixel-dialog.service';
import { providePixelNotifications } from './pixel-notification.config';
import { PixelPushMemorySubscriptionAdapter } from './pixel-notification-push.adapters';
import { providePixelPushNotifications } from './pixel-notification-push.provide';
import { PixelPushNotificationService } from './pixel-notification-push.service';
import { providePixelPushPromptScheduler } from './pixel-notification-push-prompt.scheduler.provide';
import {
  PixelPushPromptScheduler,
  isCooldownActive,
  readCooldown,
  writeCooldown,
} from './pixel-notification-push-prompt.scheduler';

const STORAGE_KEY = 'pixel-push-prompt-cooldown-test';

@Component({
  template: `<input id="edit-probe" />`,
})
class FocusHostComponent {}

describe('PixelPushPromptScheduler storage helpers', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it('reads and writes cooldown records', () => {
    expect(readCooldown(STORAGE_KEY)).toBeNull();
    writeCooldown(STORAGE_KEY, { dismissedAt: 1_000 });
    expect(readCooldown(STORAGE_KEY)).toEqual({ dismissedAt: 1_000 });
    expect(isCooldownActive(STORAGE_KEY, 500, 1_400)).toBe(true);
    expect(isCooldownActive(STORAGE_KEY, 500, 1_600)).toBe(false);
    writeCooldown(STORAGE_KEY, null);
    expect(readCooldown(STORAGE_KEY)).toBeNull();
  });
});

describe('PixelPushPromptScheduler', () => {
  let permission: NotificationPermission;
  let pushSubscription: PushSubscription | null;
  let events: string[];

  const registration = {
    pushManager: {
      getSubscription: async () => pushSubscription,
      subscribe: async () => {
        pushSubscription = {
          endpoint: 'https://push.example/sched',
          expirationTime: null,
          options: { userVisibleOnly: true, applicationServerKey: null },
          getKey: () => null,
          toJSON: () => ({
            endpoint: 'https://push.example/sched',
            expirationTime: null,
            keys: { p256dh: 'p', auth: 'a' },
          }),
          unsubscribe: async () => {
            pushSubscription = null;
            return true;
          },
        } as unknown as PushSubscription;
        return pushSubscription;
      },
    },
  } as unknown as ServiceWorkerRegistration;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    localStorage.removeItem(STORAGE_KEY);
    permission = 'default';
    pushSubscription = null;
    events = [];

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
      value: { ready: Promise.resolve(registration) },
    });

    await TestBed.configureTestingModule({
      providers: [
        providePixelNotifications(),
        providePixelPushNotifications({
          subscription: new PixelPushMemorySubscriptionAdapter(),
          serviceWorker: { getRegistration: async () => registration },
        }),
        providePixelPushPromptScheduler({
          mode: 'manual',
          storageKey: STORAGE_KEY,
          cooldownMs: 60_000,
          autoStart: false,
          onEvent: (e) => events.push(e.type),
        }),
      ],
    }).compileComponents();

    const push = TestBed.inject(PixelPushNotificationService);
    await push.refresh();
  });

  afterEach(() => {
    TestBed.inject(PixelDialogService).closeAll();
    localStorage.removeItem(STORAGE_KEY);
    document.querySelectorAll('[role="alertdialog"]').forEach((n) => n.remove());
  });

  it('is eligible when permission is default and not subscribed', () => {
    const scheduler = TestBed.inject(PixelPushPromptScheduler);
    expect(scheduler.isEligible()).toBe(true);
  });

  it('skips when permission is denied', async () => {
    permission = 'denied';
    const push = TestBed.inject(PixelPushNotificationService);
    await push.refresh();
    const scheduler = TestBed.inject(PixelPushPromptScheduler);
    expect(scheduler.show('manual')).toBe(false);
    expect(events).toContain('skipped');
    expect(scheduler.lastEvent()?.reason).toBe('eligibility');
  });

  it('skips when cooldown is active', () => {
    writeCooldown(STORAGE_KEY, { dismissedAt: Date.now() });
    const scheduler = TestBed.inject(PixelPushPromptScheduler);
    expect(scheduler.show('manual')).toBe(false);
    expect(events).toContain('suppressed');
    expect(scheduler.lastEvent()?.reason).toBe('cooldown');
  });

  it('opens a dialog and records shown', () => {
    const scheduler = TestBed.inject(PixelPushPromptScheduler);
    const dialog = TestBed.inject(PixelDialogService);
    expect(scheduler.show('manual')).toBe(true);
    expect(dialog.openDialogs.length).toBe(1);
    expect(events).toContain('shown');
  });

  it('opens dialog chrome: title opposite close, CTAs in footer', () => {
    const scheduler = TestBed.inject(PixelPushPromptScheduler);
    expect(scheduler.show('manual')).toBe(true);
    const prompt = document.querySelector('pixel-notification-push-prompt') as HTMLElement | null;
    expect(prompt?.getAttribute('data-surface')).toBe('flat');
    expect(prompt?.getAttribute('data-layout')).toBe('dialog');
    const title = document.querySelector('.pixel-dialog__title');
    expect(title?.textContent?.trim()).toBe('Stay informed on the go');
    expect(document.querySelector('.pixel-dialog__close')).toBeTruthy();
    expect(
      document.querySelector('.pixel-notification-push-prompt__heading'),
    ).toBeNull();
    const footer = document.querySelector('.pixel-dialog__footer');
    expect(footer?.textContent).toContain('Not now');
    expect(footer?.textContent).toContain('Enable push');
    expect(document.body.textContent).not.toContain('Background alerts');
    expect(document.body.textContent).toContain('You can enable later in Settings.');
  });

  it('skips while a critical alertdialog is in the DOM', () => {
    const alert = document.createElement('div');
    alert.setAttribute('role', 'alertdialog');
    document.body.appendChild(alert);
    const scheduler = TestBed.inject(PixelPushPromptScheduler);
    expect(scheduler.show('manual')).toBe(false);
    expect(scheduler.lastEvent()?.reason).toBe('critical-dialog');
  });

  it('writes cooldown after soft dismiss finalize', async () => {
    const scheduler = TestBed.inject(PixelPushPromptScheduler);
    const dialog = TestBed.inject(PixelDialogService);
    expect(scheduler.show('manual')).toBe(true);
    const ref = dialog.openDialogs[0]!;
    ref.close('dismissed');
    ref._finalizeClose();
    await Promise.resolve();
    expect(readCooldown(STORAGE_KEY)).not.toBeNull();
    expect(events).toContain('dismissed');
  });

  it('showAfterValueMoment opens when eligible', () => {
    const scheduler = TestBed.inject(PixelPushPromptScheduler);
    expect(scheduler.showAfterValueMoment()).toBe(true);
    expect(events).toContain('shown');
    expect(scheduler.lastEvent()?.reason).toBe('value-moment');
  });

  it('clearCooldown restores eligibility', () => {
    writeCooldown(STORAGE_KEY, { dismissedAt: Date.now() });
    const scheduler = TestBed.inject(PixelPushPromptScheduler);
    expect(scheduler.isEligible()).toBe(false);
    scheduler.clearCooldown();
    expect(scheduler.isEligible()).toBe(true);
  });

  it('defers when focus is in an input', () => {
    const fixture = TestBed.createComponent(FocusHostComponent);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('#edit-probe') as HTMLInputElement;
    input.focus();
    const scheduler = TestBed.inject(PixelPushPromptScheduler);
    expect(scheduler.show('manual')).toBe(false);
    expect(scheduler.lastEvent()?.reason).toBe('editing');
  });

  it('does not request native permission on show', () => {
    let requested = false;
    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: {
        get permission() {
          return permission;
        },
        requestPermission: async () => {
          requested = true;
          permission = 'granted';
          return permission;
        },
      },
    });
    const scheduler = TestBed.inject(PixelPushPromptScheduler);
    scheduler.show('manual');
    expect(requested).toBe(false);
  });
});
