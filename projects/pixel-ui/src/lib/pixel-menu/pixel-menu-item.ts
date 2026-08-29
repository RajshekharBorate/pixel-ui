import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Params, RouterLink } from '@angular/router';
import {
  PIXEL_UI_ANALYTICS,
  emitPixelUiAnalytics,
} from '../shared/analytics/pixel-ui-analytics';

/** Router link target — a string path or a commands array passed straight to `routerLink`. */
export type PixelMenuItemLink = string | readonly unknown[];

/** Leading icon colour — `primary` uses the brand token; `default` is neutral on-surface. */
export type PixelMenuItemIconColor = 'default' | 'primary';

/**
 * A single actionable row inside a `pixel-menu`. Renders an optional leading icon, projected
 * label, and (when it owns a submenu) a trailing chevron.
 *
 * Use `(selected)` for an action, or set `link` / `href` to make the row a real navigational link
 * (so middle-click / Ctrl-click open in a new tab and the URL is exposed for right-click). When a
 * link is set the row renders a full-bleed `<a>`; `(selected)` still fires on activation.
 *
 * @example
 * ```html
 * <pixel-menu-item icon="edit" (selected)="edit()">Edit</pixel-menu-item>
 * <pixel-menu-item icon="folder" link="/projects/42">Open project</pixel-menu-item>
 * <pixel-menu-item href="https://example.com">External</pixel-menu-item>
 * ```
 */
@Component({
  selector: 'pixel-menu-item',
  imports: [NgTemplateOutlet, RouterLink],
  template: `
    @if (link() != null) {
      <a
        #anchor
        class="pixel-menu__item-anchor"
        [routerLink]="link()!"
        [queryParams]="queryParams() ?? null"
        [fragment]="fragment() ?? undefined"
        tabindex="-1"
      >
        <ng-container [ngTemplateOutlet]="body" />
      </a>
    } @else if (href()) {
      <a #anchor class="pixel-menu__item-anchor" [href]="href()" tabindex="-1">
        <ng-container [ngTemplateOutlet]="body" />
      </a>
    } @else {
      <ng-container [ngTemplateOutlet]="body" />
    }

    <ng-template #body>
      @if (icon()) {
        <span class="pixel-menu__item-icon material-symbols-outlined" aria-hidden="true">{{
          icon()
        }}</span>
      }
      <span class="pixel-menu__item-label"><ng-content /></span>
      @if (isSubmenuTrigger()) {
        <span class="pixel-menu__item-chevron material-symbols-outlined" aria-hidden="true"
          >chevron_right</span
        >
      }
    </ng-template>
  `,
  host: {
    role: 'menuitem',
    class: 'pixel-menu__item',
    '[attr.tabindex]': '-1',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-haspopup]': 'isSubmenuTrigger() ? "menu" : null',
    '[class.pixel-menu__item--disabled]': 'disabled()',
    '[class.pixel-menu__item--danger]': "variant() === 'danger'",
    '[class.pixel-menu__item--icon-primary]': 'iconColor() === "primary"',
    '[class.pixel-menu__item--has-submenu]': 'isSubmenuTrigger()',
    '[class.pixel-menu__item--link]': 'isLink()',
    '(click)': 'activate($event)',
    '(keydown)': 'onKeydown($event)',
    '(mouseenter)': 'onMouseEnter()',
  },
  // Styles ship as a global partial (`styles/_menu.scss`) shared with `pixel-menu`; see that file.
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelMenuItemComponent {
  readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly analytics = inject(PIXEL_UI_ANALYTICS, { optional: true });
  private readonly anchorRef = viewChild<ElementRef<HTMLAnchorElement>>('anchor');

  /** Optional leading Material Symbols glyph name. */
  readonly icon = input('');

  /**
   * Leading icon colour. `primary` tints the glyph with `--pixel-sys-primary`; the label stays
   * neutral. Ignored when `variant="danger"` (icon follows the destructive colour).
   */
  readonly iconColor = input<PixelMenuItemIconColor>('default');

  /** Disables the item. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Visual emphasis; `danger` tints destructive actions. */
  readonly variant = input<'default' | 'danger'>('default');

  /** Angular router target. Renders the row as a `routerLink` anchor. */
  readonly link = input<PixelMenuItemLink | undefined>(undefined);

  /** External / absolute URL. Renders the row as a plain `href` anchor. */
  readonly href = input<string | undefined>(undefined);

  /** Query params forwarded to `routerLink`. */
  readonly queryParams = input<Params | undefined>(undefined);

  /** Router URL fragment forwarded to `routerLink`. */
  readonly fragment = input<string | undefined>(undefined);

  /**
   * Semantic action id for analytics (e.g. `export`). Prefer this over labels.
   *
   * @type {string}
   * @default ''
   * @description When `PIXEL_UI_ANALYTICS` is provided, activation emits `ui.menu.select`.
   */
  readonly analyticsAction = input('');

  /**
   * Stable item id for analytics when `analyticsAction` is not used.
   *
   * @type {string}
   * @default ''
   */
  readonly analyticsId = input('');

  /**
   * Extra analytics properties (reserved keys win).
   *
   * @type {Readonly<Record<string, unknown>> | undefined}
   * @default undefined
   */
  readonly analyticsProperties = input<Readonly<Record<string, unknown>> | undefined>(undefined);

  /** Emits when the item is activated by click or keyboard. */
  readonly selected = output<MouseEvent | KeyboardEvent>();

  /** Set by the trigger directive when this item opens a submenu. */
  readonly isSubmenuTrigger = signal(false);

  /** True when the row is a navigational link (router or external). */
  readonly isLink = computed(() => this.link() != null || !!this.href());

  protected activate(event: MouseEvent): void {
    if (this.disabled()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    this.selected.emit(event);
    this.emitSelectAnalytics();
    // Submenu parents keep the menu open; leaf items request a full close via a bubbling event
    // caught by the owning panel (projected content can't reach the menu through DI).
    if (!this.isSubmenuTrigger()) {
      this.elementRef.nativeElement.dispatchEvent(
        new CustomEvent('pixelMenuItemActivate', { bubbles: true }),
      );
    }
  }

  private emitSelectAnalytics(): void {
    if (this.isSubmenuTrigger()) {
      return;
    }
    const action = this.analyticsAction().trim();
    const itemId = this.analyticsId().trim();
    emitPixelUiAnalytics(this.analytics, {
      name: 'ui.menu.select',
      component: 'pixel-menu-item',
      extras: this.analyticsProperties(),
      reserved: {
        ...(action ? { action } : {}),
        ...(itemId ? { itemId } : {}),
        variant: this.variant(),
      },
    });
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    if (this.disabled()) {
      return;
    }
    event.preventDefault();
    // For link rows, click the inner anchor so routerLink / href navigation fires natively; the
    // click bubbles to the host and still emits `selected` + closes the menu.
    const anchor = this.anchorRef()?.nativeElement;
    (anchor ?? this.elementRef.nativeElement).click();
  }

  protected onMouseEnter(): void {
    this.focusSelf();
    // Notify the owning panel that a row is hovered so it can dismiss an open sibling submenu.
    // Projected items can't reach the menu through DI, so we bubble an event the panel listens for
    // (mirrors the `pixelMenuItemActivate` pattern). The panel ignores it for the submenu's own row.
    this.elementRef.nativeElement.dispatchEvent(
      new CustomEvent('pixelMenuItemHover', { bubbles: true }),
    );
  }

  focusSelf(): void {
    if (!this.disabled()) {
      this.elementRef.nativeElement.focus();
    }
  }
}
