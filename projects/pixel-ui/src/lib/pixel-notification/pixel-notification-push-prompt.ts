import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import PixelBadgeComponent from '../pixel-badge/pixel-badge';
import PixelButtonComponent from '../pixel-button/pixel-button';
import PixelCardComponent from '../pixel-card/pixel-card';
import PixelChipComponent from '../pixel-chip/pixel-chip';
import { PixelPushNotificationService } from './pixel-notification-push.service';
import type { PixelPushOperationResult } from './pixel-notification-push.types';

export type PixelNotificationPushPromptView =
  | 'prompt'
  | 'subscribed'
  | 'denied'
  | 'unsupported'
  | 'insecure';

export type PixelNotificationPushPromptTone =
  | 'primary'
  | 'success'
  | 'warning'
  | 'muted';

/** Best-effort UA family for denied-state recovery copy (not a capability check). */
export type PixelNotificationPushPromptBrowserFamily =
  | 'chromium'
  | 'firefox'
  | 'safari'
  | 'other';

export interface PixelNotificationPushPromptLabels {
  readonly heading: string;
  readonly description: string;
  readonly enable: string;
  readonly disable: string;
  readonly busy: string;
  readonly tryAgain: string;
  readonly dismiss: string;
  readonly benefitBackground: string;
  readonly benefitMute: string;
  readonly activeBadge: string;
  readonly devicePrefix: string;
  /** Denied secondary CTA — expands how-to guidance (does not open native settings). */
  readonly openSettings: string;
  readonly continueInbox: string;
  readonly stillBlocked: string;
  readonly helpHeading: string;
  readonly helpArticle: string;
  readonly helpStepsChromium: readonly string[];
  readonly helpStepsFirefox: readonly string[];
  readonly helpStepsSafari: readonly string[];
  readonly helpStepsOther: readonly string[];
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
  heading: 'Stay informed on the go',
  description:
    'Get high-priority alerts when this tab is in the background. Mute categories anytime.',
  enable: 'Enable push',
  disable: 'Disable push',
  busy: 'Working…',
  tryAgain: 'Try again',
  dismiss: 'Not now',
  benefitBackground: 'Background alerts',
  benefitMute: 'Mute anytime',
  activeBadge: 'Active',
  devicePrefix: 'This device',
  openSettings: 'How to allow',
  continueInbox: 'Continue with inbox only',
  stillBlocked:
    'Still blocked in the browser. Allow notifications for this site, then reload this page.',
  helpHeading: 'Allow notifications for this site',
  helpArticle: 'Open help article',
  helpStepsChromium: [
    'Click the lock or tune icon in the address bar',
    'Open Site settings',
    'Set Notifications to Allow',
    'Reload this page after allowing',
  ],
  helpStepsFirefox: [
    'Click the lock icon in the address bar',
    'Open Connection secure → More information → Permissions',
    'Set Receive Notifications to Allow',
    'Reload this page after allowing',
  ],
  helpStepsSafari: [
    'Open Safari Settings → Websites → Notifications',
    'Find this site and set it to Allow',
    'Reload this page after allowing',
  ],
  helpStepsOther: [
    'Open this site’s permissions from the address bar or browser settings',
    'Set Notifications to Allow',
    'Reload this page after allowing',
  ],
  unsupportedHeading: 'Push not available',
  unsupportedDescription: 'This browser does not support Web Push.',
  insecureHeading: 'Secure connection required',
  insecureDescription: 'Web Push only works on HTTPS (or localhost).',
  deniedHeading: 'Notifications blocked',
  deniedDescription:
    'Permission was denied in the browser. Allow notifications using the steps below, or keep using the in-app inbox.',
  subscribedHeading: 'Push is on',
  subscribedDescription:
    "You'll get system notifications on this device when we send important updates.",
  errorPrefix: 'Something went wrong: ',
};

/** @internal Exported for unit tests. */
export function detectPushPromptBrowserFamily(
  userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '',
): PixelNotificationPushPromptBrowserFamily {
  const ua = userAgent.toLowerCase();
  if (ua.includes('firefox')) {
    return 'firefox';
  }
  if (
    ua.includes('safari') &&
    !ua.includes('chrome') &&
    !ua.includes('chromium') &&
    !ua.includes('android') &&
    !ua.includes('crios') &&
    !ua.includes('fxios')
  ) {
    return 'safari';
  }
  if (
    ua.includes('chrome') ||
    ua.includes('chromium') ||
    ua.includes('edg/') ||
    ua.includes('opr/') ||
    ua.includes('samsungbrowser')
  ) {
    return 'chromium';
  }
  return 'other';
}

/**
 * Soft-ask / recovery UI for Web Push. Never calls `enable()` on its own — only from the
 * explicit CTA. Compose near settings or after a value moment (approval success, etc.).
 */
@Component({
  selector: 'pixel-notification-push-prompt',
  imports: [PixelBadgeComponent, PixelButtonComponent, PixelCardComponent, PixelChipComponent],
  templateUrl: './pixel-notification-push-prompt.html',
  styleUrl: './pixel-notification-push-prompt.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-notification-push-prompt',
    '[attr.data-compact]': 'compact() || null',
    '[attr.data-view]': 'view()',
    '[attr.hidden]': 'hiddenByDismiss() || null',
  },
})
export default class PixelNotificationPushPromptComponent {
  private readonly push = inject(PixelPushNotificationService);
  private readonly dismissedLocally = signal(false);

  /**
   * @type {boolean}
   * @default false
   * @description Compact density for drawers / dense settings (stacked icon + full-width CTA).
   */
  readonly compact = input(false, { transform: booleanAttribute });

  /**
   * @type {string}
   * @default ''
   * @description Optional device label stored with the subscription DTO and shown when subscribed.
   */
  readonly deviceLabel = input('');

  /**
   * @type {boolean}
   * @default true
   * @description Show the secondary “Not now” control on the soft-ask prompt.
   */
  readonly dismissible = input(true, { transform: booleanAttribute });

  /**
   * @type {boolean}
   * @default true
   * @description Show benefit chips on the soft-ask prompt (hidden automatically when compact).
   */
  readonly showBenefits = input(true, { transform: booleanAttribute });

  /**
   * @type {string}
   * @default ''
   * @description Optional help-article URL linked from denied-state guidance. Does not open
   * native browser settings (browsers block that).
   */
  readonly siteSettingsHref = input('');

  /**
   * @type {Partial<PixelNotificationPushPromptLabels>}
   * @default {}
   * @description Override chrome copy.
   */
  readonly labels = input<Partial<PixelNotificationPushPromptLabels>>({});

  readonly enabled = output<PixelPushOperationResult>();
  readonly disabled = output<PixelPushOperationResult>();
  /** Soft-ask dismissed via “Not now” (host may hide or persist preference). */
  readonly dismissed = output<void>();
  /**
   * Denied-state: optional hook when the help-article link is activated.
   * Inline how-to steps always show when permission is denied — no separate CTA.
   */
  readonly settingsRequest = output<void>();
  /** Denied-state: user chose inbox-only and dismissed the prompt. */
  readonly continueWithInbox = output<void>();

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
  protected readonly browserFamily = computed(() => detectPushPromptBrowserFamily());

  protected readonly view = computed((): PixelNotificationPushPromptView => {
    const permission = this.permission();
    if (permission === 'unsupported') {
      return 'unsupported';
    }
    if (permission === 'insecure-context') {
      return 'insecure';
    }
    if (permission === 'denied') {
      return 'denied';
    }
    if (this.subscribed()) {
      return 'subscribed';
    }
    return 'prompt';
  });

  protected readonly tone = computed((): PixelNotificationPushPromptTone => {
    switch (this.view()) {
      case 'subscribed':
        return 'success';
      case 'denied':
        return 'warning';
      case 'unsupported':
      case 'insecure':
        return 'muted';
      default:
        return 'primary';
    }
  });

  protected readonly icon = computed((): string => {
    switch (this.view()) {
      case 'subscribed':
        return 'notifications_active';
      case 'denied':
        return 'warning';
      case 'unsupported':
        return 'notifications_off';
      case 'insecure':
        return 'lock';
      default:
        return 'notifications_active';
    }
  });

  protected readonly heading = computed((): string => {
    const labels = this.l();
    switch (this.view()) {
      case 'subscribed':
        return labels.subscribedHeading;
      case 'denied':
        return labels.deniedHeading;
      case 'unsupported':
        return labels.unsupportedHeading;
      case 'insecure':
        return labels.insecureHeading;
      default:
        return labels.heading;
    }
  });

  protected readonly description = computed((): string => {
    const labels = this.l();
    switch (this.view()) {
      case 'subscribed':
        return labels.subscribedDescription;
      case 'denied':
        return labels.deniedDescription;
      case 'unsupported':
        return labels.unsupportedDescription;
      case 'insecure':
        return labels.insecureDescription;
      default:
        return labels.description;
    }
  });

  protected readonly helpSteps = computed((): readonly string[] => {
    const labels = this.l();
    switch (this.browserFamily()) {
      case 'chromium':
        return labels.helpStepsChromium;
      case 'firefox':
        return labels.helpStepsFirefox;
      case 'safari':
        return labels.helpStepsSafari;
      default:
        return labels.helpStepsOther;
    }
  });

  protected readonly helpArticleHref = computed(() => this.siteSettingsHref().trim());

  protected readonly showPromptActions = computed(() => this.view() === 'prompt');
  protected readonly showSubscribedActions = computed(() => this.view() === 'subscribed');
  protected readonly showDeniedActions = computed(() => this.view() === 'denied');
  protected readonly showError = computed(
    () => this.view() === 'prompt' && !!this.lastError(),
  );
  protected readonly showBenefitChips = computed(
    () => this.view() === 'prompt' && this.showBenefits() && !this.compact(),
  );
  protected readonly showDismiss = computed(
    () => this.showPromptActions() && this.dismissible() && !this.compact(),
  );
  protected readonly showDeviceMeta = computed(
    () => this.view() === 'subscribed' && !!this.deviceLabel().trim(),
  );
  protected readonly primaryLabel = computed(() =>
    this.showError() ? this.l().tryAgain : this.l().enable,
  );
  protected readonly hiddenByDismiss = computed(() => this.dismissedLocally());

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

  protected onDismiss(): void {
    this.dismissedLocally.set(true);
    this.dismissed.emit();
  }

  protected onHelpArticleClick(): void {
    this.settingsRequest.emit();
  }

  protected onContinueWithInbox(): void {
    this.dismissedLocally.set(true);
    this.continueWithInbox.emit();
  }
}
