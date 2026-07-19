import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';
import PixelNotificationItemComponent, {
  type PixelNotificationItemActionEvent,
  type PixelNotificationItemActivateEvent,
} from './pixel-notification-item';
import type { PixelNotification } from './pixel-notification.types';

/**
 * Inline banner stack for records routed to the `banner` channel. Place near page chrome and bind
 * `PixelNotificationService.banners()` (or a filtered subset). Mutations stay application-owned.
 */
@Component({
  selector: 'pixel-notification-banner',
  imports: [PixelNotificationItemComponent],
  template: `
    @if (visible().length > 0) {
      <div
        class="pixel-notification-banner__stack"
        role="region"
        [attr.aria-label]="ariaLabel()"
      >
        @for (notification of visible(); track notification.id) {
          <pixel-notification-item
            [notification]="notification"
            density="compact"
            [showOverflow]="showOverflow()"
            [maxInlineActions]="maxInlineActions()"
            (activated)="activated.emit($event)"
            (actionClicked)="actionClicked.emit($event)"
          />
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      inline-size: 100%;
    }

    .pixel-notification-banner__stack {
      display: grid;
      gap: var(--pixel-sys-space-sm, 0.5rem);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-notification-banner',
    '[hidden]': 'visible().length === 0',
  },
})
export default class PixelNotificationBannerComponent {
  /**
   * @type {readonly PixelNotification[]}
   * @default []
   * @description Banner-channel records to render.
   */
  readonly notifications = input<readonly PixelNotification[]>([]);

  /**
   * @type {number}
   * @default 3
   * @description Maximum concurrent banners; older items remain in the inbox.
   */
  readonly maxVisible = input(3);

  /**
   * @type {boolean}
   * @default false
   * @description Always show overflow on banner items.
   */
  readonly showOverflow = input(false, { transform: booleanAttribute });

  /**
   * @type {number}
   * @default 2
   * @description Inline action budget per banner item.
   */
  readonly maxInlineActions = input(2);

  /**
   * @type {string}
   * @default 'Notification banners'
   * @description Accessible name for the banner region.
   */
  readonly ariaLabel = input('Notification banners');

  readonly activated = output<PixelNotificationItemActivateEvent>();
  readonly actionClicked = output<PixelNotificationItemActionEvent>();

  protected readonly visible = computed(() =>
    this.notifications()
      .filter(
        (notification) =>
          notification.archivedAt === null && notification.channels.includes('banner'),
      )
      .slice(0, Math.max(1, this.maxVisible())),
  );
}
