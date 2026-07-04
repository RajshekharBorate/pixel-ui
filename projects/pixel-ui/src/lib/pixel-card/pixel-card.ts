import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';

export type PixelCardAppearance = 'elevated' | 'outlined' | 'filled';
export type PixelCardPadding = 'none' | 'sm' | 'md' | 'lg';
export type PixelCardInteractionSource = 'mouse' | 'keyboard';

export interface PixelCardActivateEvent {
  source: PixelCardInteractionSource;
  originalEvent: MouseEvent | KeyboardEvent;
}

let nextCardId = 0;

/**
 * Content surface grouping related information and actions. Supports M3 appearances
 * (`elevated`/`outlined`/`filled`), a built-in header (`cardTitle`/`cardSubtitle` or the
 * `[pixelCardHeader]` slot), an edge-to-edge `[pixelCardMedia]` slot, a `[pixelCardActions]`
 * footer, an interactive (clickable) mode with full keyboard support, and a skeleton state.
 *
 * @example
 * ```html
 * <pixel-card cardTitle="Report" cardSubtitle="Updated today">
 *   <img pixelCardMedia src="cover.png" alt="" />
 *   Body content…
 *   <pixel-button pixelCardActions appearance="text">Open</pixel-button>
 * </pixel-card>
 * ```
 */
@Component({
  selector: 'pixel-card',
  imports: [PixelSkeletonComponent],
  templateUrl: './pixel-card.html',
  styleUrl: './pixel-card.scss',
  host: {
    class: 'pixel-card',
    '[class.pixel-card--interactive]': 'isInteractive()',
    '[class.pixel-card--disabled]': 'disabled()',
    '[class.pixel-card--selected]': 'selected()',
    '[class.pixel-card--pressed]': 'keyboardActive()',
    '[class.pixel-card--skeleton]': 'showSkeleton()',
    '[attr.data-appearance]': 'appearance()',
    '[attr.data-padding]': 'padding()',
    '[attr.id]': 'id() || fallbackId',
    '[attr.role]': "isInteractive() ? 'button' : null",
    '[attr.tabindex]': 'isInteractive() && !disabled() ? 0 : null',
    '[attr.aria-label]': 'ariaLabel() || null',
    '[attr.aria-disabled]': "isInteractive() ? (disabled() ? 'true' : 'false') : null",
    '[attr.aria-pressed]':
      "isInteractive() && selectable() ? (selected() ? 'true' : 'false') : null",
    '(click)': 'onHostClick($event)',
    '(pointerdown)': 'onHostPointerDown()',
    '(keydown)': 'onHostKeyDown($event)',
    '(keyup)': 'onHostKeyUp($event)',
    '(blur)': 'keyboardActive.set(false)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelCardComponent {
  protected readonly fallbackId = `pixel-card-${++nextCardId}`;
  protected readonly keyboardActive = signal(false);
  private readonly lastInteractionSource = signal<PixelCardInteractionSource>('mouse');

  /**
   * Optional element id applied to the host.
   *
   * @type {string}
   * @default ''
   * @description Supplies a stable id for `aria-labelledby` references and e2e selectors.
   */
  readonly id = input('');

  /**
   * Visual appearance style (aligned with Angular Material M3 cards).
   *
   * @type {'elevated' | 'outlined' | 'filled'}
   * @default 'elevated'
   * @description `elevated` = shadow on surface, `outlined` = hairline border, `filled` =
   * tonal surface-container background with no border or shadow.
   */
  readonly appearance = input<PixelCardAppearance>('elevated');

  /**
   * Inner padding density for the body, header, and actions regions.
   *
   * @type {'none' | 'sm' | 'md' | 'lg'}
   * @default 'md'
   * @description `none` removes all built-in padding (media stays edge-to-edge regardless).
   */
  readonly padding = input<PixelCardPadding>('md');

  /**
   * Optional title rendered in the built-in header.
   *
   * @type {string}
   * @default ''
   * @description Skipped when empty; project `[pixelCardHeader]` content for custom headers.
   */
  readonly cardTitle = input('');

  /**
   * Optional subtitle rendered under the title.
   *
   * @type {string}
   * @default ''
   * @description Only rendered when `cardTitle` or `cardSubtitle` is non-empty.
   */
  readonly cardSubtitle = input('');

  /**
   * Makes the whole card a single clickable target (button pattern).
   *
   * @type {boolean}
   * @default false
   * @description Adds `role="button"`, keyboard activation (Enter/Space), hover/focus
   * styling, and emits `activate`. Do NOT nest other interactive elements inside an
   * interactive card — use `[pixelCardActions]` on a non-interactive card instead.
   */
  readonly interactive = input(false, { transform: booleanAttribute });

  /**
   * Disables interaction while `interactive` is set.
   *
   * @type {boolean}
   * @default false
   * @description Removes the card from the tab order and sets `aria-disabled`.
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Marks the card as part of a selectable set (card-picker pattern).
   *
   * @type {boolean}
   * @default false
   * @description With `interactive`, exposes `aria-pressed` reflecting `selected`.
   */
  readonly selectable = input(false, { transform: booleanAttribute });

  /**
   * Controlled selected state for the card-picker pattern.
   *
   * @type {boolean}
   * @default false
   * @description Parent owns the state: listen to `activate` and update `selected`.
   */
  readonly selected = input(false, { transform: booleanAttribute });

  /**
   * Accessible name for interactive cards whose visible content is not a sufficient label.
   *
   * @type {string}
   * @default ''
   * @description Maps to `aria-label` on the host.
   */
  readonly ariaLabel = input('');

  /**
   * Replaces the card with a skeleton placeholder matching its footprint.
   *
   * @type {boolean}
   * @default false
   * @description Sized by `skeletonHeight`; use while the card's data loads.
   */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  /**
   * Height of the skeleton placeholder.
   *
   * @type {string}
   * @default '10rem'
   * @description Any CSS size; match the expected rendered height to avoid layout shift.
   */
  readonly skeletonHeight = input('10rem');

  /**
   * Emits when an interactive card is activated by mouse or keyboard.
   */
  readonly activate = output<PixelCardActivateEvent>();

  protected readonly isInteractive = computed(() => this.interactive() && !this.showSkeleton());

  protected readonly hasHeaderText = computed(
    () => this.cardTitle().trim().length > 0 || this.cardSubtitle().trim().length > 0,
  );

  protected onHostPointerDown(): void {
    this.lastInteractionSource.set('mouse');
  }

  protected onHostClick(event: MouseEvent): void {
    if (!this.isInteractive()) {
      return;
    }
    if (this.disabled()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    this.activate.emit({ source: this.lastInteractionSource(), originalEvent: event });
    this.lastInteractionSource.set('mouse');
  }

  protected onHostKeyDown(event: KeyboardEvent): void {
    if (!this.isInteractive() || this.disabled()) {
      return;
    }
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    // Space must not scroll the page while the card has focus.
    event.preventDefault();
    this.keyboardActive.set(true);
    this.lastInteractionSource.set('keyboard');
    if (event.key === 'Enter') {
      this.activate.emit({ source: 'keyboard', originalEvent: event });
    }
  }

  protected onHostKeyUp(event: KeyboardEvent): void {
    if (!this.isInteractive() || this.disabled()) {
      return;
    }
    if (event.key !== ' ') {
      return;
    }
    this.keyboardActive.set(false);
    // Space activates on keyup, matching native button semantics.
    this.activate.emit({ source: 'keyboard', originalEvent: event });
  }
}
