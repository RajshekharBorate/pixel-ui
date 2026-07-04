import { Directive, ElementRef, inject, input } from '@angular/core';
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
    '[attr.aria-haspopup]': '"dialog"',
    '[attr.aria-expanded]': "popover().opened() ? 'true' : 'false'",
    '[attr.aria-controls]': 'popover().opened() ? popover().panelId : null',
    '(click)': 'onClick($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export default class PixelPopoverTriggerDirective {
  private readonly host = inject(ElementRef<HTMLElement>);

  /** The popover opened by this trigger. */
  readonly popover = input.required<PixelPopoverComponent>({ alias: 'pixelPopoverTriggerFor' });

  protected onClick(event: MouseEvent): void {
    event.stopPropagation();
    this.popover().toggle(this.host.nativeElement);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    // preventDefault also suppresses the synthetic click on native buttons, so the popover
    // toggles exactly once per activation.
    event.preventDefault();
    event.stopPropagation();
    this.popover().toggle(this.host.nativeElement);
  }
}
