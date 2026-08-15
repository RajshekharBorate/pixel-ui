import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PixelPushMemorySubscriptionAdapter } from './pixel-notification-push.adapters';
import { providePixelPushNotifications } from './pixel-notification-push.provide';
import { PixelPushNotificationService } from './pixel-notification-push.service';
import type {
  PixelPushPermissionState,
  PixelPushSubscriptionRecord,
} from './pixel-notification-push.types';
import type {
  PixelNotificationPushPromptLabels,
  PixelNotificationPushPromptLayout,
  PixelNotificationPushPromptSurface,
} from './pixel-notification-push-prompt';
import PixelNotificationPushPromptComponent, {
  PixelPushPromptContentDirective,
  detectPushPromptBrowserFamily,
} from './pixel-notification-push-prompt';

@Component({
  imports: [PixelNotificationPushPromptComponent],
  template: `
    <pixel-notification-push-prompt
      [compact]="compact()"
      [surface]="surface()"
      [layout]="layout()"
      [deviceLabel]="deviceLabel()"
      [dismissible]="dismissible()"
      [showBenefits]="showBenefits()"
      [siteSettingsHref]="siteSettingsHref()"
      [labels]="labels()"
      (dismissed)="dismissedCount.set(dismissedCount() + 1)"
      (settingsRequest)="settingsCount.set(settingsCount() + 1)"
      (continueWithInbox)="inboxCount.set(inboxCount() + 1)"
    />
  `,
})
class HostComponent {
  readonly compact = signal(false);
  readonly surface = signal<PixelNotificationPushPromptSurface>('card');
  readonly layout = signal<PixelNotificationPushPromptLayout>('inline');
  readonly deviceLabel = signal('docs-demo');
  readonly dismissible = signal(true);
  readonly showBenefits = signal(true);
  readonly siteSettingsHref = signal('');
  readonly labels = signal<Partial<PixelNotificationPushPromptLabels>>({});
  readonly dismissedCount = signal(0);
  readonly settingsCount = signal(0);
  readonly inboxCount = signal(0);
}

@Component({
  imports: [PixelNotificationPushPromptComponent, PixelPushPromptContentDirective],
  template: `
    <pixel-notification-push-prompt surface="flat">
      <div pixelPushPromptContent>
        <h3 class="custom-heading">Approvals as they land</h3>
        <p class="custom-desc">One alert per request — mute anytime.</p>
      </div>
    </pixel-notification-push-prompt>
  `,
})
class CustomContentHostComponent {}

type PushInternals = {
  permissionState: { set(v: PixelPushPermissionState): void };
  subscriptionState: { set(v: PixelPushSubscriptionRecord | null): void };
  lastErrorState: { set(v: string | null): void };
  refresh: () => Promise<unknown>;
};

const SAMPLE_SUB: PixelPushSubscriptionRecord = {
  endpoint: 'https://push.example/sub/1',
  expirationTime: null,
  keys: { p256dh: 'p', auth: 'a' },
  createdAt: new Date().toISOString(),
  deviceLabel: 'docs-demo',
};

describe('detectPushPromptBrowserFamily', () => {
  it('classifies common user agents', () => {
    expect(detectPushPromptBrowserFamily('Mozilla/5.0 Firefox/128.0')).toBe('firefox');
    expect(
      detectPushPromptBrowserFamily(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15',
      ),
    ).toBe('safari');
    expect(
      detectPushPromptBrowserFamily(
        'Mozilla/5.0 Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
      ),
    ).toBe('chromium');
    expect(detectPushPromptBrowserFamily('UnknownBot/1.0')).toBe('other');
  });
});

describe('PixelNotificationPushPromptComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let push: PushInternals;

  beforeEach(async () => {
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: { permission: 'default', requestPermission: async () => 'default' },
    });
    Object.defineProperty(window, 'PushManager', {
      configurable: true,
      value: function PushManager() {},
    });
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { getRegistration: async () => null, ready: Promise.resolve(null) },
    });

    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        providePixelPushNotifications({
          subscription: new PixelPushMemorySubscriptionAdapter(),
        }),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    push = TestBed.inject(PixelPushNotificationService) as unknown as PushInternals;
    fixture.detectChanges();
  });

  it('renders soft-ask anatomy with enable CTA and benefit chips', () => {
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Stay informed on the go');
    expect(root.textContent).toContain('Enable push');
    expect(root.textContent).toContain('Not now');
    expect(root.textContent).toContain('Background alerts');
    expect(fixture.debugElement.query(By.css('.pixel-notification-push-prompt__icon'))).toBeTruthy();
    expect(fixture.debugElement.queryAll(By.css('pixel-chip')).length).toBe(2);
  });

  it('hides the host after Not now and emits dismissed', () => {
    const dismiss = fixture.debugElement
      .queryAll(By.css('pixel-button'))
      .find((b) => b.nativeElement.textContent?.includes('Not now'));
    expect(dismiss).toBeTruthy();
    dismiss!.triggerEventHandler('click');
    fixture.detectChanges();
    expect(host.dismissedCount()).toBe(1);
    const promptEl = fixture.debugElement.query(By.css('pixel-notification-push-prompt'))
      .nativeElement as HTMLElement;
    expect(promptEl.hasAttribute('hidden')).toBe(true);
  });

  it('compact density hides benefits and Not now', () => {
    host.compact.set(true);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).not.toContain('Background alerts');
    expect(root.textContent).not.toContain('Not now');
    expect(root.textContent).toContain('Enable push');
  });

  it('shows Try again when lastError is set', () => {
    push.lastErrorState.set('Subscription sync failed.');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Try again');
    expect(root.textContent).toContain('Something went wrong:');
    expect(root.textContent).toContain('Subscription sync failed.');
  });

  it('renders subscribed status pill, device meta, and disable CTA', () => {
    push.permissionState.set('granted');
    push.subscriptionState.set(SAMPLE_SUB);
    push.lastErrorState.set(null);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Push is on');
    expect(root.textContent).toContain('Active');
    expect(root.textContent).toContain('This device');
    expect(root.textContent).toContain('docs-demo');
    expect(root.textContent).toContain('Disable push');
  });

  it('denied state shows continue CTA and always-visible allow guidance', () => {
    push.permissionState.set('denied');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Notifications blocked');
    expect(root.textContent).toContain('Continue with inbox only');
    expect(root.textContent).not.toContain('How to allow');
    expect(root.textContent).not.toMatch(/Try again/);
    expect(fixture.debugElement.query(By.css('.pixel-notification-push-prompt__help'))).toBeTruthy();
    expect(root.textContent).toContain('Allow notifications for this site');
    expect(root.textContent).toContain('Reload this page after allowing');
    expect(fixture.debugElement.queryAll(By.css('pixel-button')).length).toBe(1);
  });

  it('denied Continue with inbox emits and hides', () => {
    push.permissionState.set('denied');
    fixture.detectChanges();
    fixture.debugElement
      .queryAll(By.css('pixel-button'))
      .find((b) => b.nativeElement.textContent?.includes('Continue with inbox only'))!
      .triggerEventHandler('click');
    fixture.detectChanges();
    expect(host.inboxCount()).toBe(1);
  });

  it('denied help article link emits settingsRequest', () => {
    host.siteSettingsHref.set('https://example.com/push-help');
    push.permissionState.set('denied');
    fixture.detectChanges();
    const link = fixture.debugElement.query(By.css('.pixel-notification-push-prompt__help-link'));
    expect(link).toBeTruthy();
    link.triggerEventHandler('click', new MouseEvent('click'));
    fixture.detectChanges();
    expect(host.settingsCount()).toBe(1);
  });

  it('renders unsupported messaging without CTAs', () => {
    push.permissionState.set('unsupported');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Push not available');
    expect(fixture.debugElement.queryAll(By.css('pixel-button')).length).toBe(0);
  });

  it('renders insecure messaging without CTAs', () => {
    push.permissionState.set('insecure-context');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Secure connection required');
    expect(fixture.debugElement.queryAll(By.css('pixel-button')).length).toBe(0);
  });

  it('applies card surface by default and flat without border chrome', () => {
    const prompt = fixture.debugElement.query(By.css('pixel-notification-push-prompt'))
      .nativeElement as HTMLElement;
    expect(prompt.getAttribute('data-surface')).toBe('card');
    expect(
      fixture.debugElement.query(By.css('.pixel-notification-push-prompt__surface--card')),
    ).toBeTruthy();

    host.surface.set('flat');
    fixture.detectChanges();
    expect(prompt.getAttribute('data-surface')).toBe('flat');
    expect(
      fixture.debugElement.query(By.css('.pixel-notification-push-prompt__surface--flat')),
    ).toBeTruthy();
    expect(
      fixture.debugElement.query(By.css('.pixel-notification-push-prompt__surface--card')),
    ).toBeNull();
  });

  it('overrides soft-ask heading and description via labels', () => {
    host.labels.set({
      heading: 'Watch this thread',
      description: 'Get a ping when someone replies.',
    });
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Watch this thread');
    expect(root.textContent).toContain('Get a ping when someone replies.');
    expect(root.textContent).not.toContain('Stay informed on the go');
  });

  it('dialog layout hides in-body heading, chips, and marks footer CTAs', () => {
    host.layout.set('dialog');
    host.surface.set('flat');
    fixture.detectChanges();
    const prompt = fixture.debugElement.query(By.css('pixel-notification-push-prompt'))
      .nativeElement as HTMLElement;
    expect(prompt.getAttribute('data-layout')).toBe('dialog');
    expect(fixture.debugElement.query(By.css('.pixel-notification-push-prompt__heading'))).toBeNull();
    expect(fixture.debugElement.queryAll(By.css('pixel-chip')).length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('You can enable later in Settings.');
    expect(fixture.nativeElement.textContent).toContain('Enable push');
    expect(fixture.nativeElement.textContent).toContain('Not now');
    const footerBtns = fixture.debugElement.queryAll(By.css('[pixelDialogFooter]'));
    expect(footerBtns.length).toBe(2);
    expect(footerBtns[0].nativeElement.textContent).toContain('Not now');
    expect(footerBtns[1].nativeElement.textContent).toContain('Enable push');
  });

  it('dialog layout can hide settings hint via empty label', () => {
    host.layout.set('dialog');
    host.labels.set({ settingsHint: '' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('You can enable later in Settings.');
  });
});

describe('PixelNotificationPushPromptComponent custom content', () => {
  let fixture: ComponentFixture<CustomContentHostComponent>;
  let push: PushInternals;

  beforeEach(async () => {
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: { permission: 'default', requestPermission: async () => 'default' },
    });
    Object.defineProperty(window, 'PushManager', {
      configurable: true,
      value: function PushManager() {},
    });
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { getRegistration: async () => null, ready: Promise.resolve(null) },
    });

    await TestBed.configureTestingModule({
      imports: [CustomContentHostComponent],
      providers: [
        providePixelPushNotifications({
          subscription: new PixelPushMemorySubscriptionAdapter(),
        }),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CustomContentHostComponent);
    push = TestBed.inject(PixelPushNotificationService) as unknown as PushInternals;
    fixture.detectChanges();
  });

  it('projects custom content and hides default soft-ask copy', () => {
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Approvals as they land');
    expect(root.textContent).toContain('One alert per request');
    expect(root.textContent).not.toContain('Stay informed on the go');
    expect(fixture.debugElement.query(By.css('.pixel-notification-push-prompt__heading'))).toBeNull();
    expect(
      fixture.debugElement.query(By.css('pixel-notification-push-prompt'))
        .nativeElement.getAttribute('data-surface'),
    ).toBe('flat');
  });

  it('keeps label copy for denied state even with projected content', () => {
    push.permissionState.set('denied');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Notifications blocked');
    expect(fixture.debugElement.query(By.css('.pixel-notification-push-prompt__heading'))).toBeTruthy();
    const custom = fixture.debugElement.query(By.css('.pixel-notification-push-prompt__custom'))
      .nativeElement as HTMLElement;
    expect(custom.hasAttribute('hidden')).toBe(true);
  });
});
