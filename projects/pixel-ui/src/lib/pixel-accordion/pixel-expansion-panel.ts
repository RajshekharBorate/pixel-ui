import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import PixelBadgeComponent, { type PixelBadgeState } from '../pixel-badge/pixel-badge';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';
import {
  PIXEL_UI_ANALYTICS,
  emitPixelUiAnalytics,
} from '../shared/analytics/pixel-ui-analytics';

export type PixelExpansionPanelVariant = 'default' | 'flush' | 'elevated';
export type PixelExpansionPanelSize = 'sm' | 'md' | 'lg';

let nextPanelId = 0;

/**
 * A single collapsible panel. Use standalone or inside `pixel-accordion`. Two-way bind `expanded`.
 * Header shows a `title` (+ optional `description` / `icon` / `badge`); content is projected and
 * animates open/closed via the CSS grid-rows technique.
 *
 * When nested inside a `pixel-accordion`, the accordion's `variant` and `size` are pushed onto each
 * panel and take precedence over the panel's own inputs.
 *
 * @example
 * ```html
 * <pixel-expansion-panel title="Source" description="Where data is read from" [(expanded)]="open">
 *   …content…
 * </pixel-expansion-panel>
 * ```
 */
@Component({
  selector: 'pixel-expansion-panel',
  imports: [PixelBadgeComponent, PixelSkeletonComponent],
  template: `
    @if (showSkeleton()) {
      <div class="pixel-expansion__skeleton" aria-hidden="true">
        @if (icon()) {
          <pixel-skeleton
            class="pixel-expansion__skeleton-icon"
            shape="circle"
            width="var(--pixel-expansion-icon-size, 1.25rem)"
            height="var(--pixel-expansion-icon-size, 1.25rem)"
          />
        }
        <span class="pixel-expansion__skeleton-titles">
          <pixel-skeleton width="55%" [height]="'var(--pixel-expansion-title-size)'"/>
          @if (description()) {
            <pixel-skeleton width="40%" [height]="'var(--pixel-expansion-desc-size)'"/>
          }
        </span>
        <pixel-skeleton
          class="pixel-expansion__skeleton-chevron"
          shape="circle"
          width="var(--pixel-expansion-icon-size, 1.25rem)"
          height="var(--pixel-expansion-icon-size, 1.25rem)"
        />
      </div>
    } @else {
    <h3 class="pixel-expansion__heading">
      <button
        type="button"
        class="pixel-expansion__trigger"
        [id]="headerId"
        [attr.aria-expanded]="expanded()"
        [attr.aria-controls]="regionId"
        [disabled]="disabled()"
        (click)="toggle()"
      >
        @if (icon()) {
          <span class="pixel-expansion__icon material-symbols-outlined" aria-hidden="true">{{
            icon()
          }}</span>
        }
        <span class="pixel-expansion__titles">
          <span class="pixel-expansion__title-row">
            <span class="pixel-expansion__title">{{ title() }}</span>
            @if (hasBadge()) {
              <pixel-badge
                class="pixel-expansion__badge"
                type="count"
                size="sm"
                position="inline"
                [value]="badge()"
                [state]="badgeState()"
              />
            }
          </span>
          @if (description()) {
            <span class="pixel-expansion__description">{{ description() }}</span>
          }
        </span>
        <span class="pixel-expansion__chevron material-symbols-outlined" aria-hidden="true"
          >expand_more</span
        >
      </button>
    </h3>

    <div
      class="pixel-expansion__region"
      role="region"
      [id]="regionId"
      [attr.aria-labelledby]="headerId"
      [attr.inert]="!expanded() ? '' : null"
    >
      <div class="pixel-expansion__region-inner">
        <div class="pixel-expansion__content">
          @if (!lazy() || everOpened()) {
            <ng-content />
          }
        </div>
      </div>
    </div>
    }
  `,
  host: {
    class: 'pixel-expansion',
    '[class.pixel-expansion--expanded]': 'expanded()',
    '[class.pixel-expansion--disabled]': 'disabled()',
    '[class.pixel-expansion--before-expanded]': 'beforeExpandedSibling()',
    '[class.pixel-expansion--after-expanded]': 'afterExpandedSibling()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-size]': 'resolvedSize()',
  },
  styleUrl: './pixel-expansion-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelExpansionPanelComponent {
  private readonly analytics = inject(PIXEL_UI_ANALYTICS, { optional: true });

  /** Two-way expanded state. */
  readonly expanded = model(false);

  /** When true, replaces the panel header with a skeleton placeholder. */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  /** Header title. */
  readonly title = input('');

  /** Secondary header description. */
  readonly description = input('');

  /** Optional leading Material Symbols glyph. */
  readonly icon = input('');

  /** Badge label/count shown next to the title (e.g. `3` or `"New"`). Numeric values overflow at 99+. */
  readonly badge = input<string | number>('');

  /** Semantic color of the title badge. Defaults to `active` (primary), matching the legacy look. */
  readonly badgeState = input<PixelBadgeState>('active');

  /** Disables toggling. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Visual variant for standalone use. When nested inside `pixel-accordion` the accordion's
   * variant is pushed onto the panel and takes precedence.
   */
  readonly variant = input<PixelExpansionPanelVariant>('default');

  /** Size preset controlling trigger padding and font sizes. */
  readonly size = input<PixelExpansionPanelSize>('md');

  /**
   * Defers content rendering until the panel is first opened. Useful for heavy inner components.
   */
  readonly lazy = input(false, { transform: booleanAttribute });

  /**
   * Stable analytics id for this panel (e.g. `billing`). Never use the title.
   *
   * @type {string}
   * @default ''
   * @description When `PIXEL_UI_ANALYTICS` is provided, toggle emits `ui.accordion.expand` /
   * `ui.accordion.collapse`.
   */
  readonly analyticsId = input('');

  /**
   * Extra analytics properties (reserved keys win).
   *
   * @type {Readonly<Record<string, unknown>> | undefined}
   * @default undefined
   */
  readonly analyticsProperties = input<Readonly<Record<string, unknown>> | undefined>(undefined);

  /** Emits the new expanded state on user toggle. */
  readonly expandedChange = output<boolean>();

  // Values pushed down by a parent `pixel-accordion` (null when used standalone).
  readonly inheritedVariant = signal<PixelExpansionPanelVariant | null>(null);
  readonly inheritedSize = signal<PixelExpansionPanelSize | null>(null);

  // Neighbour state pushed by a parent `pixel-accordion`, so the corners facing an expanded
  // (detached) sibling can round. Always false when used standalone.
  readonly beforeExpandedSibling = signal(false);
  readonly afterExpandedSibling = signal(false);

  protected readonly resolvedVariant = computed(
    () => this.inheritedVariant() ?? this.variant(),
  );
  protected readonly resolvedSize = computed(() => this.inheritedSize() ?? this.size());

  protected readonly hasBadge = computed(() => {
    const badge = this.badge();
    return badge !== '' && badge !== null && badge !== undefined;
  });

  protected readonly everOpened = signal(false);

  private readonly uid = ++nextPanelId;
  readonly headerId = `pixel-expansion-header-${this.uid}`;
  readonly regionId = `pixel-expansion-region-${this.uid}`;

  constructor() {
    effect(() => {
      if (this.expanded() && !this.everOpened()) {
        this.everOpened.set(true);
      }
    });
  }

  toggle(): void {
    if (this.disabled()) {
      return;
    }
    const next = !this.expanded();
    this.expanded.set(next);
    this.expandedChange.emit(next);
    const panelId = this.analyticsId().trim();
    emitPixelUiAnalytics(this.analytics, {
      name: next ? 'ui.accordion.expand' : 'ui.accordion.collapse',
      component: 'pixel-expansion-panel',
      extras: this.analyticsProperties(),
      reserved: {
        ...(panelId ? { panelId } : {}),
      },
    });
  }
}
