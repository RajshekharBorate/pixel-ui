import {
  Directive,
  ElementRef,
  Injector,
  afterNextRender,
  effect,
  inject,
  input,
} from '@angular/core';
import PixelMenuComponent from './pixel-menu';
import PixelMenuItemComponent from './pixel-menu-item';

/** How `[pixelMenuTriggerFor]` opens its menu. */
export type PixelMenuTriggerMode = 'click' | 'contextmenu' | 'both';

/**
 * Attaches a `pixel-menu` to a trigger element (button, surface, or `pixel-menu-item`).
 *
 * On a plain element it opens on click (default), right-click (`contextmenu`), or both.
 * On a `pixel-menu-item` it behaves as a submenu trigger: hover/click/ArrowRight — context
 * mode is ignored for submenus.
 *
 * @example
 * ```html
 * <pixel-button [pixelMenuTriggerFor]="actions">Actions</pixel-button>
 * <div [pixelMenuTriggerFor]="ctx" pixelMenuTrigger="contextmenu">Right-click</div>
 * <pixel-menu #actions>…</pixel-menu>
 * <pixel-menu #ctx>…</pixel-menu>
 * ```
 */
@Directive({
  selector: '[pixelMenuTriggerFor]',
  host: {
    '(click)': 'onClick($event)',
    '(contextmenu)': 'onContextMenu($event)',
    '(keydown)': 'onKeydown($event)',
    '(mouseenter)': 'onMouseEnter()',
  },
})
export default class PixelMenuTriggerDirective {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);
  private readonly parentItem = inject(PixelMenuItemComponent, { optional: true, self: true });

  /**
   * The menu opened by this trigger.
   *
   * @type {PixelMenuComponent}
   * @description Required menu panel reference.
   */
  readonly menu = input.required<PixelMenuComponent>({ alias: 'pixelMenuTriggerFor' });

  /**
   * Interaction that opens the menu.
   *
   * @type {PixelMenuTriggerMode}
   * @default 'click'
   * @description `click` = left-click / Enter / Space. `contextmenu` = right-click and
   *   Shift+F10 / ContextMenu key (opens at the pointer or near the focused element).
   *   `both` enables click and context. Submenu triggers always use click/hover.
   */
  readonly triggerMode = input<PixelMenuTriggerMode>('click', { alias: 'pixelMenuTrigger' });

  private get isSubmenu(): boolean {
    return this.parentItem !== null;
  }

  constructor() {
    queueMicrotask(() => this.parentItem?.isSubmenuTrigger.set(true));
    effect(() => {
      const menu = this.menu();
      menu.opened();
      this.syncAria(menu);
    });
    afterNextRender(() => this.syncAria(this.menu()), { injector: this.injector });
  }

  protected onClick(event: MouseEvent): void {
    if (this.isSubmenu) {
      event.stopPropagation();
      const menu = this.menu();
      if (!menu.opened()) {
        this.openMenu();
      }
      return;
    }
    if (!this.allowsClick()) {
      return;
    }
    event.stopPropagation();
    const menu = this.menu();
    if (menu.opened()) {
      menu.close();
      return;
    }
    this.openMenu();
  }

  protected onContextMenu(event: MouseEvent): void {
    if (this.isSubmenu || !this.allowsContextMenu()) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.openMenuAt(event.clientX, event.clientY);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.isSubmenu) {
      const isOpenKey = event.key === 'Enter' || event.key === ' ';
      const isSubmenuOpenKey = event.key === 'ArrowRight';
      if (!isOpenKey && !isSubmenuOpenKey) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      this.openMenu();
      return;
    }

    const wantsContext =
      this.allowsContextMenu() &&
      (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10'));
    if (wantsContext) {
      event.preventDefault();
      event.stopPropagation();
      const rect = this.interactionTarget().getBoundingClientRect();
      this.openMenuAt(rect.left + rect.width * 0.5, rect.bottom);
      return;
    }

    if (!this.allowsClick()) {
      return;
    }
    if (event.key !== 'Enter' && event.key !== ' ') {
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

  private allowsClick(): boolean {
    const mode = this.triggerMode();
    return mode === 'click' || mode === 'both';
  }

  private allowsContextMenu(): boolean {
    const mode = this.triggerMode();
    return mode === 'contextmenu' || mode === 'both';
  }

  private openMenu(): void {
    const parentMenu = this.isSubmenu ? this.resolveParentMenu() : null;
    this.menu().open(this.interactionTarget(), parentMenu);
  }

  private openMenuAt(clientX: number, clientY: number): void {
    this.menu().open(this.interactionTarget(), null, { point: { x: clientX, y: clientY } });
  }

  private resolveParentMenu(): PixelMenuComponent | null {
    const panel = this.host.nativeElement.closest('.pixel-menu__panel') as
      | (HTMLElement & { __pixelMenu?: PixelMenuComponent })
      | null;
    return panel?.__pixelMenu ?? null;
  }

  private interactionTarget(): HTMLElement {
    const host = this.host.nativeElement;
    if (host.matches('button, a[href], input, select, textarea, [tabindex]')) {
      return host;
    }
    return (
      (host.querySelector('button, a[href], input, select, textarea, [tabindex]') as HTMLElement | null) ??
      host
    );
  }

  private syncAria(menu: PixelMenuComponent): void {
    if (this.isSubmenu) {
      return;
    }
    const host = this.host.nativeElement;
    const target = this.interactionTarget();
    if (target === host && host.tagName.includes('-') && !host.hasAttribute('tabindex')) {
      return;
    }
    if (target !== host) {
      host.removeAttribute('aria-haspopup');
      host.removeAttribute('aria-expanded');
      host.removeAttribute('aria-controls');
    }
    target.setAttribute('aria-haspopup', 'menu');
    target.setAttribute('aria-expanded', menu.opened() ? 'true' : 'false');
    if (menu.opened()) {
      target.setAttribute('aria-controls', menu.panelId);
    } else {
      target.removeAttribute('aria-controls');
    }
  }
}
