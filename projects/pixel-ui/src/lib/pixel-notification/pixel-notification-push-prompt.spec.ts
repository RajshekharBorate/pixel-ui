import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PixelPushMemorySubscriptionAdapter } from './pixel-notification-push.adapters';
import { providePixelPushNotifications } from './pixel-notification-push.provide';
import PixelNotificationPushPromptComponent from './pixel-notification-push-prompt';

@Component({
  imports: [PixelNotificationPushPromptComponent],
  template: `<pixel-notification-push-prompt />`,
})
class HostComponent {}

describe('PixelNotificationPushPromptComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

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
    fixture.detectChanges();
  });

  it('renders an enable CTA for the default permission state', () => {
    const button = fixture.debugElement.query(By.css('pixel-button'));
    expect(button).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Enable push');
  });
});
