import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import PixelBadgeComponent, { type PixelBadgePosition } from '../pixel-badge/pixel-badge';
import PixelTooltipDirective, { type PixelTooltipPosition } from '../pixel-tooltip/pixel-tooltip';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';

/** Visual fill treatment for initials / icon / placeholder avatars. */
export type PixelAvatarVariant = 'solid' | 'outline' | 'soft';

/** Density scale. */
export type PixelAvatarSize = 'xs' | 'sm' | 'md' | 'lg';

/** Corner shape. */
export type PixelAvatarShape = 'circle' | 'rounded';

/** Presence / status indicator. */
export type PixelAvatarStatus =
  | 'none'
  | 'online'
  | 'offline'
  | 'away'
  | 'busy'
  | 'dnd'
  | 'invisible'
  | 'custom';

/** Resolved content mode rendered inside the frame. */
export type PixelAvatarDisplayMode = 'image' | 'initials' | 'icon' | 'placeholder' | 'skeleton';

/** Corner for the overlaid notification badge. */
export type PixelAvatarBadgePosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

/** Strongly-typed avatar descriptor used by `pixel-avatar-group`. */
export interface PixelAvatarData {
  id?: string;
  name?: string;
  imageUrl?: string;
  initials?: string;
  icon?: string;
  status?: PixelAvatarStatus;
  statusColor?: string;
  color?: string;
  tooltip?: string;
  badgeCount?: number | null;
}

/** Payload emitted when an interactive avatar is activated. */
export interface PixelAvatarClickEvent {
  readonly id: string;
  readonly name: string;
  readonly source: 'mouse' | 'keyboard';
  readonly originalEvent: MouseEvent | KeyboardEvent;
}

const STATUS_LABELS: Record<PixelAvatarStatus, string> = {
  none: '',
  online: 'Online',
  offline: 'Offline',
  away: 'Away',
  busy: 'Busy',
  dnd: 'Do not disturb',
  invisible: 'Invisible',
  custom: 'Status',
};

let nextAvatarId = 0;

/** Stable hash of a string for deterministic accent colors. */
function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index++) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Derive initials from a full name: first + last word, else leading characters of one word. */
function deriveInitials(name: string, maxInitials: number): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) {
    return '';
  }
  if (words.length === 1) {
    return words[0].slice(0, maxInitials).toUpperCase();
  }
  const first = words[0][0] ?? '';
  const last = words[words.length - 1][0] ?? '';
  return `${first}${last}`.slice(0, maxInitials).toUpperCase();
}

/**
 * Enterprise-grade, accessible, themeable avatar. Resolves content through a fallback chain
 * (image → initials → icon → placeholder), supports presence status, a notification badge
 * (via `pixel-badge`), deterministic initials colors, loading skeletons, and click/keyboard
 * interaction. State is signal-driven and the public surface uses `input()` / `output()` only.
 *
 * @example
 * ```html
 * <pixel-avatar name="Raj Borate" status="online" [badgeCount]="6" />
 * <pixel-avatar imageUrl="/u/ada.png" name="Ada Lovelace" [clickable]="true" />
 * <pixel-avatar icon="support_agent" variant="soft" />
 * ```
 */
@Component({
  selector: 'pixel-avatar',
  standalone: true,
  imports: [NgTemplateOutlet, PixelBadgeComponent, PixelTooltipDirective, PixelSkeletonComponent],
  templateUrl: './pixel-avatar.html',
  styleUrl: './pixel-avatar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-avatar',
    '[class.pixel-avatar--clickable]': 'clickable() && !isDisabled()',
    '[class.pixel-avatar--disabled]': 'isDisabled()',
    '[class.pixel-avatar--grouped]': 'grouped()',
    '[class.pixel-avatar--overlap]': 'overlap()',
    '[class.pixel-avatar--loading]': 'loading()',
    '[attr.data-size]': 'size()',
    '[attr.data-shape]': 'shape()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-display]': 'displayMode()',
    '[style.--pixel-avatar-accent]': 'accentColor()',
  },
})
export default class PixelAvatarComponent {
  protected readonly fallbackId = `pixel-avatar-${++nextAvatarId}`;

  protected readonly imageLoaded = signal(false);
  protected readonly imageFailed = signal(false);
  protected readonly hovered = signal(false);
  protected readonly focused = signal(false);

  /**
   * @component Stable id for accessibility wiring and test selectors. Auto-generated when empty.
   * @type {string}
   * @default ''
   */
  readonly id = input('');

  /**
   * @component Full display name. Used for the accessible label and to derive initials / color.
   * @type {string}
   * @default ''
   */
  readonly name = input('');

  /**
   * @component Profile image URL. Highest-priority content; falls back on load error.
   * @type {string}
   * @default ''
   */
  readonly imageUrl = input('');

  /**
   * @component Explicit initials. When empty, initials are derived from `name`.
   * @type {string}
   * @default ''
   */
  readonly initials = input('');

  /**
   * @component Material Symbols glyph used when there is no image or initials.
   * @type {string}
   * @default ''
   */
  readonly icon = input('');

  /**
   * @component Glyph used as the final placeholder fallback.
   * @type {string}
   * @default 'person'
   */
  readonly fallbackIcon = input('person');

  /**
   * @component Presence status indicator.
   * @type {PixelAvatarStatus}
   * @default 'none'
   */
  readonly status = input<PixelAvatarStatus>('none');

  /**
   * @component Custom color for `status="custom"` (any CSS color).
   * @type {string}
   * @default ''
   */
  readonly statusColor = input('');

  /**
   * @component Notification count rendered as an overlaid badge.
   * @type {number | null}
   * @default null
   */
  readonly badgeCount = input<number | null>(null);

  /**
   * @component Overflow threshold for the badge (`100` → `99+`).
   * @type {number}
   * @default 99
   */
  readonly badgeMax = input(99, { transform: numberAttribute });

  /**
   * @component Density size scale.
   * @type {PixelAvatarSize}
   * @default 'md'
   */
  readonly size = input<PixelAvatarSize>('md');

  /**
   * @component Corner shape.
   * @type {PixelAvatarShape}
   * @default 'circle'
   */
  readonly shape = input<PixelAvatarShape>('circle');

  /**
   * @component Visual fill treatment for initials / icon / placeholder.
   * @type {PixelAvatarVariant}
   * @default 'soft'
   */
  readonly variant = input<PixelAvatarVariant>('soft');

  /**
   * @component Renders the avatar as an interactive button.
   * @type {boolean}
   * @default false
   */
  readonly clickable = input(false, { transform: booleanAttribute });

  /**
   * @component When true, replaces the entire avatar with a circle skeleton. Use while user data
   * is loading. Distinct from `loading`, which shows a shimmer inside the avatar frame.
   * @type {boolean}
   * @default false
   */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  /**
   * @component Disables interaction and dims the avatar.
   * @type {boolean}
   * @default false
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * @component Shows a loading skeleton instead of content.
   * @type {boolean}
   * @default false
   */
  readonly loading = input(false, { transform: booleanAttribute });

  /**
   * @component Whether the presence status dot is rendered (when `status` is not `none`).
   * @type {boolean}
   * @default true
   */
  readonly showStatus = input(true, { transform: booleanAttribute });

  /**
   * @component Whether the notification badge is rendered (when `badgeCount` is set).
   * @type {boolean}
   * @default true
   */
  readonly showBadge = input(true, { transform: booleanAttribute });

  /**
   * @component Corner for the notification badge.
   * @type {PixelAvatarBadgePosition}
   * @default 'top-right'
   */
  readonly badgePosition = input<PixelAvatarBadgePosition>('top-right');

  /**
   * @component Corner for the presence status dot.
   * @type {PixelAvatarBadgePosition}
   * @default 'bottom-right'
   */
  readonly statusPosition = input<PixelAvatarBadgePosition>('bottom-right');

  /**
   * @component Adds `loading="lazy"` + async decoding to the image.
   * @type {boolean}
   * @default true
   */
  readonly lazyLoad = input(true, { transform: booleanAttribute });

  /**
   * @component Maximum number of characters in derived initials.
   * @type {number}
   * @default 2
   */
  readonly maxInitials = input(2, { transform: numberAttribute });

  /**
   * @component Custom accent color override (any CSS color). Overrides the deterministic color.
   * @type {string}
   * @default ''
   */
  readonly color = input('');

  /**
   * @component Tooltip text shown on hover/focus via the shared `pixel-tooltip` directive.
   * @type {string}
   * @default ''
   */
  readonly tooltip = input('');

  /**
   * @component Preferred tooltip placement (flips automatically near viewport edges).
   * @type {PixelTooltipPosition}
   * @default 'top'
   */
  readonly tooltipPosition = input<PixelTooltipPosition>('top');

  /**
   * @component Marks the avatar as part of a group (adds a separating ring).
   * @type {boolean}
   * @default false
   */
  readonly grouped = input(false, { transform: booleanAttribute });

  /**
   * @component Enables overlap spacing inside a group/stack.
   * @type {boolean}
   * @default false
   */
  readonly overlap = input(false, { transform: booleanAttribute });

  /**
   * @component Accessible label override. Falls back to name / initials + status.
   * @type {string}
   * @default ''
   */
  readonly ariaLabel = input('');

  /**
   * @component Tab order for clickable avatars.
   * @type {number}
   * @default 0
   */
  readonly tabIndex = input(0, { transform: numberAttribute });

  /**
   * @component Extra static classes for custom styling.
   * @type {string}
   * @default ''
   */
  readonly className = input('');

  /** Emitted when an interactive avatar is activated (mouse / keyboard). */
  readonly avatarClick = output<PixelAvatarClickEvent>();
  /** Emitted when the avatar receives focus. */
  readonly avatarFocus = output<FocusEvent>();
  /** Emitted when the avatar loses focus. */
  readonly avatarBlur = output<FocusEvent>();
  /** Emitted when the presence status dot is clicked. */
  readonly statusClick = output<MouseEvent>();
  /** Emitted when the notification badge is clicked. */
  readonly badgeClick = output<MouseEvent | KeyboardEvent>();
  /** Emitted when the image finishes loading. */
  readonly imageLoad = output<Event>();
  /** Emitted when the image fails to load (before falling back). */
  readonly imageError = output<Event>();

  protected readonly resolvedId = computed(() => this.id().trim() || this.fallbackId);

  protected readonly isDisabled = computed(() => this.disabled());

  protected readonly skeletonAvatarSize = computed(() => {
    switch (this.size()) {
      case 'xs': return '1.5rem';
      case 'sm': return '2rem';
      case 'lg': return '3.5rem';
      default:   return '2.5rem';
    }
  });

  protected readonly resolvedInitials = computed(() => {
    const explicit = this.initials().trim();
    if (explicit) {
      return explicit.slice(0, this.maxInitials()).toUpperCase();
    }
    return deriveInitials(this.name(), this.maxInitials());
  });

  /** Content rendered inside the frame, resolved through the fallback chain. */
  protected readonly displayMode = computed<PixelAvatarDisplayMode>(() => {
    if (this.loading()) {
      return 'skeleton';
    }
    if (this.imageUrl().trim() && !this.imageFailed()) {
      return 'image';
    }
    if (this.resolvedInitials()) {
      return 'initials';
    }
    if (this.icon().trim()) {
      return 'icon';
    }
    return 'placeholder';
  });

  /** Deterministic accent color from the name/initials, or the explicit `color`. */
  protected readonly accentColor = computed<string | null>(() => {
    const explicit = this.color().trim();
    if (explicit) {
      return explicit;
    }
    const seed = this.name().trim() || this.initials().trim();
    if (!seed) {
      return null;
    }
    return `hsl(${hashString(seed) % 360} 58% 52%)`;
  });

  protected readonly hasStatus = computed(
    () => this.showStatus() && this.status() !== 'none',
  );

  protected readonly statusColorOverride = computed<string | null>(() =>
    this.status() === 'custom' ? this.statusColor().trim() || null : null,
  );

  protected readonly hasBadge = computed(() => {
    const count = this.badgeCount();
    return this.showBadge() && count !== null && count !== undefined;
  });

  /** Badge corner mapped to the `pixel-badge` position type (kept inline; avatar places it). */
  protected readonly badgeCorner = computed<PixelBadgePosition>(() => this.badgePosition());

  protected readonly statusLabel = computed(() => {
    if (this.status() === 'custom') {
      return this.ariaLabel() ? '' : 'Status';
    }
    return STATUS_LABELS[this.status()];
  });

  /** Accessible label combining name and presence. */
  protected readonly resolvedAriaLabel = computed(() => {
    const explicit = this.ariaLabel().trim();
    const base = explicit || this.name().trim() || this.resolvedInitials() || 'User avatar';
    if (!explicit && this.hasStatus() && this.statusLabel()) {
      return `${base}, ${this.statusLabel().toLowerCase()}`;
    }
    return base;
  });

  protected readonly customClasses = computed(() => this.className().trim());

  protected onClick(event: MouseEvent): void {
    if (!this.clickable() || this.isDisabled()) {
      return;
    }
    this.avatarClick.emit({
      id: this.resolvedId(),
      name: this.name(),
      source: 'mouse',
      originalEvent: event,
    });
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.clickable() || this.isDisabled()) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.avatarClick.emit({
        id: this.resolvedId(),
        name: this.name(),
        source: 'keyboard',
        originalEvent: event,
      });
    }
  }

  protected onFocus(event: FocusEvent): void {
    this.focused.set(true);
    this.avatarFocus.emit(event);
  }

  protected onBlur(event: FocusEvent): void {
    this.focused.set(false);
    this.avatarBlur.emit(event);
  }

  protected onStatusClick(event: MouseEvent): void {
    event.stopPropagation();
    this.statusClick.emit(event);
  }

  protected onBadgeClick(event: MouseEvent | KeyboardEvent): void {
    this.badgeClick.emit(event);
  }

  protected onImageLoad(event: Event): void {
    this.imageLoaded.set(true);
    this.imageFailed.set(false);
    this.imageLoad.emit(event);
  }

  protected onImageErrorEvent(event: Event): void {
    this.imageFailed.set(true);
    this.imageLoaded.set(false);
    this.imageError.emit(event);
  }
}
