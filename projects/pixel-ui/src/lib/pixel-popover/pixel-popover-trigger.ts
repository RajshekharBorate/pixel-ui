import {
  Directive,
  ElementRef,
  Injector,
  afterNextRender,
  effect,
  inject,
  input,
} from '@angular/core';
import PixelPopoverComponent from './pixel-popover';

/**
 * Attaches a `pixel-popover` to its trigger element. Click (or Enter/Space) toggles the
 * popover, and the trigger carries the disclosure ARIA contract
 * (`aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`).
 *
 * @example
 * ```html
 * <pixel-button [pixelPopoverTriggerFor]="filters">Filters</pixel-button>
 * <pixel-popover #filters ariaLabel="Filters">…</pixel-popover>
 * ```
 */
@Directive({
  selector: '[pixelPopoverTriggerFor]',
  host: {
    '(click)': 'onClick($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export default class PixelPopoverTriggerDirective {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /** The popover opened by this trigger. */
  readonly popover = input.required<PixelPopoverComponent>({ alias: 'pixelPopoverTriggerFor' });

  constructor() {
    effect(() => {
      const popover = this.popover();
      popover.opened();
      this.syncAria(popover);
    });
    afterNextRender(() => this.syncAria(this.popover()), { injector: this.injector });
  }

  protected onClick(event: MouseEvent): void {
    event.stopPropagation();
    this.popover().toggle(this.interactionTarget());
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    // preventDefault also suppresses the synthetic click on native buttons, so the popover
    // toggles exactly once per activation.
    event.preventDefault();
    event.stopPropagation();
    this.popover().toggle(this.interactionTarget());
  }

  private interactionTarget(): HTMLElement {
    const host = this.host.nativeElement;
    if (host.matches('button, a[href], input, select, textarea, [tabindex]')) {
      return host;
    }
    return (
      host.querySelector<HTMLElement>('button, a[href], input, select, textarea, [tabindex]') ??
      host
    );
  }

  private syncAria(popover: PixelPopoverComponent): void {
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
    target.setAttribute('aria-haspopup', 'dialog');
    target.setAttribute('aria-expanded', popover.opened() ? 'true' : 'false');
    if (popover.opened()) {
      target.setAttribute('aria-controls', popover.panelId);
    } else {
      target.removeAttribute('aria-controls');
    }
  }
}
