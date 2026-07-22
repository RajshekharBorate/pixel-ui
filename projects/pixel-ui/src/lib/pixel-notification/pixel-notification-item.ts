import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  booleanAttribute,
  computed,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import PixelAvatarComponent from '../pixel-avatar/pixel-avatar';
import PixelButtonComponent, {
  type PixelButtonAppearance,
  type PixelButtonState,
} from '../pixel-button/pixel-button';
import PixelChipComponent, { type PixelChipSemantic } from '../pixel-chip/pixel-chip';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';
import PixelProgressBarComponent from '../pixel-progress/pixel-progress-bar';
import type {
  PixelProgressMode,
  PixelProgressStatus,
} from '../pixel-progress/pixel-progress.types';
import {
  formatAbsoluteTimestamp,
  formatRelativeTime,
} from '../shared/datetime/pixel-relative-time';
import { isActionRequiredNotification } from './pixel-notification.adapters';
import type {
  PixelNotification,
  PixelNotificationAction,
  PixelNotificationSeverity,
} from './pixel-notification.types';

export type PixelNotificationItemDensity = 'compact' | 'default';
export type PixelNotificationItemInteractionSource = 'mouse' | 'keyboard';
export type PixelNotificationTimestampMode = 'relative' | 'absolute';

/** Refresh relative labels while an item remains mounted (panel open / list visible). */
const RELATIVE_TIME_TICK_MS = 30_000;

export interface PixelNotificationItemActivateEvent {
  readonly notification: PixelNotification;
  readonly source: PixelNotificationItemInteractionSource;
  readonly originalEvent: MouseEvent | KeyboardEvent;
}

export interface PixelNotificationItemActionEvent extends PixelNotificationItemActivateEvent {
  readonly action: PixelNotificationAction;
}

export interface PixelNotificationItemOverflowEvent
  extends PixelNotificationItemActivateEvent {
  readonly hiddenActions: readonly PixelNotificationAction[];
}

const SEVERITY_ICONS: Readonly<Record<PixelNotificationSeverity, string>> = {
  neutral: 'notifications',
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
};

let nextNotificationItemId = 0;

/**
 * Accessible, controlled presentation for one durable notification record. The item emits intent
 * events but never mutates notification state directly.
 */
@Component({
  selector: 'pixel-notification-item',
  imports: [
    PixelAvatarComponent,
    PixelButtonComponent,
    PixelChipComponent,
    PixelProgressBarComponent,
    PixelSkeletonComponent,
  ],
  templateUrl: './pixel-notification-item.html',
  styleUrl: './pixel-notification-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    '[attr.id]': 'id() || fallbackId',
    '[attr.data-density]': 'density()',
    '[attr.data-severity]': 'notification().severity',
    '[attr.data-state]': 'notification().state',
    '[attr.data-read]': 'isRead()',
    '[attr.data-archived]': 'isArchived()',
    '[attr.aria-busy]': "notification().state === 'loading' || showSkeleton() ? 'true' : null",
  },
})
export default class PixelNotificationItemComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly nowTick = signal(Date.now());
  protected readonly fallbackId = `pixel-notification-item-${++nextNotificationItemId}`;

  /**
   * @type {PixelNotification}
   * @description Canonical notification record to render.
   */
  readonly notification = input.required<PixelNotification>();

  /**
   * @type {string}
   * @default ''
   * @description Optional host id; a unique id is generated when omitted.
   */
  readonly id = input('');

  /**
   * @type {'compact' | 'default'}
   * @default 'default'
   * @description `compact` reduces vertical spacing for dense panels and full-page lists.
   */
  readonly density = input<PixelNotificationItemDensity>('default');

  /**
   * @type {boolean}
   * @default false
   * @description Disables activation and action controls while preserving readable content.
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * @type {boolean}
   * @default true
   * @description Shows the unread accent bar and includes unread in the screen-reader status text.
   */
  readonly showUnreadIndicator = input(true, { transform: booleanAttribute });

  /**
   * @type {boolean}
   * @default true
   * @description Renders action controls supplied by the notification record.
   */
  readonly showActions = input(true, { transform: booleanAttribute });

  /**
   * @type {boolean}
   * @default false
   * @description Always shows the overflow control, even when no actions overflow.
   */
  readonly showOverflow = input(false, { transform: booleanAttribute });

  /**
   * @type {boolean}
   * @default false
   * @description Shows a dismiss (close) control for archive/remove intents. Takes precedence over overflow.
   */
  readonly showDismiss = input(false, { transform: booleanAttribute });

  /**
   * @type {number}
   * @default 2
   * @description Maximum inline actions before remaining actions move behind the overflow intent.
   */
  readonly maxInlineActions = input(2, { transform: numberAttribute });

  /**
   * @type {string}
   * @default ''
   * @description Optional explicit timestamp text; when set, skips relative/absolute formatting.
   */
  readonly timestampLabel = input('');

  /**
   * @type {'relative' | 'absolute'}
   * @default 'relative'
   * @description `relative` uses Intl phrases (now / 5 minutes ago); `absolute` uses locale date-time.
   * Absolute time always remains available on the `<time title>`.
   */
  readonly timestampMode = input<PixelNotificationTimestampMode>('relative');

  /**
   * @type {string}
   * @default ''
   * @description Alternative text for `notification.imageSrc`; empty keeps decorative imagery silent.
   */
  readonly imageAlt = input('');

  /**
   * @type {string}
   * @default ''
   * @description Initials rendered as an avatar when no image is present.
   */
  readonly avatarText = input('');

  /**
   * @type {string}
   * @default ''
   * @description Overrides the generated accessible name for the main item control.
   */
  readonly ariaLabel = input('');

  /**
   * @type {string}
   * @default 'More notification actions'
   * @description Accessible label for the overflow action control.
   */
  readonly overflowAriaLabel = input('More notification actions');

  /**
   * @type {string}
   * @default 'Archive notification'
   * @description Accessible label for the dismiss (close) control.
   */
  readonly dismissAriaLabel = input('Archive notification');

  /**
   * @type {boolean}
   * @default false
   * @description Replaces the item with a footprint-matched loading skeleton.
   */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  /**
   * @type {string}
   * @default ''
   * @description Additional host utility or theme-hook classes.
   */
  readonly className = input('');

  /** Emits when the main item control is activated. */
  readonly activated = output<PixelNotificationItemActivateEvent>();

  /** Emits an inline action intent without mutating notification state. */
  readonly actionClicked = output<PixelNotificationItemActionEvent>();

  /** Emits the overflow intent and actions not rendered inline. */
  readonly overflowClicked = output<PixelNotificationItemOverflowEvent>();

  /** Emits when the dismiss (close) control is activated. */
  readonly dismissClicked = output<PixelNotificationItemActivateEvent>();

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }
    const timerId = window.setInterval(() => {
      if (this.timestampMode() === 'relative' && !this.timestampLabel().trim()) {
        this.nowTick.set(Date.now());
      }
    }, RELATIVE_TIME_TICK_MS);
    this.destroyRef.onDestroy(() => window.clearInterval(timerId));
  }

  protected readonly titleId = computed(() => `${this.id() || this.fallbackId}-title`);
  protected readonly messageId = computed(() => `${this.id() || this.fallbackId}-message`);
  protected readonly statusId = computed(() => `${this.id() || this.fallbackId}-status`);
  protected readonly isRead = computed(() => this.notification().readAt !== null);
  protected readonly isArchived = computed(() => this.notification().archivedAt !== null);
  protected readonly resolvedIcon = computed(
    () => this.notification().icon || SEVERITY_ICONS[this.notification().severity],
  );
  protected readonly statusChip = computed((): { label: string; semantic: PixelChipSemantic } | null => {
    const notification = this.notification();
    if (notification.state === 'failed') {
      return { label: 'Failed', semantic: 'error' };
    }
    if (notification.state === 'completed') {
      return { label: 'Completed', semantic: 'success' };
    }
    if (notification.state === 'loading') {
      return { label: 'Scheduled', semantic: 'info' };
    }
    if (notification.archivedAt !== null) {
      return { label: 'Archived', semantic: 'default' };
    }
    if (isActionRequiredNotification(notification)) {
      return { label: 'Action Required', semantic: 'warning' };
    }
    return null;
  });
  protected readonly visibleActions = computed(() => {
    if (!this.showActions()) {
      return [];
    }
    return this.notification().actions.slice(0, Math.max(0, this.maxInlineActions()));
  });
  protected readonly hiddenActions = computed(() =>
    this.showActions()
      ? this.notification().actions.slice(Math.max(0, this.maxInlineActions()))
      : [],
  );
  protected readonly hasOverflow = computed(
    () => this.showOverflow() || this.hiddenActions().length > 0,
  );
  protected readonly progressMode = computed(
    (): PixelProgressMode =>
      this.notification().progress === null ? 'indeterminate' : 'determinate',
  );
  protected readonly progressValue = computed(() => this.notification().progress ?? 0);
  protected readonly progressStatus = computed((): PixelProgressStatus => {
    switch (this.notification().state) {
      case 'failed':
        return 'error';
      case 'completed':
        return 'completed';
      case 'loading':
        return 'loading';
      default:
        return 'default';
    }
  });
  protected readonly absoluteTimestamp = computed(() =>
    formatAbsoluteTimestamp(this.notification().createdAt),
  );
  protected readonly formattedTimestamp = computed(() => {
    const explicit = this.timestampLabel().trim();
    if (explicit) {
      return explicit;
    }
    const createdAt = this.notification().createdAt;
    if (this.timestampMode() === 'absolute') {
      return formatAbsoluteTimestamp(createdAt);
    }
    return formatRelativeTime(createdAt, {
      now: this.nowTick(),
      style: this.density() === 'compact' ? 'compact' : 'long',
    });
  });
  protected readonly isoTimestamp = computed(() =>
    new Date(this.notification().createdAt).toISOString(),
  );
  protected readonly accessibleName = computed(
    () =>
      this.ariaLabel().trim() ||
      [this.notification().title, this.notification().message].filter(Boolean).join('. '),
  );
  protected readonly statusText = computed(() => {
    const notification = this.notification();
    if (notification.archivedAt !== null) {
      return 'Archived';
    }
    if (notification.state === 'loading') {
      return notification.progress === null
        ? 'In progress'
        : `In progress, ${Math.round(notification.progress)} percent`;
    }
    if (notification.state === 'failed') {
      return 'Failed';
    }
    if (notification.state === 'completed') {
      return 'Completed';
    }
    return notification.readAt === null ? 'Unread' : 'Read';
  });
  protected readonly hostClasses = computed(() =>
    ['pixel-notification-item-host', this.className().trim()].filter(Boolean).join(' '),
  );

  protected actionAppearance(action: PixelNotificationAction): PixelButtonAppearance {
    if (action.appearance === 'primary') {
      return 'solid';
    }
    return 'outline';
  }

  protected actionState(action: PixelNotificationAction): PixelButtonState {
    return action.appearance === 'danger' ? 'error' : 'default';
  }

  protected onActivate(event: MouseEvent | KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }
    this.activated.emit(this.eventPayload(event));
  }

  protected onAction(
    event: MouseEvent | KeyboardEvent,
    action: PixelNotificationAction,
  ): void {
    event.stopPropagation();
    if (this.disabled()) {
      event.preventDefault();
      return;
    }
    this.actionClicked.emit({ ...this.eventPayload(event), action });
  }

  protected onOverflow(event: MouseEvent | KeyboardEvent): void {
    event.stopPropagation();
    if (this.disabled()) {
      return;
    }
    this.overflowClicked.emit({
      ...this.eventPayload(event),
      hiddenActions: this.hiddenActions(),
    });
  }

  protected onDismiss(event: MouseEvent | KeyboardEvent): void {
    event.stopPropagation();
    if (this.disabled()) {
      return;
    }
    this.dismissClicked.emit(this.eventPayload(event));
  }

  private eventPayload(
    event: MouseEvent | KeyboardEvent,
  ): PixelNotificationItemActivateEvent {
    return {
      notification: this.notification(),
      source:
        event instanceof KeyboardEvent || (event instanceof MouseEvent && event.detail === 0)
          ? 'keyboard'
          : 'mouse',
      originalEvent: event,
    };
  }
}
