import {
  Directive,
  ElementRef,
  booleanAttribute,
  inject,
  input,
} from '@angular/core';
import { PixelAnalyticsService } from '../core/analytics.service';

/**
 * Declarative activation tracking for any host element.
 *
 * ```html
 * <button
 *   pixelAnalyticsTrack="ui.button.click"
 *   [analyticsProperties]="{ action: 'save', feature: 'claims' }"
 * >
 *   Save
 * </button>
 * ```
 *
 * Prefer Pixel UI's optional `analyticsAction` / `PIXEL_UI_ANALYTICS` bridge for
 * `pixel-button` (it stops click propagation on the inner control).
 */
@Directive({
  selector: '[pixelAnalyticsTrack]',
  host: {
    '(click)': 'onActivate($event)',
    '(keydown.enter)': 'onActivate($event)',
    '(keydown.space)': 'onActivate($event)',
  },
})
export class PixelAnalyticsTrackDirective {
  private readonly analytics = inject(PixelAnalyticsService, { optional: true });
  private readonly host = inject(ElementRef<HTMLElement>);

  /**
   * Canonical event name (`domain.object.action`).
   * @type {string}
   */
  readonly pixelAnalyticsTrack = input.required<string>();

  /**
   * Optional event properties (primitives only).
   * @type {Record<string, unknown>}
   * @default {}
   */
  readonly analyticsProperties = input<Record<string, unknown>>({});

  /**
   * Optional component name recorded on the event context.
   * @type {string}
   * @default ''
   */
  readonly analyticsComponent = input('');

  /**
   * When true, Space keydown is prevented to avoid page scroll (for non-button hosts).
   * @type {boolean}
   * @default false
   */
  readonly analyticsPreventSpaceScroll = input(false, { transform: booleanAttribute });

  protected onActivate(event: Event): void {
    if (!this.analytics) {
      return;
    }
    const el = this.host.nativeElement;
    if (this.isDisabled(el)) {
      return;
    }

    // Native buttons / links fire click after Enter/Space — ignore keyboard to avoid doubles.
    if (event instanceof KeyboardEvent && this.isNativelyActivatable(el)) {
      return;
    }

    if (event instanceof KeyboardEvent && event.key === ' ') {
      if (this.analyticsPreventSpaceScroll()) {
        event.preventDefault();
      }
    }

    try {
      const componentName = this.analyticsComponent().trim();
      this.analytics.track({
        name: this.pixelAnalyticsTrack(),
        properties: this.analyticsProperties(),
        context: componentName
          ? { component: { name: componentName } }
          : undefined,
      });
    } catch {
      // never break the host
    }
  }

  private isDisabled(el: HTMLElement): boolean {
    if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') {
      return true;
    }
    if (el instanceof HTMLButtonElement || el instanceof HTMLInputElement) {
      return el.disabled;
    }
    return false;
  }

  private isNativelyActivatable(el: HTMLElement): boolean {
    const tag = el.tagName;
    return tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY' || tag === 'INPUT';
  }
}
