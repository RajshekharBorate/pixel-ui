import { Directive, ElementRef, inject, input } from '@angular/core';
import PixelMenuComponent from './pixel-menu';
import PixelMenuItemComponent from './pixel-menu-item';

/**
 * Attaches a `pixel-menu` to a trigger element (button or `pixel-menu-item`).
 *
 * On a plain element it toggles the menu on click. On a `pixel-menu-item` it behaves as a
 * submenu trigger: it opens on hover/click and links to the parent menu for coordinated close.
 *
 * @example
 * ```html
 * <button [pixelMenuTriggerFor]="actions">Actions</button>
 * <pixel-menu #actions>
 *   <pixel-menu-item [pixelMenuTriggerFor]="more">More</pixel-menu-item>
 * </pixel-menu>
 * <pixel-menu #more>…</pixel-menu>
 * ```
 */
@Directive({
  selector: '[pixelMenuTriggerFor]',
  standalone: true,
  host: {
    '[attr.aria-haspopup]': '"menu"',
    '[attr.aria-expanded]': 'menu()?.opened() ? "true" : "false"',
    '(click)': 'onClick($event)',
    '(keydown)': 'onKeydown($event)',
    '(mouseenter)': 'onMouseEnter()',
  },
})
export default class PixelMenuTriggerDirective {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly parentItem = inject(PixelMenuItemComponent, { optional: true, self: true });

  /** The menu opened by this trigger. */
  readonly menu = input.required<PixelMenuComponent>({ alias: 'pixelMenuTriggerFor' });

  private get isSubmenu(): boolean {
    return this.parentItem !== null;
  }

  constructor() {
    // Defer until the input is resolved; mark the owning item as a submenu parent so it renders
    // a chevron and keeps the menu open on activation.
    queueMicrotask(() => this.parentItem?.isSubmenuTrigger.set(true));
  }

  protected onClick(event: MouseEvent): void {
    event.stopPropagation();
    const menu = this.menu();
    if (menu.opened()) {
      if (!this.isSubmenu) {
        menu.close();
      }
      return;
    }
    this.openMenu();
  }

  protected onKeydown(event: KeyboardEvent): void {
    const isOpenKey = event.key === 'Enter' || event.key === ' ';
    const isSubmenuOpenKey = this.isSubmenu && event.key === 'ArrowRight';
    if (!isOpenKey && !isSubmenuOpenKey) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.openMenu();
  }

  protected onMouseEnter(): void {
    if (this.isSubmenu) {
      this.openMenu();
    }
  }

  private openMenu(): void {
    const parentMenu = this.isSubmenu ? this.resolveParentMenu() : null;
    this.menu().open(this.host.nativeElement, parentMenu);
  }

  private resolveParentMenu(): PixelMenuComponent | null {
    const panel = this.host.nativeElement.closest('.pixel-menu__panel') as
      | (HTMLElement & { __pixelMenu?: PixelMenuComponent })
      | null;
    return panel?.__pixelMenu ?? null;
  }
}
