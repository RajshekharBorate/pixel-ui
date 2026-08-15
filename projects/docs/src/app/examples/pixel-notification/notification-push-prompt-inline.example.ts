import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import {
  PixelNotificationPushPromptComponent,
  PixelPushNotificationService,
  PixelPushPromptContentDirective,
} from 'pixel-ui';

/**
 * Recipe A — settings / preferences: always-available inline soft-ask.
 * No auto dialog; native permission only after Enable.
 * Shows default card chrome plus optional `[pixelPushPromptContent]` projection.
 */
@Component({
  selector: 'docs-notification-push-prompt-inline-example',
  imports: [PixelNotificationPushPromptComponent, PixelPushPromptContentDirective],
  template: `
    <div class="push-prompt-inline">
      <p class="push-prompt-inline__hint">
        Inline soft-ask for settings pages. The prompt never opens the browser permission
        dialog on its own — only <strong>Enable</strong> does. Use
        <code>labels</code> or <code>pixelPushPromptContent</code> for custom copy.
      </p>
      <pixel-notification-push-prompt deviceLabel="docs-settings">
        <div pixelPushPromptContent>
          <h3 class="push-prompt-inline__custom-heading">Stay informed on the go</h3>
          <p class="push-prompt-inline__custom-desc">
            Approvals and mentions reach you even when this tab is closed. Mute anytime.
          </p>
        </div>
      </pixel-notification-push-prompt>
      <p aria-live="polite" class="push-prompt-inline__status">
        Status: {{ push.status() }} · permission: {{ push.permission() }}
      </p>
    </div>
  `,
  styles: `
    .push-prompt-inline {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .push-prompt-inline__hint,
    .push-prompt-inline__status {
      margin: 0;
      font-size: 0.8125rem;
      color: var(--pixel-sys-on-surface-variant, #49454f);
    }
    .push-prompt-inline__custom-heading {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      line-height: 1.35;
    }
    .push-prompt-inline__custom-desc {
      margin: 0;
      font-size: 0.875rem;
      color: var(--pixel-sys-on-surface-variant, #49454f);
      line-height: 1.45;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationPushPromptInlineExample {
  protected readonly push = inject(PixelPushNotificationService);
}
