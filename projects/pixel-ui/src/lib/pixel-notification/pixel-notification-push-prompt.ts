import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import PixelButtonComponent from '../pixel-button/pixel-button';
import PixelEmptyStateComponent from '../pixel-empty-state/pixel-empty-state';
import { PixelPushNotificationService } from './pixel-notification-push.service';
import type { PixelPushOperationResult } from './pixel-notification-push.types';

export interface PixelNotificationPushPromptLabels {
  readonly heading: string;
  readonly description: string;
  readonly enable: string;
  readonly disable: string;
  readonly busy: string;
  readonly unsupportedHeading: string;
  readonly unsupportedDescription: string;
  readonly insecureHeading: string;
  readonly insecureDescription: string;
  readonly deniedHeading: string;
  readonly deniedDescription: string;
  readonly subscribedHeading: string;
  readonly subscribedDescription: string;
  readonly errorPrefix: string;
}

export const DEFAULT_NOTIFICATION_PUSH_PROMPT_LABELS: PixelNotificationPushPromptLabels = {
  heading: 'Enable push notifications',
  description:
    'Get alerted for high-priority updates even when this tab is in the background. You can mute categories anytime in notification preferences.',
  enable: 'Enable push',
  disable: 'Disable push',
  busy: 'Working…',
  unsupportedHeading: 'Push not available',
  unsupportedDescription: 'This browser does not support Web Push.',
  insecureHeading: 'Secure connection required',
  insecureDescription: 'Web Push only works on HTTPS (or localhost).',
  deniedHeading: 'Notifications blocked',
  deniedDescription:
    'Permission was denied in the browser. Open site settings to allow notifications, or keep using the in-app inbox.',
  subscribedHeading: 'Push is on',
  subscribedDescription:
    'Permission granted. High-priority events can appear as system notifications when your server sends Web Push (enabling alone does not fire an alert).',
  errorPrefix: 'Something went wrong: ',
};

/**
 * Soft-ask / recovery UI for Web Push. Never calls `enable()` on its own — only from the
 * explicit CTA. Compose near settings or after a value moment (approval success, etc.).
 */
@Component({
  selector: 'pixel-notification-push-prompt',
  imports: [PixelButtonComponent, PixelEmptyStateComponent],
  templateUrl: './pixel-notification-push-prompt.html',
  styleUrl: './pixel-notification-push-prompt.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-notification-push-prompt',
    '[attr.data-compact]': 'compact() || null',
  },
})
export default class PixelNotificationPushPromptComponent {
  private readonly push = inject(PixelPushNotificationService);

  /**
   * @type {boolean}
   * @default false
   * @description Compact density for drawers / dense settings.
   */
  readonly compact = input(false, { transform: booleanAttribute });

  /**
   * @type {string}
   * @default ''
   * @description Optional device label stored with the subscription DTO.
   */
  readonly deviceLabel = input('');

  /**
   * @type {Partial<PixelNotificationPushPromptLabels>}
   * @default {}
   * @description Override chrome copy.
   */
  readonly labels = input<Partial<PixelNotificationPushPromptLabels>>({});

  readonly enabled = output<PixelPushOperationResult>();
  readonly disabled = output<PixelPushOperationResult>();

  protected readonly l = computed(
    (): PixelNotificationPushPromptLabels => ({
      ...DEFAULT_NOTIFICATION_PUSH_PROMPT_LABELS,
      ...this.labels(),
    }),
  );

  protected readonly permission = this.push.permission;
  protected readonly status = this.push.status;
  protected readonly busy = this.push.busy;
  protected readonly lastError = this.push.lastError;
  protected readonly subscribed = computed(() => this.push.status() === 'subscribed');

  protected readonly view = computed(() => {
    const permission = this.permission();
    if (permission === 'unsupported') {
      return 'unsupported' as const;
    }
    if (permission === 'insecure-context') {
      return 'insecure' as const;
    }
    if (permission === 'denied') {
      return 'denied' as const;
    }
    if (this.subscribed()) {
      return 'subscribed' as const;
    }
    return 'prompt' as const;
  });

  protected async onEnable(): Promise<void> {
    const result = await this.push.enable({
      deviceLabel: this.deviceLabel() || undefined,
    });
    this.enabled.emit(result);
  }

  protected async onDisable(): Promise<void> {
    const result = await this.push.disable();
    this.disabled.emit(result);
  }
}
