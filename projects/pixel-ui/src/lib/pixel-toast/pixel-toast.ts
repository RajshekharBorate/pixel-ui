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
import PixelButtonComponent, {
  type PixelButtonAppearance,
  type PixelButtonSize,
} from '../pixel-button/pixel-button';
import { PIXEL_TOAST_TYPE_ICONS } from './pixel-toast.defaults';
import { PixelToastService } from './pixel-toast.service';
import type {
  PixelToastAction,
  PixelToastActionEvent,
  PixelToastAnimation,
  PixelToastConfig,
  PixelToastDismissEvent,
  PixelToastPlacement,
  PixelToastRecord,
  PixelToastRole,
  PixelToastSize,
  PixelToastType,
  PixelToastVariant,
} from './pixel-toast.types';

export type {
  PixelToastAction,
  PixelToastActionEvent,
  PixelToastAnimation,
  PixelToastConfig,
  PixelToastDismissEvent,
  PixelToastGlobalConfig,
  PixelToastPlacement,
  PixelToastPosition,
  PixelToastPromiseMessages,
  PixelToastRecord,
  PixelToastRole,
  PixelToastSize,
  PixelToastType,
  PixelToastVariant,
} from './pixel-toast.types';

export { PixelToastService } from './pixel-toast.service';
export {
  PIXEL_TOAST_DEFAULT_GLOBAL_CONFIG,
  PIXEL_TOAST_DEFAULT_MAX_VISIBLE,
  PIXEL_TOAST_DEFAULT_TIMEOUT,
  PIXEL_TOAST_TYPE_ICONS,
} from './pixel-toast.defaults';

let nextToastHostId = 0;

@Component({
  selector: 'pixel-toast',
  imports: [PixelButtonComponent],
  templateUrl: './pixel-toast.html',
  styleUrl: './pixel-toast.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelToastComponent {
  private readonly toastService = inject(PixelToastService, { optional: true });
  private readonly hostId = `pixel-toast-host-${++nextToastHostId}`;
  private swipeStartX = 0;
  private readonly swipeDeltaX = signal(0);

  /**
   * Managed toast record from `PixelToastService` (container mode).
   */
  readonly record = input<PixelToastRecord | null>(null);

  /** Standalone type when not using the service record. */
  readonly type = input<PixelToastType>('default');

  readonly title = input('');
  readonly message = input('');
  readonly details = input('');
  readonly size = input<PixelToastSize>('sm');
  readonly variant = input<PixelToastVariant>('soft');
  readonly placement = input<PixelToastPlacement>('overlay');
  readonly animation = input<PixelToastAnimation>('slide');
  readonly role = input<PixelToastRole | undefined>(undefined);
  readonly icon = input<string | undefined>(undefined);
  readonly avatarText = input('');
  readonly imageSrc = input('');
  readonly category = input('');
  readonly timestamp = input<string | number | Date | undefined>(undefined);
  readonly progressBar = input(false, { transform: booleanAttribute });
  readonly closeButton = input(true, { transform: booleanAttribute });
  readonly tapToDismiss = input(false, { transform: booleanAttribute });
  readonly expandable = input(false, { transform: booleanAttribute });
  readonly compact = input(false, { transform: booleanAttribute });
  readonly contentMaxHeight = input<string | undefined>(undefined);
  readonly swipeDismiss = input(true, { transform: booleanAttribute });
  readonly className = input('');
  readonly ariaLabel = input('');
  readonly actions = input<readonly PixelToastAction[]>([]);
  readonly undoAction = input<PixelToastAction | undefined>(undefined);
  readonly retryAction = input<PixelToastAction | undefined>(undefined);

  readonly dismissed = output<PixelToastDismissEvent>();
  readonly actionClicked = output<PixelToastActionEvent>();
  readonly expandedChange = output<boolean>();

  protected readonly titleId = computed(() => `${this.hostId}-title`);
  protected readonly messageId = computed(() => `${this.hostId}-message`);

  protected readonly resolvedType = computed(
    () => this.record()?.config.type ?? this.type(),
  );

  protected readonly resolvedTitle = computed(
    () => this.record()?.config.title ?? this.title(),
  );

  protected readonly resolvedMessage = computed(
    () => this.record()?.config.message ?? this.message(),
  );

  /** Title or message alone — used to vertically center body content. */
  protected readonly hasSinglePrimaryText = computed(() => {
    const hasTitle = Boolean(this.resolvedTitle().trim());
    const hasMessage = Boolean(this.resolvedMessage().trim());
    return hasTitle !== hasMessage;
  });

  protected readonly resolvedDetails = computed(
    () => this.record()?.config.details ?? this.details(),
  );

  protected readonly resolvedSize = computed(
    () => this.record()?.config.size ?? this.size(),
  );

  protected readonly resolvedVariant = computed(
    () => this.record()?.config.variant ?? this.variant() ?? 'soft',
  );

  protected readonly resolvedPlacement = computed(
    () => this.record()?.config.placement ?? this.placement(),
  );

  /** Maps toast density to `pixel-button` icon control size. */
  protected readonly controlButtonSize = computed((): PixelButtonSize => this.resolvedSize());

  /** Close control is one step smaller than the toast for a lighter chrome. */
  protected readonly closeButtonSize = computed((): PixelButtonSize => this.resolvedSize());

  /** Action buttons follow toast density. */
  protected readonly actionButtonSize = computed((): PixelButtonSize => this.resolvedSize());

  /** Material Symbols ligature for expand/collapse control. */
  protected readonly expandIcon = computed(() =>
    this.record()?.expanded ? 'expand_less' : 'expand_more',
  );

  protected readonly resolvedAnimation = computed(
    () => this.record()?.config.animation ?? this.animation(),
  );

  protected readonly resolvedRole = computed((): PixelToastRole => {
    const explicit = this.record()?.config.role ?? this.role();
    if (explicit) {
      return explicit;
    }
    const type = this.resolvedType();
    return type === 'error' || type === 'warning' ? 'alert' : 'status';
  });

  protected readonly ariaLive = computed(() =>
    this.resolvedRole() === 'alert' ? 'assertive' : 'polite',
  );

  protected readonly resolvedAriaLabel = computed(() => {
    const explicit = this.record()?.config.ariaLabel ?? this.ariaLabel();
    if (explicit) {
      return explicit;
    }
    const parts = [this.resolvedTitle(), this.resolvedMessage()].filter(Boolean);
    return parts.join('. ') || 'Notification';
  });

  protected readonly resolvedIcon = computed(() => {
    const custom = this.record()?.config.icon ?? this.icon();
    if (custom) {
      return custom;
    }
    return PIXEL_TOAST_TYPE_ICONS[this.resolvedType()];
  });

  protected readonly resolvedAvatarText = computed(
    () => this.record()?.config.avatarText ?? this.avatarText(),
  );

  protected readonly resolvedImageSrc = computed(
    () => this.record()?.config.imageSrc ?? this.imageSrc(),
  );

  protected readonly resolvedCategory = computed(
    () => this.record()?.config.category ?? this.category(),
  );

  protected readonly resolvedTimestamp = computed(
    () => this.record()?.config.timestamp ?? this.timestamp(),
  );

  protected readonly resolvedProgressBar = computed(
    () => this.record()?.config.progressBar ?? this.progressBar(),
  );

  protected readonly resolvedCloseButton = computed(
    () => this.record()?.config.closeButton ?? this.closeButton(),
  );

  protected readonly resolvedTapToDismiss = computed(
    () => this.record()?.config.tapToDismiss ?? this.tapToDismiss(),
  );

  protected readonly resolvedExpandable = computed(
    () => this.record()?.config.expandable ?? this.expandable(),
  );

  protected readonly resolvedCompact = computed(
    () => this.record()?.config.compact ?? this.compact(),
  );

  protected readonly resolvedContentMaxHeight = computed(() => {
    const value = this.record()?.config.contentMaxHeight ?? this.contentMaxHeight();
    return value?.trim() || null;
  });

  protected readonly resolvedSwipeDismiss = computed(
    () => this.record()?.config.swipeDismiss ?? this.swipeDismiss(),
  );

  protected readonly progressPercent = computed(
    () => this.record()?.progressPercent ?? 0,
  );

  protected readonly hostClasses = computed(() => {
    const custom = this.record()?.config.className ?? this.className();
    const classes = ['pixel-toast'];
    if (typeof custom === 'string' && custom) {
      classes.push(custom);
    }
    if (this.record()?.exiting) {
      classes.push('pixel-toast--exiting');
    }
    if (this.record()?.paused) {
      classes.push('pixel-toast--paused');
    }
    return classes.join(' ');
  });

  protected readonly formattedTimestamp = computed(() => {
    const value = this.resolvedTimestamp();
    if (!value) {
      return '';
    }
    const date = value instanceof Date ? value : new Date(value);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  protected readonly actionButtons = computed((): readonly PixelToastAction[] => {
    const cfg = this.record()?.config;
    const list: PixelToastAction[] = [...(cfg?.actions ?? this.actions())];
    if (cfg?.undoAction ?? this.undoAction()) {
      list.unshift(cfg?.undoAction ?? this.undoAction()!);
    }
    if (cfg?.retryAction ?? this.retryAction()) {
      list.push(cfg?.retryAction ?? this.retryAction()!);
    }
    return list;
  });

  protected swipeTransform(): string {
    const offset = this.swipeDeltaX();
    return offset ? `translateX(${offset}px)` : '';
  }

  protected onHover(hovered: boolean): void {
    const id = this.record()?.id;
    if (id && this.toastService) {
      this.toastService.setHovered(id, hovered);
    }
  }

  protected onFocus(focused: boolean): void {
    const id = this.record()?.id;
    if (id && this.toastService) {
      this.toastService.setFocused(id, focused);
    }
  }

  protected onEscape(event: Event): void {
    event.stopPropagation();
    this.dismiss('escape');
  }

  protected onToastClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    this.record()?.config.onTap?.();
    if (this.resolvedTapToDismiss()) {
      this.dismiss('tap');
    }
  }

  protected onDismissClick(event: MouseEvent | KeyboardEvent): void {
    event.stopPropagation();
    this.dismiss('manual');
  }

  protected onToggleExpand(event: MouseEvent | KeyboardEvent): void {
    event.stopPropagation();
    const id = this.record()?.id;
    const next = !(this.record()?.expanded ?? false);
    if (id && this.toastService) {
      this.toastService.setExpanded(id, next);
    }
    this.expandedChange.emit(next);
  }

  protected actionAppearance(action: PixelToastAction): PixelButtonAppearance {
    return action.primary ? 'tonal' : 'text';
  }

  protected onActionClick(event: MouseEvent | KeyboardEvent, actionId: string): void {
    event.stopPropagation();
    const id = this.record()?.id ?? this.hostId;
    this.record()?.config.onAction?.(actionId);
    if (actionId === this.record()?.config.undoAction?.id || actionId === this.undoAction()?.id) {
      this.record()?.config.onUndo?.();
    }
    if (actionId === this.record()?.config.retryAction?.id || actionId === this.retryAction()?.id) {
      this.record()?.config.onRetry?.();
    }
    this.actionClicked.emit({ id, actionId });
    if (actionId !== 'undo') {
      this.dismiss('action');
    }
  }

  protected onPointerDown(event: PointerEvent): void {
    if (!this.resolvedSwipeDismiss()) {
      return;
    }
    this.swipeStartX = event.clientX;
    this.swipeDeltaX.set(0);
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.resolvedSwipeDismiss() || !this.swipeStartX) {
      return;
    }
    this.swipeDeltaX.set(event.clientX - this.swipeStartX);
  }

  protected onPointerUp(): void {
    if (!this.resolvedSwipeDismiss()) {
      return;
    }
    if (Math.abs(this.swipeDeltaX()) > 80) {
      this.dismiss('swipe');
    }
    this.swipeStartX = 0;
    this.swipeDeltaX.set(0);
  }

  private dismiss(reason: PixelToastDismissEvent['reason']): void {
    const id = this.record()?.id;
    if (id && this.toastService) {
      this.toastService.remove(id, reason);
    }
    this.dismissed.emit({ id: id ?? this.hostId, reason });
  }
}
