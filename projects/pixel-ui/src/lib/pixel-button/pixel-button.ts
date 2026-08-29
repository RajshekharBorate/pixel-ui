import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import PixelLoaderComponent from '../pixel-loader/pixel-loader';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';
import type { PixelLoaderSize } from '../pixel-loader/pixel-loader.types';
import {
  PIXEL_UI_ANALYTICS,
  trackPixelUiAnalytics,
} from '../shared/analytics/pixel-ui-analytics';

export type PixelButtonSize = 'xs' | 'sm' | 'md' | 'lg';
export type PixelButtonState = 'default' | 'disabled' | 'error' | 'success' | 'loading';
/** Mirrors Angular Material M3 button variants (`filled`, `outlined`, `text`, `elevated`, `tonal`, `icon`, `mini-fab`). */
export type PixelButtonAppearance =
  | 'solid'
  | 'outline'
  | 'text'
  | 'elevated'
  | 'tonal'
  | 'icon'
  | 'mini-fab';
export type PixelButtonType = 'button' | 'submit' | 'reset';
/** Glyph colour for the `icon` appearance: brand `primary`, neutral on-surface `default`, or semantic `error`. */
export type PixelButtonIconColor = 'primary' | 'default' | 'error';
/** Corner shape for `appearance="icon"` and `appearance="mini-fab"`. */
export type PixelButtonFabShape = 'circle' | 'square';
export type PixelButtonInteractionSource = 'mouse' | 'keyboard';
export type PixelButtonClassValue =
  | string
  | string[]
  | Record<string, boolean>
  | null
  | undefined;

export interface PixelButtonChangeEvent {
  pressed: boolean;
  state: PixelButtonState;
  source: PixelButtonInteractionSource;
  originalEvent: MouseEvent | KeyboardEvent;
}

let nextButtonId = 0;

function normalizeClassValue(classValue: PixelButtonClassValue): string {
  if (!classValue) {
    return '';
  }

  if (typeof classValue === 'string') {
    return classValue.trim();
  }

  if (Array.isArray(classValue)) {
    return classValue
      .flatMap((value) => normalizeClassValue(value))
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  return Object.entries(classValue)
    .filter(([, isEnabled]) => isEnabled)
    .map(([className]) => className)
    .join(' ')
    .trim();
}

@Component({
  selector: 'pixel-button',
  imports: [PixelLoaderComponent, PixelSkeletonComponent],
  template: `
    @if (showSkeleton()) {
      <pixel-skeleton
        shape="rounded"
        [width]="skeletonWidth()"
        [height]="skeletonHeight()"
        [borderRadius]="skeletonRadius()"
      />
    } @else {
    <button
      [id]="id() || fallbackId"
      class="pixel-button"
      [class]="customClassList()"
      [class.pixel-button--xs]="size() === 'xs'"
      [class.pixel-button--sm]="size() === 'sm'"
      [class.pixel-button--md]="size() === 'md'"
      [class.pixel-button--lg]="size() === 'lg'"
      [class.pixel-button--solid]="appearance() === 'solid'"
      [class.pixel-button--outline]="appearance() === 'outline'"
      [class.pixel-button--text]="appearance() === 'text'"
      [class.pixel-button--elevated]="appearance() === 'elevated'"
      [class.pixel-button--tonal]="appearance() === 'tonal'"
      [class.pixel-button--icon]="appearance() === 'icon'"
      [class.pixel-button--icon-default]="appearance() === 'icon' && iconColor() === 'default'"
      [class.pixel-button--icon-error]="appearance() === 'icon' && iconColor() === 'error'"
      [class.pixel-button--mini-fab]="appearance() === 'mini-fab'"
      [class.pixel-button--shape-square]="isIconOnlyAppearance() && fabShape() === 'square'"
      [class.pixel-button--disabled]="isDisabled()"
      [class.pixel-button--error]="resolvedState() === 'error'"
      [class.pixel-button--success]="resolvedState() === 'success'"
      [class.pixel-button--loading]="isLoading()"
      [class.pixel-button--full-width]="fullWidth()"
      [class.pixel-button--toggleable]="toggleable()"
      [class.pixel-button--pressed]="pressed()"
      [class.pixel-button--focused]="hasFocus()"
      [class.pixel-button--keyboard-active]="keyboardActive()"
      [attr.type]="buttonType()"
      [attr.name]="name() || null"
      [attr.value]="value() || null"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-describedby]="describedBy() || null"
      [attr.aria-controls]="ariaControls() || null"
      [attr.aria-expanded]="ariaExpanded() === undefined ? null : ariaExpanded() ? 'true' : 'false'"
      [attr.aria-disabled]="isDisabled() ? 'true' : 'false'"
      [attr.aria-busy]="isLoading() ? 'true' : 'false'"
      [attr.aria-pressed]="toggleable() ? (pressed() ? 'true' : 'false') : null"
      [attr.data-state]="resolvedState()"
      [attr.data-size]="size()"
      [attr.data-appearance]="appearance()"
      [attr.data-icon-shape]="isIconOnlyAppearance() ? fabShape() : null"
      [attr.autofocus]="autofocus() ? '' : null"
      [disabled]="isDisabled()"
      (pointerdown)="onButtonPointerDown()"
      (click)="onButtonClick($event)"
      (keydown)="onButtonKeyDown($event)"
      (keyup)="onButtonKeyUp($event)"
      (focus)="hasFocus.set(true)"
      (blur)="onButtonBlur()"
    >
      <span class="pixel-button__surface">
        @if (isLoading()) {
          <pixel-loader
            class="pixel-button__loader"
            type="ring"
            [size]="loaderSize()"
            [attr.aria-hidden]="true"
          />
        }
        @if (isIconOnlyAppearance()) {
          @if (iconOnlyGlyph()) {
            <span
              class="pixel-button__icon pixel-button__icon--only material-symbols-outlined"
              aria-hidden="true"
            >
              {{ iconOnlyGlyph() }}
            </span>
          }
        } @else {
          @if (leadingIcon()) {
            <span
              class="pixel-button__icon pixel-button__icon--leading material-symbols-outlined"
              aria-hidden="true"
            >
              {{ leadingIcon() }}
            </span>
          }

          <span class="pixel-button__label">
            <ng-content />
          </span>

          @if (trailingIcon()) {
            <span
              class="pixel-button__icon pixel-button__icon--trailing material-symbols-outlined"
              aria-hidden="true"
            >
              {{ trailingIcon() }}
            </span>
          }
        }
      </span>

      <span
        class="pixel-button__sr-only"
        [id]="statusMessageId"
        [attr.aria-live]="isLoading() ? 'polite' : 'off'"
        aria-atomic="true"
      >
        @switch (resolvedState()) {
          @case ('loading') {
            {{ loadingLabel() }}
          }
          @case ('error') {
            Error state
          }
          @case ('success') {
            Success state
          }
          @default {
            Ready
          }
        }
      </span>
    </button>
    }
  `,
  styleUrl: './pixel-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelButtonComponent {
  protected readonly fallbackId = `pixel-button-${++nextButtonId}`;
  protected readonly statusMessageId = `${this.fallbackId}-status`;
  protected readonly hasFocus = signal(false);
  protected readonly keyboardActive = signal(false);
  private readonly lastInteractionSource = signal<PixelButtonInteractionSource>('mouse');
  private readonly analytics = inject(PIXEL_UI_ANALYTICS, { optional: true });

  /**
   * Optional element id applied to the native button.
   *
   * @type {string}
   * @default ''
   * @description Supplies a stable id for labels, descriptions, and end-to-end selectors.
   */
  readonly id = input('');

  /**
   * Native button type.
   *
   * @type {'button' | 'submit' | 'reset'}
   * @default 'button'
   * @description Controls the native button submission behavior inside forms.
   */
  readonly buttonType = input<PixelButtonType>('button');

  /**
   * Optional form field name.
   *
   * @type {string}
   * @default ''
   * @description Passes a name through when the button participates in native form submission.
   */
  readonly name = input('');

  /**
   * Optional form submission value.
   *
   * @type {string}
   * @default ''
   * @description Sets the native button value for form posts.
   */
  readonly value = input('');

  /**
   * Visual size variant.
   *
   * @type {'xs' | 'sm' | 'md' | 'lg'}
   * @default 'md'
   * @description Adjusts padding, height, icon size, and font sizing.
   */
  readonly size = input<PixelButtonSize>('md');

  /** When true, replaces the button with a skeleton placeholder sized to match the current size and appearance. */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  /**
   * Semantic state variant.
   *
   * @type {'default' | 'disabled' | 'error' | 'success' | 'loading'}
   * @default 'default'
   * @description Applies accessible state styling and interaction rules.
   */
  readonly state = input<PixelButtonState>('default');

  /**
   * Visual appearance style (aligned with Angular Material M3 buttons).
   *
   * @type {'solid' | 'outline' | 'text' | 'elevated' | 'tonal'}
   * @default 'solid'
   * @description `solid` = filled, `outline` = outlined, `text` = text, `elevated` = protected, `tonal` = tonal.
   */
  readonly appearance = input<PixelButtonAppearance>('solid');

  /**
   * Glyph colour for the `icon` appearance.
   *
   * @type {'primary' | 'default' | 'error'}
   * @default 'default'
   * @description `default` = neutral on-surface (e.g. toolbar / calendar navigation icons),
   * `primary` = brand colour, `error` = destructive / error colour. Ignored by all other appearances.
   */
  readonly iconColor = input<PixelButtonIconColor>('default');

  /**
   * Corner shape when `appearance` is `icon` or `mini-fab`.
   *
   * @type {'circle' | 'square'}
   * @default 'circle'
   * @description `circle` matches Material icon / mini FAB; `square` uses the standard button corner radius.
   */
  readonly fabShape = input<PixelButtonFabShape>('circle');

  /**
   * Disables interaction regardless of the semantic state value.
   *
   * @type {boolean}
   * @default false
   * @description Prevents pointer and keyboard activation and marks the control as unavailable.
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Enables a controlled toggle-button pattern.
   *
   * @type {boolean}
   * @default false
   * @description Adds `aria-pressed` and emits `change` and `toggle` events with the next pressed state.
   */
  readonly toggleable = input(false, { transform: booleanAttribute });

  /**
   * Controlled pressed value used when `toggleable` is enabled.
   *
   * @type {boolean}
   * @default false
   * @description Lets parent components own the toggle state explicitly.
   */
  readonly pressed = input(false, { transform: booleanAttribute });

  /**
   * Makes the button stretch to the width of its container.
   *
   * @type {boolean}
   * @default false
   * @description Useful for stacked mobile actions and full-width form layouts.
   */
  readonly fullWidth = input(false, { transform: booleanAttribute });

  /**
   * Optional leading icon text or glyph.
   *
   * @type {string}
   * @default ''
   * @description Renders a decorative leading icon before projected content.
   */
  readonly leadingIcon = input('');

  /**
   * Optional trailing icon text or glyph.
   *
   * @type {string}
   * @default ''
   * @description Renders a decorative trailing icon after projected content.
   */
  readonly trailingIcon = input('');

  /**
   * Accessible name for icon-only or context-light buttons.
   *
   * @type {string}
   * @default ''
   * @description Maps directly to `aria-label` on the native button.
   */
  readonly ariaLabel = input('');

  /**
   * Space-separated ids describing supporting helper text.
   *
   * @type {string}
   * @default ''
   * @description Extends the computed accessibility description with external helper content.
   */
  readonly ariaDescribedBy = input('');

  /**
   * Optional id of the controlled element.
   *
   * @type {string}
   * @default ''
   * @description Passes through to `aria-controls` for menus, drawers, and disclosure patterns.
   */
  readonly ariaControls = input('');

  /**
   * Optional expanded state for disclosure controls (`aria-expanded`).
   *
   * @type {boolean | undefined}
   * @default undefined
   * @description Omit when the button is not a disclosure trigger.
   */
  readonly ariaExpanded = input<boolean>();

  /**
   * Automatically focuses the button on initial render.
   *
   * @type {boolean}
   * @default false
   * @description Uses the native `autofocus` attribute when a focused primary action is appropriate.
   */
  readonly autofocus = input(false, { transform: booleanAttribute });

  /**
   * Screen-reader copy announced while loading.
   *
   * @type {string}
   * @default 'Loading'
   * @description Keeps async feedback understandable for assistive technologies.
   */
  readonly loadingLabel = input('Loading');

  /**
   * Semantic analytics action id. When set and `PIXEL_UI_ANALYTICS` is provided, emits
   * `ui.button.click` on activation (does not require the `pixelAnalyticsTrack` directive).
   *
   * @type {string}
   * @default ''
   * @description Opt-in product action label (e.g. `save`, `cancel`). Empty disables tracking.
   */
  readonly analyticsAction = input('');

  /**
   * Extra analytics properties merged into the click event when `analyticsAction` is set.
   *
   * @type {Record<string, unknown>}
   * @default {}
   */
  readonly analyticsProperties = input<Record<string, unknown>>({});

  /**
   * Extra CSS classes appended to the native button.
   *
   * @type {string}
   * @default ''
   * @description Supports quick one-off utility classes or theme hooks.
   */
  readonly className = input('');

  /**
   * Angular-style class map input for advanced custom styling.
   *
   * @type {string | string[] | Record<string, boolean> | null | undefined}
   * @default ''
   * @description Normalizes string, array, and object class declarations without relying on `ngClass`.
   */
  readonly ngClass = input<PixelButtonClassValue>('');

  /**
   * Emits whenever the button is activated by mouse or keyboard.
   */
  readonly click = output<MouseEvent | KeyboardEvent>();

  /**
   * Emits the next controlled pressed state for toggle-button interactions.
   */
  readonly change = output<PixelButtonChangeEvent>();

  /**
   * Emits a shorthand boolean pressed value for toggle-button interactions.
   */
  readonly toggle = output<boolean>();

  protected readonly resolvedState = computed<PixelButtonState>(() => {
    if (this.disabled() || this.state() === 'disabled') {
      return 'disabled';
    }

    if (this.state() === 'loading') {
      return 'loading';
    }

    if (this.state() === 'error') {
      return 'error';
    }

    if (this.state() === 'success') {
      return 'success';
    }

    return 'default';
  });

  protected readonly isDisabled = computed(
    () => this.resolvedState() === 'disabled' || this.resolvedState() === 'loading',
  );

  protected readonly isLoading = computed(() => this.resolvedState() === 'loading');

  /** Inline loader density — sized to match the button icon scale. */
  protected readonly loaderSize = computed<PixelLoaderSize>(() => {
    switch (this.size()) {
      case 'lg':
        return 'sm';
      case 'md':
      case 'sm':
      case 'xs':
      default:
        return 'xs';
    }
  });

  protected readonly isIconOnlyAppearance = computed(
    () => this.appearance() === 'icon' || this.appearance() === 'mini-fab',
  );

  /** Skeleton height mirrors --pixel-button-min-height for the active size. */
  protected readonly skeletonHeight = computed(() => {
    switch (this.size()) {
      case 'xs': return '1.75rem';
      case 'sm': return '2rem';
      case 'lg': return '3rem';
      default:   return '2.5rem';
    }
  });

  /** Icon-only: square (height = width); text buttons: reasonable label-width placeholder. */
  protected readonly skeletonWidth = computed(() => {
    if (this.isIconOnlyAppearance()) return this.skeletonHeight();
    return '6rem';
  });

  /** Icon/mini-fab circle: full pill; all others: standard 0.75rem corner. */
  protected readonly skeletonRadius = computed(() => {
    if (this.appearance() === 'icon' && this.fabShape() === 'circle') return '999px';
    if (this.appearance() === 'mini-fab') return '999px';
    return '0.75rem';
  });

  protected readonly iconOnlyGlyph = computed(() => {
    const leading = this.leadingIcon().trim();
    if (leading) {
      return leading;
    }
    return this.trailingIcon().trim();
  });

  protected readonly describedBy = computed(() => {
    const describedBy = this.ariaDescribedBy().trim();
    return [describedBy, this.statusMessageId].filter(Boolean).join(' ').trim();
  });

  protected readonly customClassList = computed(() => {
    return [this.className().trim(), normalizeClassValue(this.ngClass())]
      .filter(Boolean)
      .join(' ')
      .trim();
  });

  protected onButtonClick(event: MouseEvent): void {
    if (this.isDisabled()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    event.stopPropagation();
    this.click.emit(event);
    this.emitAnalytics();

    if (!this.toggleable()) {
      this.lastInteractionSource.set('mouse');
      return;
    }

    const nextPressed = !this.pressed();
    const source = this.lastInteractionSource();

    this.change.emit({
      pressed: nextPressed,
      state: this.resolvedState(),
      source,
      originalEvent: event,
    });
    this.toggle.emit(nextPressed);
    this.lastInteractionSource.set('mouse');
  }

  private emitAnalytics(): void {
    const action = this.analyticsAction().trim();
    if (!action) {
      return;
    }
    trackPixelUiAnalytics(this.analytics, {
      name: 'ui.button.click',
      component: { name: 'pixel-button' },
      properties: {
        ...this.analyticsProperties(),
        appearance: this.appearance(),
        size: this.size(),
        source: this.lastInteractionSource(),
        action,
      },
    });
  }

  protected onButtonPointerDown(): void {
    this.lastInteractionSource.set('mouse');
  }

  protected onButtonKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    this.keyboardActive.set(true);
    this.lastInteractionSource.set('keyboard');
  }

  protected onButtonKeyUp(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    this.keyboardActive.set(false);
  }

  protected onButtonBlur(): void {
    this.hasFocus.set(false);
    this.keyboardActive.set(false);
  }
}
