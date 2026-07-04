import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  linkedSignal,
  numberAttribute,
  output,
} from '@angular/core';
import PixelAvatarComponent, {
  type PixelAvatarClickEvent,
  type PixelAvatarData,
  type PixelAvatarShape,
  type PixelAvatarSize,
  type PixelAvatarVariant,
} from './pixel-avatar';
import PixelTooltipDirective from '../pixel-tooltip/pixel-tooltip';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';

/** Layout mode for a group of avatars. */
export type PixelAvatarGroupLayout = 'stack' | 'grid';

/** Payload emitted when an avatar within the group is activated. */
export interface PixelAvatarGroupClickEvent {
  readonly avatar: PixelAvatarData;
  readonly index: number;
  readonly originalEvent: PixelAvatarClickEvent;
}

/**
 * Renders a collection of avatars as an overlapping stack or a spaced grid, with a `+N` overflow
 * indicator when the set exceeds `max`. Sizing / shape / variant are pushed onto each child avatar
 * for a consistent look. Signal-driven; uses `input()` / `output()` only.
 *
 * @example
 * ```html
 * <pixel-avatar-group [avatars]="team()" [max]="4" layout="stack" />
 * ```
 */
@Component({
  selector: 'pixel-avatar-group',
  imports: [PixelAvatarComponent, PixelTooltipDirective, PixelSkeletonComponent],
  templateUrl: './pixel-avatar-group.html',
  styleUrl: './pixel-avatar-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-avatar-group',
    '[class.pixel-avatar-group--stack]': "layout() === 'stack'",
    '[class.pixel-avatar-group--grid]': "layout() === 'grid'",
    '[class.pixel-avatar-group--reverse]': 'reverse()',
    '[class.pixel-avatar-group--expandable]': 'expandable()',
    '[class.pixel-avatar-group--paginated]': 'paginated()',
    '[attr.data-size]': 'size()',
    role: 'group',
    '[attr.aria-label]': 'ariaLabel() || null',
    '(keydown)': 'onKeydown($event)',
  },
})
export default class PixelAvatarGroupComponent {
  /**
   * @component Avatar descriptors to render, in order.
   * @type {PixelAvatarData[]}
   * @default []
   */
  readonly avatars = input<readonly PixelAvatarData[]>([]);

  /** When true, renders skeleton circle placeholders instead of avatars. */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  /**
   * @component Maximum number of avatars shown before collapsing into a `+N` overflow indicator.
   * @type {number}
   * @default 4
   */
  readonly max = input(4, { transform: numberAttribute });

  /**
   * @component Layout: `stack` overlaps avatars, `grid` lays them out with even spacing.
   * @type {PixelAvatarGroupLayout}
   * @default 'stack'
   */
  readonly layout = input<PixelAvatarGroupLayout>('stack');

  /**
   * @component Reverses the visual stacking order (last avatar on top).
   * @type {boolean}
   * @default false
   */
  readonly reverse = input(false, { transform: booleanAttribute });

  /**
   * @component Spreads the stack apart on hover for easier scanning.
   * @type {boolean}
   * @default false
   */
  readonly expandable = input(false, { transform: booleanAttribute });

  /**
   * @component Pages through the avatars `max` at a time instead of collapsing the rest into a
   * static `+N`. Previous / next controls stack alongside the current window; the `+N` next
   * control shows how many avatars remain. Works in both `stack` and `expandable` modes.
   * @type {boolean}
   * @default false
   */
  readonly paginated = input(false, { transform: booleanAttribute });

  /**
   * @component Size pushed onto every child avatar.
   * @type {PixelAvatarSize}
   * @default 'md'
   */
  readonly size = input<PixelAvatarSize>('md');

  /**
   * @component Shape pushed onto every child avatar.
   * @type {PixelAvatarShape}
   * @default 'circle'
   */
  readonly shape = input<PixelAvatarShape>('circle');

  /**
   * @component Variant pushed onto every child avatar.
   * @type {PixelAvatarVariant}
   * @default 'soft'
   */
  readonly variant = input<PixelAvatarVariant>('soft');

  /**
   * @component Whether presence status dots are shown on grouped avatars.
   * @type {boolean}
   * @default false
   */
  readonly showStatus = input(false, { transform: booleanAttribute });

  /**
   * @component Makes each avatar (and the overflow indicator) interactive.
   * @type {boolean}
   * @default false
   */
  readonly clickable = input(false, { transform: booleanAttribute });

  /**
   * @component Accessible label for the group.
   * @type {string}
   * @default ''
   */
  readonly ariaLabel = input('');

  /** Emitted when a child avatar is activated. */
  readonly avatarClick = output<PixelAvatarGroupClickEvent>();
  /** Emitted when the `+N` overflow indicator is activated (non-paginated mode). */
  readonly groupExpand = output<readonly PixelAvatarData[]>();
  /** Emitted with the new zero-based page index whenever the paginated window changes. */
  readonly pageChange = output<number>();

  protected readonly visibleAvatars = computed(() => this.avatars().slice(0, this.max()));

  protected readonly overflowCount = computed(() =>
    Math.max(0, this.avatars().length - this.max()),
  );

  protected readonly hiddenAvatars = computed(() => this.avatars().slice(this.max()));

  protected readonly overflowTooltip = computed(() =>
    this.hiddenAvatars()
      .map((avatar) => avatar.name || avatar.initials || '')
      .filter(Boolean)
      .join(', '),
  );

  // ---- Pagination ----
  /** Avatars per page. */
  protected readonly pageSize = computed(() => Math.max(1, this.max()));

  /** Total page count (at least 1). */
  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.avatars().length / this.pageSize())),
  );

  /** Current page; resets to the first page whenever the avatar set or `max` changes. */
  protected readonly page = linkedSignal<number>(() => {
    this.avatars();
    this.pageSize();
    return 0;
  });

  protected readonly skeletonAvatarSize = computed(() => {
    switch (this.size()) {
      case 'xs': return '1.5rem';
      case 'sm': return '2rem';
      case 'lg': return '3.5rem';
      default:   return '2.5rem';
    }
  });

  protected readonly skeletonCircleArray = computed(() => {
    const count = this.avatars().length || this.max();
    return Array.from({ length: Math.min(count, this.max()) });
  });

  /** Avatars to render: the current page window when paginated, else the first `max`. */
  protected readonly renderedAvatars = computed(() => {
    if (!this.paginated()) {
      return this.visibleAvatars();
    }
    const size = this.pageSize();
    const start = this.page() * size;
    return this.avatars().slice(start, start + size);
  });

  /** Offset added to a rendered index to recover the avatar's index within the full list. */
  protected readonly indexOffset = computed(() =>
    this.paginated() ? this.page() * this.pageSize() : 0,
  );

  protected readonly hasPrev = computed(() => this.paginated() && this.page() > 0);

  protected readonly hasNext = computed(
    () => this.paginated() && this.page() < this.pageCount() - 1,
  );

  /** How many avatars remain after the current window (the `+N` on the next control). */
  protected readonly nextCount = computed(() =>
    Math.max(0, this.avatars().length - (this.page() + 1) * this.pageSize()),
  );

  /** How many avatars precede the current window (the `+N` on the previous control). */
  protected readonly prevCount = computed(() => this.page() * this.pageSize());

  protected readonly pagePositionLabel = computed(
    () => `Page ${this.page() + 1} of ${this.pageCount()}`,
  );

  /** z-index so earlier avatars sit on top (or last, when reversed). */
  protected zIndexFor(index: number): number {
    const count = this.renderedAvatars().length;
    return this.reverse() ? index + 1 : count - index;
  }

  protected trackAvatar(index: number, avatar: PixelAvatarData): string {
    return avatar.id ?? avatar.name ?? avatar.initials ?? String(index);
  }

  protected onItemClick(avatar: PixelAvatarData, index: number, event: PixelAvatarClickEvent): void {
    this.avatarClick.emit({ avatar, index, originalEvent: event });
  }

  protected onExpand(): void {
    this.groupExpand.emit(this.hiddenAvatars());
  }

  protected goNext(): void {
    if (this.page() < this.pageCount() - 1) {
      this.page.update((current) => current + 1);
      this.pageChange.emit(this.page());
    }
  }

  protected goPrev(): void {
    if (this.page() > 0) {
      this.page.update((current) => current - 1);
      this.pageChange.emit(this.page());
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.paginated()) {
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.goNext();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.goPrev();
    }
  }
}
