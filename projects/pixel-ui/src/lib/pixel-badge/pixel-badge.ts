import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  effect,
  input,
  linkedSignal,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';

/** Badge content / use-case taxonomy. */
export type PixelBadgeType =
  | 'count'
  | 'dot'
  | 'status'
  | 'label'
  | 'icon'
  | 'avatar'
  | 'pulse'
  | 'notification'
  | 'custom';

/** Visual treatment of the badge surface. */
export type PixelBadgeVariant = 'solid' | 'outline' | 'filled';

/** Density scale. */
export type PixelBadgeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Corner shape of the badge surface. */
export type PixelBadgeShape = 'circle' | 'pill';

/** Placement of the badge relative to its anchored (projected) content. */
export type PixelBadgePosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'inline'
  | 'center-right'
  | 'center-left';

/** Semantic / interaction state. */
export type PixelBadgeState =
  | 'default'
  | 'active'
  | 'disabled'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'loading';

/** Named animation presets. */
export type PixelBadgeAnimation =
  | 'none'
  | 'pulse'
  | 'bounce'
  | 'blink'
  | 'scale'
  | 'fade'
  | 'ripple';

/** Accepted value for count / label badges. */
export type PixelBadgeValue = number | string | null;

/** ARIA live politeness setting. */
export type PixelBadgeAriaLive = 'off' | 'polite' | 'assertive';

/** Payload emitted when a clickable badge is activated. */
export interface PixelBadgeClickEvent {
  readonly value: PixelBadgeValue;
  readonly type: PixelBadgeType;
  readonly source: 'mouse' | 'keyboard';
  readonly originalEvent: MouseEvent | KeyboardEvent;
}

/** Payload emitted when a removable badge is dismissed. */
export interface PixelBadgeRemoveEvent {
  readonly value: PixelBadgeValue;
  readonly source: 'mouse' | 'keyboard';
  readonly originalEvent: MouseEvent | KeyboardEvent;
}

let nextBadgeId = 0;

/**
 * Enterprise-grade, accessible, animated, themeable badge / notification indicator.
 *
 * Anchors an overlay indicator to projected content (icon, avatar, button) or renders a
 * standalone inline badge (status / label pill). Supports notification counts with overflow,
 * dot indicators, status markers, icon and avatar badges, and animated live updates. State is
 * driven entirely by signals and the public API uses `input()` / `output()` only — no two-way
 * binding.
 *
 * @example
 * ```html
 * <!-- Count badge attached to an icon -->
 * <pixel-badge [value]="10" type="count" position="top-right">
 *   <span class="material-symbols-outlined">notifications</span>
 * </pixel-badge>
 *
 * <!-- Overflow + max -->
 * <pixel-badge [value]="1000" [max]="999" type="notification" />
 *
 * <!-- Standalone status pill -->
 * <pixel-badge type="status" state="success" label="Online" position="inline" />
 * ```
 */
@Component({
  selector: 'pixel-badge',
  standalone: true,
  imports: [NgTemplateOutlet, PixelSkeletonComponent],
  templateUrl: './pixel-badge.html',
  styleUrl: './pixel-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-badge',
    '[class.pixel-badge--overlay]': 'isOverlay()',
    '[class.pixel-badge--standalone]': '!isOverlay()',
    '[class.pixel-badge--hidden]': '!isVisible()',
    '[class.pixel-badge--has-avatar]': 'hasAvatar()',
    '[attr.data-position]': 'position()',
    '[attr.data-size]': 'size()',
    '[attr.data-type]': 'type()',
    '[attr.data-state]': 'resolvedState()',
  },
})
export default class PixelBadgeComponent {
  protected readonly fallbackId = `pixel-badge-${++nextBadgeId}`;

  /** Transient hover state used for analytics / styling hooks. */
  protected readonly hovered = signal(false);

  /** True for one animation cycle after the displayed value changes (drives the pop transition). */
  protected readonly justUpdated = signal(false);

  /**
   * @component Stable id for accessibility wiring and test selectors. Falls back to an
   * auto-generated id when empty.
   * @type {string}
   * @default ''
   */
  readonly id = input('');

  /**
   * @component Badge value. Numbers drive count / notification overflow logic; strings are shown
   * verbatim. `null` renders an empty count.
   * @type {number | string | null}
   * @default null
   */
  readonly value = input<PixelBadgeValue>(null);

  /**
   * @component Badge content type / use-case.
   * @type {PixelBadgeType}
   * @default 'count'
   */
  readonly type = input<PixelBadgeType>('count');

  /**
   * @component Visual treatment variant.
   * @type {PixelBadgeVariant}
   * @default 'solid'
   */
  readonly variant = input<PixelBadgeVariant>('solid');

  /**
   * @component Density size scale.
   * @type {PixelBadgeSize}
   * @default 'md'
   */
  readonly size = input<PixelBadgeSize>('md');

  /**
   * @component Corner shape of the badge surface.
   * @type {PixelBadgeShape}
   * @default 'pill'
   */
  readonly shape = input<PixelBadgeShape>('pill');

  /**
   * @component Placement relative to anchored content. `inline` renders a standalone badge in
   * normal flow (no overlay).
   * @type {PixelBadgePosition}
   * @default 'top-right'
   */
  readonly position = input<PixelBadgePosition>('top-right');

  /**
   * @component Semantic / interaction state. `loading` shows a spinner, `disabled` blocks
   * interaction.
   * @type {PixelBadgeState}
   * @default 'default'
   */
  readonly state = input<PixelBadgeState>('default');

  /**
   * @component Maximum count before overflow text (e.g. `100` becomes `99+` when `max` is `99`).
   * @type {number}
   * @default 99
   */
  readonly max = input(99, { transform: numberAttribute });

  /**
   * @component Whether to keep the badge visible when the count is `0`.
   * @type {boolean}
   * @default false
   */
  readonly showZero = input(false, { transform: booleanAttribute });

  /**
   * @component Hard-hides the badge indicator regardless of value.
   * @type {boolean}
   * @default false
   */
  readonly hidden = input(false, { transform: booleanAttribute });

  /**
   * @component Disables interaction and dims the badge.
   * @type {boolean}
   * @default false
   */
  /**
   * @component When true, replaces the badge with a skeleton placeholder matching its size and shape.
   */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * @component Enables a brief "pop" transition whenever the displayed value changes.
   * @type {boolean}
   * @default false
   */
  readonly animated = input(false, { transform: booleanAttribute });

  /**
   * @component Enables a continuous pulse ring (great for live / unread indicators).
   * @type {boolean}
   * @default false
   */
  readonly pulse = input(false, { transform: booleanAttribute });

  /**
   * @component Named entrance / attention animation preset.
   * @type {PixelBadgeAnimation}
   * @default 'none'
   */
  readonly animation = input<PixelBadgeAnimation>('none');

  /**
   * @component Makes the badge an interactive button that emits `badgeClick`.
   * @type {boolean}
   * @default false
   */
  readonly clickable = input(false, { transform: booleanAttribute });

  /**
   * @component Renders a remove affordance that emits `badgeRemove`.
   * @type {boolean}
   * @default false
   */
  readonly removable = input(false, { transform: booleanAttribute });

  /**
   * @component Material Symbols glyph rendered inside the badge (for `icon` / decorated badges).
   * @type {string}
   * @default ''
   */
  readonly icon = input('');

  /**
   * @component Avatar image URL used as the anchor for `avatar` badges.
   * @type {string}
   * @default ''
   */
  readonly avatarUrl = input('');

  /**
   * @component Text label shown for `label` / `status` badges.
   * @type {string}
   * @default ''
   */
  readonly label = input('');

  /**
   * @component Custom color override. Applied to the badge background (solid/filled) or border
   * (outline). Any valid CSS color.
   * @type {string}
   * @default ''
   */
  readonly color = input('');

  /**
   * @component Accessible label override. When empty, a sensible label is derived from the value /
   * type.
   * @type {string}
   * @default ''
   */
  readonly ariaLabel = input('');

  /**
   * @component ARIA live politeness for announcing value changes to screen readers.
   * @type {'off' | 'polite' | 'assertive'}
   * @default 'polite'
   */
  readonly ariaLive = input<PixelBadgeAriaLive>('polite');

  /**
   * @component Tab order for clickable badges.
   * @type {number}
   * @default 0
   */
  readonly tabIndex = input(0, { transform: numberAttribute });

  /**
   * @component Extra static classes appended to the badge content element.
   * @type {string}
   * @default ''
   */
  readonly className = input('');

  /** Emitted when an interactive badge is activated by mouse or keyboard. */
  readonly badgeClick = output<PixelBadgeClickEvent>();
  /** Emitted when a removable badge is dismissed. */
  readonly badgeRemove = output<PixelBadgeRemoveEvent>();
  /** Emitted when the pointer enters the badge. */
  readonly badgeHover = output<MouseEvent>();
  /** Emitted when the badge value changes via the public mutation API. */
  readonly valueChange = output<PixelBadgeValue>();
  /** Emitted when an entrance / update animation finishes. */
  readonly animationComplete = output<void>();

  /** Internal, mutable mirror of `value` so programmatic updates (increment/setValue) work. */
  private readonly valueModel = linkedSignal<PixelBadgeValue>(() => this.value());

  protected readonly resolvedId = computed(() => this.id().trim() || this.fallbackId);

  protected readonly isDisabled = computed(
    () => this.disabled() || this.state() === 'disabled',
  );

  protected readonly resolvedState = computed<PixelBadgeState>(() =>
    this.isDisabled() ? 'disabled' : this.state(),
  );

  protected readonly hasAvatar = computed(() => this.avatarUrl().trim().length > 0);

  protected readonly skeletonSize = computed(() => {
    switch (this.size()) {
      case 'xs': return '0.875rem';
      case 'sm': return '1rem';
      case 'lg': return '1.5rem';
      case 'xl': return '1.875rem';
      default:   return '1.25rem';
    }
  });

  protected readonly skeletonIsCircle = computed(() => {
    const t = this.type();
    return t === 'dot' || t === 'pulse' || t === 'status';
  });

  protected readonly skeletonWidth = computed(() =>
    this.skeletonIsCircle() ? this.skeletonSize() : '3rem',
  );

  protected readonly isOverlay = computed(() => this.position() !== 'inline');

  /** Parsed numeric value, or `null` when the value is non-numeric / empty. */
  protected readonly numericValue = computed<number | null>(() => {
    const raw = this.valueModel();
    if (typeof raw === 'number') {
      return Number.isFinite(raw) ? raw : null;
    }
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed === '' || Number.isNaN(Number(trimmed))) {
        return null;
      }
      return Number(trimmed);
    }
    return null;
  });

  protected readonly isCountType = computed(
    () => this.type() === 'count' || this.type() === 'notification',
  );

  /** Display string for count badges, applying overflow (`max+`) logic. */
  protected readonly displayValue = computed<string>(() => {
    const numeric = this.numericValue();
    if (numeric === null) {
      const raw = this.valueModel();
      return raw === null ? '' : String(raw);
    }
    const max = this.max();
    if (numeric > max) {
      return `${max}+`;
    }
    return String(numeric);
  });

  /** Whether the indicator should render at all. */
  protected readonly isVisible = computed(() => {
    if (this.hidden()) {
      return false;
    }
    if (this.isCountType()) {
      const numeric = this.numericValue();
      if (numeric === null) {
        return this.valueModel() !== null && String(this.valueModel()).length > 0;
      }
      if (numeric === 0) {
        return this.showZero();
      }
      return true;
    }
    return true;
  });

  /** Renders a real `<button>` only when safe (clickable, enabled, not removable to avoid nested buttons). */
  protected readonly useButtonHost = computed(
    () => this.clickable() && !this.isDisabled() && !this.removable(),
  );

  protected readonly contentRole = computed<string | null>(() => {
    if (this.useButtonHost()) {
      return null;
    }
    if (this.clickable() && !this.isDisabled()) {
      return 'button';
    }
    return 'status';
  });

  protected readonly liveValue = computed<PixelBadgeAriaLive>(() => {
    if (!this.isVisible()) {
      return 'off';
    }
    return this.ariaLive();
  });

  /** Derived accessible label when no explicit `ariaLabel` is provided. */
  protected readonly ariaLabelText = computed(() => {
    const explicit = this.ariaLabel().trim();
    if (explicit) {
      return explicit;
    }
    switch (this.type()) {
      case 'dot':
      case 'pulse':
        return 'New activity';
      case 'status':
        return this.label().trim() || `Status: ${this.resolvedState()}`;
      case 'label':
        return this.label().trim();
      case 'icon':
        return this.icon().trim() || 'Badge';
      case 'avatar':
        return this.label().trim() || 'Avatar status';
      default: {
        const numeric = this.numericValue();
        if (numeric === null) {
          return this.displayValue();
        }
        const overflow = numeric > this.max();
        return overflow
          ? `More than ${this.max()} notifications`
          : `${numeric} ${numeric === 1 ? 'notification' : 'notifications'}`;
      }
    }
  });

  protected readonly avatarAlt = computed(() => this.label().trim() || 'Avatar');

  /** Inline custom color override mapped to the relevant CSS custom property. */
  protected readonly colorOverride = computed<string | null>(() => this.color().trim() || null);

  /** Full class list for the badge content element (no `ngClass`). */
  protected readonly contentClass = computed(() => {
    const classes = [
      'pixel-badge__content',
      `pixel-badge__content--${this.type()}`,
      `pixel-badge__content--${this.variant()}`,
      `pixel-badge__content--${this.size()}`,
      `pixel-badge__content--${this.shape()}`,
      `pixel-badge__content--state-${this.resolvedState()}`,
    ];
    if (this.clickable() && !this.isDisabled()) {
      classes.push('pixel-badge__content--clickable');
    }
    if (this.isDisabled()) {
      classes.push('pixel-badge__content--disabled');
    }
    if (this.pulse()) {
      classes.push('pixel-badge__content--pulse');
    }
    if (this.animation() !== 'none') {
      classes.push(`pixel-badge__content--anim-${this.animation()}`);
    }
    if (this.justUpdated()) {
      classes.push('pixel-badge__content--pop');
    }
    const custom = this.className().trim();
    if (custom) {
      classes.push(custom);
    }
    return classes.join(' ');
  });

  constructor() {
    let first = true;
    effect(() => {
      // Track the rendered value so the pop animation re-triggers on change.
      this.displayValue();
      if (first) {
        first = false;
        return;
      }
      if (this.animated() && this.isVisible()) {
        this.justUpdated.set(true);
      }
    });
  }

  /** Replace the current value and notify listeners. */
  setValue(next: PixelBadgeValue): void {
    this.valueModel.set(next);
    this.valueChange.emit(next);
  }

  /** Increase a numeric value by `step` (defaults to 1). */
  increment(step = 1): void {
    const current = this.numericValue() ?? 0;
    this.setValue(current + step);
  }

  /** Decrease a numeric value by `step` (defaults to 1), clamped to `0`. */
  decrement(step = 1): void {
    const current = this.numericValue() ?? 0;
    this.setValue(Math.max(0, current - step));
  }

  /** Reset the value back to the bound `value` input. */
  reset(): void {
    this.valueModel.set(this.value());
    this.valueChange.emit(this.value());
  }

  protected onClick(event: MouseEvent): void {
    if (!this.clickable() || this.isDisabled()) {
      return;
    }
    this.badgeClick.emit({
      value: this.valueModel(),
      type: this.type(),
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
      this.badgeClick.emit({
        value: this.valueModel(),
        type: this.type(),
        source: 'keyboard',
        originalEvent: event,
      });
    }
  }

  protected onRemove(event: MouseEvent): void {
    event.stopPropagation();
    if (this.isDisabled()) {
      return;
    }
    this.badgeRemove.emit({
      value: this.valueModel(),
      source: 'mouse',
      originalEvent: event,
    });
  }

  protected onHover(event: MouseEvent): void {
    this.hovered.set(true);
    this.badgeHover.emit(event);
  }

  protected onAnimationEnd(): void {
    if (this.justUpdated()) {
      this.justUpdated.set(false);
    }
    this.animationComplete.emit();
  }
}
