import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  contentChildren,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import PixelMenuItemComponent from './pixel-menu-item';
import { ConnectedOverlay, type OverlayPlacement } from '../shared/overlay/connected-overlay';
import { copyPixelThemeContext } from '../theme/pixel-theme';

export type PixelMenuXPosition = 'before' | 'after';
export type PixelMenuYPosition = 'above' | 'below';

const VIEWPORT_MARGIN = 8;

/**
 * Accessible overlay menu panel. Pair it with `[pixelMenuTriggerFor]` on a trigger element and
 * project `pixel-menu-item` children. Supports nested submenus, full keyboard navigation, and
 * viewport-aware positioning. The panel is relocated to `document.body` while open to avoid
 * clipping by `overflow` ancestors.
 *
 * @example
 * ```html
 * <button [pixelMenuTriggerFor]="actions">Actions</button>
 * <pixel-menu #actions>
 *   <pixel-menu-item icon="visibility" (selected)="view()">View</pixel-menu-item>
 *   <pixel-menu-item icon="delete" (selected)="remove()">Delete</pixel-menu-item>
 * </pixel-menu>
 * ```
 */
@Component({
  selector: 'pixel-menu',
  template: `
    <div
      #panel
      class="pixel-menu__panel"
      [class]="panelClass()"
      role="menu"
      [attr.aria-label]="ariaLabel() || null"
      [class.pixel-menu__panel--open]="opened()"
      (keydown)="onKeydown($event)"
      (pixelMenuItemActivate)="closeAll()"
      (pixelMenuItemHover)="onItemHover($event)"
    >
      <ng-content />
    </div>
  `,
  // Styles ship as a global partial (`styles/_menu.scss`): the panel is relocated to <body> and the
  // projected items can't be reached by component-scoped styles. Import once from app global styles.
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelMenuComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly panelRef = viewChild.required<ElementRef<HTMLElement>>('panel');
  private readonly items = contentChildren(PixelMenuItemComponent, { descendants: false });
  /** Shared connected-overlay controller: body-appended panel, positioning, scroll strategy. */
  private readonly overlay = new ConnectedOverlay();

  /** Horizontal alignment of the panel relative to the trigger. */
  readonly xPosition = input<PixelMenuXPosition>('after');

  /** Vertical alignment of the panel relative to the trigger. */
  readonly yPosition = input<PixelMenuYPosition>('below');

  /** Extra class(es) applied to the panel for one-off styling. */
  readonly panelClass = input('');

  /** Accessible label for the menu region. */
  readonly ariaLabel = input('');

  /** Freezes page scroll while the menu panel is open (Material-style block scroll). */
  readonly lockScroll = input(true, { transform: booleanAttribute });

  /** Emits when the menu finishes closing. */
  readonly closed = output<void>();

  /** Emits when the menu opens. */
  readonly openedChange = output<boolean>();

  readonly opened = signal(false);

  private triggerEl: HTMLElement | null = null;
  private parentMenu: PixelMenuComponent | null = null;
  private openChild: PixelMenuComponent | null = null;

  constructor() {
    // The panel is relocated to the body overlay layer while open. On destroy, the overlay restores
    // the panel to its original DOM slot and releases listeners / scroll lock so nothing lingers.
    this.destroyRef.onDestroy(() => this.overlay.destroy());
  }

  /** Placements tried in priority order: submenus open to the side, root menus per x/y position. */
  private placements(): OverlayPlacement[] {
    if (this.parentMenu) {
      return ['right-start', 'left-start'];
    }
    const start = this.xPosition() === 'after';
    if (this.yPosition() === 'below') {
      return start ? ['bottom-start', 'top-start'] : ['bottom-end', 'top-end'];
    }
    return start ? ['top-start', 'bottom-start'] : ['top-end', 'bottom-end'];
  }

  /** Opens the menu anchored to `trigger`. `parent` links a submenu to its owning menu. */
  open(trigger: HTMLElement, parent: PixelMenuComponent | null = null): void {
    if (this.opened()) {
      return;
    }
    this.triggerEl = trigger;
    this.parentMenu = parent;
    parent?.registerOpenChild(this);

    const panel = this.panelRef().nativeElement;
    // Back-reference so descendant submenu triggers can find their parent menu without DI.
    (panel as HTMLElement & { __pixelMenu?: PixelMenuComponent }).__pixelMenu = this;
    // Carry the active theme context to the body-appended panel.
    const themed = trigger.closest<HTMLElement>('[data-theme]');
    copyPixelThemeContext(panel, themed);
    this.opened.set(true);
    this.openedChange.emit(true);

    // Attach after the `--open` class is applied so the panel has a measurable size to position.
    afterNextRender(
      () => {
        if (!this.opened()) {
          return;
        }
        this.overlay.attach(trigger, panel, {
          preferredPlacements: this.placements(),
          scrollStrategy: this.lockScroll() ? 'block' : 'reposition',
          offset: parent ? 0 : 4,
          viewportMargin: VIEWPORT_MARGIN,
          onOutsidePointer: () => this.close({ restoreFocus: false }),
          // Clicks inside an open descendant submenu must not close this menu.
          isConnected: (node) => this.openChild?.containsNode(node) ?? false,
        });
        this.focusFirstItem();
      },
      { injector: this.injector },
    );
  }

  close(options: { restoreFocus?: boolean } = {}): void {
    if (!this.opened()) {
      return;
    }
    this.openChild?.close();
    this.openChild = null;

    // Detach first (restores the panel to its original DOM slot, releases listeners + scroll lock).
    this.overlay.detach();
    this.opened.set(false);
    this.openedChange.emit(false);
    this.parentMenu?.clearOpenChild(this);

    if (options.restoreFocus !== false) {
      this.triggerEl?.focus();
    }
    this.parentMenu = null;
    this.triggerEl = null;
    this.closed.emit();
  }

  /** Closes this menu and bubbles the close request to the root menu. */
  closeAll(): void {
    if (this.parentMenu) {
      this.parentMenu.closeAll();
    } else {
      this.close();
    }
  }

  /**
   * Dismiss an open submenu when the pointer moves onto a different row in this panel. Submenu
   * triggers manage hand-off between themselves via `registerOpenChild`; this covers the gap where
   * hovering a leaf row (or the trigger's plain siblings) should also collapse the open submenu.
   */
  protected onItemHover(event: Event): void {
    if (!this.openChild) {
      return;
    }
    const row = (event.target as HTMLElement | null)?.closest('.pixel-menu__item');
    // Keep the submenu open while hovering its own trigger row.
    if (row && !this.openChild.isTriggeredBy(row as HTMLElement)) {
      this.openChild.close({ restoreFocus: false });
    }
  }

  /** True when this menu is currently anchored to (opened by) the given element. */
  isTriggeredBy(el: HTMLElement): boolean {
    return this.triggerEl === el;
  }

  registerOpenChild(child: PixelMenuComponent): void {
    if (this.openChild && this.openChild !== child) {
      this.openChild.close({ restoreFocus: false });
    }
    this.openChild = child;
  }

  clearOpenChild(child: PixelMenuComponent): void {
    if (this.openChild === child) {
      this.openChild = null;
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    const itemEls = this.enabledItemElements();
    const currentIndex = itemEls.indexOf(document.activeElement as HTMLElement);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusItemAt(itemEls, currentIndex + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusItemAt(itemEls, currentIndex - 1);
        break;
      case 'Home':
        event.preventDefault();
        this.focusItemAt(itemEls, 0);
        break;
      case 'End':
        event.preventDefault();
        this.focusItemAt(itemEls, itemEls.length - 1);
        break;
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      case 'ArrowLeft':
        if (this.parentMenu) {
          event.preventDefault();
          this.close();
        }
        break;
      case 'Tab':
        this.closeAll();
        break;
    }
  }

  containsNode(node: Node): boolean {
    const panel = this.panelRef().nativeElement;
    if (panel.contains(node)) {
      return true;
    }
    return this.openChild?.containsNode(node) ?? false;
  }

  private enabledItemElements(): HTMLElement[] {
    return this.items()
      .filter((item) => !item.disabled())
      .map((item) => item.elementRef.nativeElement);
  }

  private focusFirstItem(): void {
    this.focusItemAt(this.enabledItemElements(), 0);
  }

  private focusItemAt(items: HTMLElement[], index: number): void {
    if (!items.length) {
      return;
    }
    const wrapped = (index + items.length) % items.length;
    items[wrapped]?.focus();
  }
}
