import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  PixelButtonComponent,
  PixelPushPromptScheduler,
  providePixelPushPromptScheduler,
} from 'pixel-ui';

/**
 * Recipe C — value-moment soft-ask (best enterprise accept rates).
 * Open only after a meaningful product action, not on page load.
 */
@Component({
  selector: 'docs-notification-push-prompt-value-moment-example',
  imports: [PixelButtonComponent],
  providers: [
    providePixelPushPromptScheduler({
      mode: 'event',
      storageKey: 'pixel-docs-push-prompt-value-moment',
      cooldownMs: 60_000,
      deviceLabel: 'docs-value-moment',
      labels: {
        heading: 'Get notified when this finishes',
        description:
          'We’ll ping you when the job completes — mute anytime in preferences.',
      },
      autoStart: false,
    }),
  ],
  template: `
    <div class="push-prompt-value">
      <p class="push-prompt-value__hint">
        Simulate a completed job / watchable event, then open the soft-ask dialog. This is
        the preferred enterprise timing — context first, permission second.
      </p>
      <div class="push-prompt-value__actions">
        <pixel-button appearance="solid" size="sm" (click)="completeJob()">
          Complete job
        </pixel-button>
        <pixel-button appearance="text" size="sm" (click)="scheduler.clearCooldown()">
          Clear cooldown
        </pixel-button>
      </div>
      <p aria-live="polite" class="push-prompt-value__status">
        @if (jobDone()) {
          Job finished.
        }
        @if (scheduler.lastEvent(); as event) {
          Soft-ask: {{ event.type }}
          @if (event.reason) {
            ({{ event.reason }})
          }
        }
      </p>
    </div>
  `,
  styles: `
    .push-prompt-value {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .push-prompt-value__hint,
    .push-prompt-value__status {
      margin: 0;
      font-size: 0.8125rem;
      color: var(--pixel-sys-on-surface-variant, #49454f);
    }
    .push-prompt-value__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationPushPromptValueMomentExample {
  protected readonly scheduler = inject(PixelPushPromptScheduler);
  protected readonly jobDone = signal(false);

  protected completeJob(): void {
    this.jobDone.set(true);
    this.scheduler.showAfterValueMoment();
  }
}
