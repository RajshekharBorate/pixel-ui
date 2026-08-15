import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import {
  PixelButtonComponent,
  PixelPushPromptScheduler,
  providePixelPushPromptScheduler,
} from 'pixel-ui';

/**
 * Recipe B — delayed soft-ask dialog (enterprise pattern).
 * Short delay for the docs demo; production typically uses ~45s + cooldown.
 */
@Component({
  selector: 'docs-notification-push-prompt-delayed-example',
  imports: [PixelButtonComponent],
  providers: [
    providePixelPushPromptScheduler({
      mode: 'delayed',
      delayMs: 3_000,
      cooldownMs: 60_000,
      storageKey: 'pixel-docs-push-prompt-delayed',
      deviceLabel: 'docs-delayed',
      // No dialogTitle — prompt owns the heading; surface defaults to flat (no nested card).
      autoStart: true,
      onEvent: (event) => {
        // Host can wire analytics here.
        console.info('[push-prompt]', event.type, event.reason);
      },
    }),
  ],
  template: `
    <div class="push-prompt-delayed">
      <p class="push-prompt-delayed__hint">
        Soft-ask dialog opens ~3s after this example loads (demo delay; use ~45s in
        production). Skips when already subscribed, denied, in cooldown, or a critical
        <code>alertdialog</code> is open. Native permission still requires Enable.
      </p>
      <div class="push-prompt-delayed__actions">
        <pixel-button appearance="outline" size="sm" (click)="scheduler.show('manual')">
          Show soft-ask now
        </pixel-button>
        <pixel-button appearance="text" size="sm" (click)="scheduler.clearCooldown()">
          Clear cooldown
        </pixel-button>
        <pixel-button appearance="text" size="sm" (click)="scheduler.cancel()">
          Cancel pending timer
        </pixel-button>
      </div>
      <p aria-live="polite" class="push-prompt-delayed__status">
        Eligible: {{ scheduler.isEligible() }}
        @if (scheduler.lastEvent(); as event) {
          · last: {{ event.type }}
          @if (event.reason) {
            ({{ event.reason }})
          }
        }
      </p>
    </div>
  `,
  styles: `
    .push-prompt-delayed {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .push-prompt-delayed__hint,
    .push-prompt-delayed__status {
      margin: 0;
      font-size: 0.8125rem;
      color: var(--pixel-sys-on-surface-variant, #49454f);
    }
    .push-prompt-delayed__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationPushPromptDelayedExample {
  protected readonly scheduler = inject(PixelPushPromptScheduler);
}
