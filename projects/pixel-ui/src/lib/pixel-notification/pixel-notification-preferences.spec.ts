import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import PixelNotificationBannerComponent from './pixel-notification-banner';
import PixelNotificationPreferencesComponent from './pixel-notification-preferences';
import type { PixelNotification } from './pixel-notification.types';
import { PIXEL_NOTIFICATION_DEFAULT_PREFERENCES } from './pixel-notification.adapters';

@Component({
  template: `
    <pixel-notification-banner [notifications]="notifications" />
    <pixel-notification-preferences
      [categories]="['security', 'billing']"
      [preferences]="preferences"
      (preferencesChange)="lastPreferences = $event"
    />
  `,
  imports: [PixelNotificationBannerComponent, PixelNotificationPreferencesComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HostComponent {
  notifications: readonly PixelNotification[] = [
    createNotification({
      id: 'banner-1',
      title: 'Banner A',
      channels: ['banner'],
    }),
    createNotification({
      id: 'inbox-1',
      title: 'Inbox only',
      channels: ['inbox'],
    }),
  ];
  preferences = { ...PIXEL_NOTIFICATION_DEFAULT_PREFERENCES };
  lastPreferences = this.preferences;
}

describe('PixelNotification banner and preferences', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders only banner-channel records', () => {
    const items = fixture.debugElement.queryAll(By.css('pixel-notification-item'));
    expect(items).toHaveLength(1);
  });

  it('emits preference snapshots when quiet hours are enabled', () => {
    const checkbox = fixture.debugElement
      .queryAll(By.css('pixel-checkbox'))
      .find((node) => node.componentInstance.label?.() === 'Enable quiet hours');
    expect(checkbox).toBeTruthy();
    checkbox!.componentInstance.checkedChange.emit(true);
    fixture.detectChanges();
    expect(host.lastPreferences.quietHoursEnabled).toBe(true);
  });
});

function createNotification(
  patch: Partial<PixelNotification> & Pick<PixelNotification, 'id' | 'title'>,
): PixelNotification {
  return {
    message: '',
    severity: 'neutral',
    priority: 'normal',
    state: 'default',
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
    channels: ['inbox'],
    dedupeKey: '',
    data: {},
    ...patch,
  };
}
