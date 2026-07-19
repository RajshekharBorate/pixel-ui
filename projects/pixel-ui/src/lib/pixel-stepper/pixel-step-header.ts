import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  booleanAttribute,
  computed,
  effect,
  input,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import PixelBadgeComponent from '../pixel-badge/pixel-badge';
import PixelTooltipDirective from '../pixel-tooltip/pixel-tooltip';
import type {
  PixelStepperLabelPosition,
  PixelStepperOrientation,
  PixelStepperSize,
  PixelStepperType,
  PixelStepState,
} from './pixel-stepper.types';

/**
 * Presentational header for a single step: a state-aware indicator (number → icon → check / error /
 * warning / spinner / lock) plus label, description, optional hint, and badge. Rendered by
 * `pixel-stepper` for each step, but exported for bespoke layouts. Exposes `role="tab"` semantics and
 * emits `select` when activated; the parent owns whether the activation is allowed.
 */
@Component({
  selector: 'pixel-step-header',
  imports: [NgTemplateOutlet, PixelBadgeComponent, PixelTooltipDirective],
  templateUrl: './pixel-step-header.html',
  styleUrl: './pixel-step-header.scss',
  host: {
    class: 'pixel-step-header',
    '[class.pixel-step-header--selected]': 'selected()',
    '[class.pixel-step-header--clickable]': 'clickable()',
    '[class.pixel-step-header--custom-icon]': 'showsCustomIcon()',
    '[class.pixel-step-header--first]': 'first()',
    '[class.pixel-step-header--last]': 'last()',
    '[class.pixel-step-header--labels-collapsed]': 'labelsCollapsed()',
    '[attr.data-state]': 'state()',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-type]': 'type()',
    '[attr.data-size]': 'size()',
    '[attr.data-label-position]': 'labelPosition()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelStepHeaderComponent {
  /**
   * @component Zero-based position of the step within the flow.
   * @type {number}
   * @default 0
   */
  readonly index = input(0, { transform: numberAttribute });

  /**
   * @component One-based number shown inside the indicator when no icon / completion glyph applies.
   * @type {number}
   * @default 1
   */
  readonly displayNumber = input(1, { transform: numberAttribute });

  /**
   * @component Header label.
   * @type {string}
   * @default ''
   */
  readonly label = input('');

  /**
   * @component Secondary descriptive line.
   * @type {string}
   * @default ''
   */
  readonly description = input('');

  /**
   * @component Material Symbols glyph shown in the indicator instead of the number.
   * @type {string}
   * @default ''
   */
  readonly icon = input('');

  /**
   * @component Optional badge value rendered after the label.
   * @type {string | number}
   * @default ''
   */
  readonly badge = input<string | number>('');

  /**
   * @component Resolved visual state driving the indicator glyph and colour.
   * @type {PixelStepState}
   * @default 'pending'
   */
  readonly state = input<PixelStepState>('pending');

  /**
   * @component Density tier.
   * @type {PixelStepperSize}
   * @default 'md'
   */
  readonly size = input<PixelStepperSize>('md');

  /**
   * @component Layout axis the parent stepper is using.
   * @type {PixelStepperOrientation}
   * @default 'horizontal'
   */
  readonly orientation = input<PixelStepperOrientation>('horizontal');

  /**
   * @component Parent stepper preset (tunes connector + chrome styling).
   * @type {PixelStepperType}
   * @default 'horizontal'
   */
  readonly type = input<PixelStepperType>('horizontal');

  /**
   * @component Label placement relative to the indicator (horizontal layouts): `end` beside it,
   * `bottom` stacked centered below it.
   * @type {PixelStepperLabelPosition}
   * @default 'end'
   */
  readonly labelPosition = input<PixelStepperLabelPosition>('end');

  /**
   * @component Whether this header represents the currently selected step.
   * @type {boolean}
   * @default false
   */
  readonly selected = input(false, { transform: booleanAttribute });

  /**
   * @component Whether the header is interactive (renders as a focusable tab when true).
   * @type {boolean}
   * @default true
   */
  readonly clickable = input(true, { transform: booleanAttribute });

  /**
   * @component Marks the step as skippable; renders an "Optional" hint.
   * @type {boolean}
   * @default false
   */
  readonly optional = input(false, { transform: booleanAttribute });

  /**
   * @component True for the first header (suppresses the leading connector).
   * @type {boolean}
   * @default false
   */
  readonly first = input(false, { transform: booleanAttribute });

  /**
   * @component True for the last header (suppresses the trailing connector).
   * @type {boolean}
   * @default false
   */
  readonly last = input(false, { transform: booleanAttribute });

  /**
   * @component When true, hides the visible label / description and exposes them via tooltip +
   * `aria-label` (narrow viewports on horizontal presets).
   * @type {boolean}
   * @default false
   */
  readonly labelsCollapsed = input(false, { transform: booleanAttribute });

  /**
   * @component Tab `tabindex` (roving focus is managed by the parent stepper).
   * @type {number}
   * @default -1
   */
  readonly tabIndex = input(-1, { transform: numberAttribute });

  /**
   * @component DOM id of this header (target for `aria-labelledby`).
   * @type {string}
   * @default ''
   */
  readonly headerId = input('');

  /**
   * @component DOM id of the panel this header controls (`aria-controls`).
   * @type {string}
   * @default ''
   */
  readonly panelId = input('');

  /**
   * @component Optional custom indicator content (avatar / image / SVG), captured from the step's
   * `<ng-template pixelStepIcon>`. Status glyphs still take precedence.
   * @type {TemplateRef<unknown> | undefined}
   */
  readonly iconTemplate = input<TemplateRef<unknown> | undefined>(undefined);

  /** Emitted when an enabled header is activated (click / Enter / Space). */
  readonly select = output<number>();

  /** Label column — measured for ellipsis so the step tooltip can show on hover. */
  private readonly stepTextRef = viewChild<ElementRef<HTMLElement>>('stepText');

  /** True when the visible label column is clipped by overflow (inline layout). */
  private readonly labelTruncated = signal(false);

  /** Accessible name for the tab when the visible label is collapsed. */
  protected readonly accessibleName = computed(() => {
    const label = this.label().trim();
    return label || `Step ${this.displayNumber()}`;
  });

  /**
   * Tooltip shows the step name when labels are collapsed, or when the inline label is truncated
   * (hovering anywhere on the step). Empty when the full label is visible.
   */
  protected readonly tooltipMessage = computed(() => {
    if (this.labelsCollapsed() || this.labelTruncated()) {
      return this.accessibleName();
    }
    return '';
  });

  constructor() {
    // Measure the text column (not the button): ellipsis lives on the constrained child, so
    // pixelTooltipShowOnOverflow on the button host never saw truncation.
    effect((onCleanup) => {
      const el = this.stepTextRef()?.nativeElement;
      this.label();
      this.description();
      this.labelsCollapsed();
      this.labelPosition();
      this.size();

      if (!el || this.labelsCollapsed() || this.labelPosition() !== 'end') {
        this.labelTruncated.set(false);
        return;
      }
      if (typeof ResizeObserver === 'undefined') {
        return;
      }

      const measure = (): void => {
        this.labelTruncated.set(el.scrollWidth - el.clientWidth > 1);
      };
      measure();
      const frame = requestAnimationFrame(measure);
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      onCleanup(() => {
        cancelAnimationFrame(frame);
        ro.disconnect();
      });
    });
  }

  /** Whether the indicator should render a completion check. */
  protected readonly isComplete = computed(() => this.state() === 'completed');

  /** Whether the current state forces a status glyph (which overrides icon / custom content). */
  protected readonly isStatusGlyph = computed(() => {
    const state = this.state();
    return (
      state === 'completed' ||
      state === 'error' ||
      state === 'warning' ||
      state === 'loading' ||
      state === 'locked'
    );
  });

  /** Whether the indicator shows a glyph rather than the step number. */
  protected readonly showsGlyph = computed(() => this.isStatusGlyph() || !!this.icon());

  /** Whether projected custom indicator content (avatar / image) should render. */
  protected readonly showsCustomIcon = computed(
    () => !this.isStatusGlyph() && !!this.iconTemplate(),
  );

  /** Whether a non-empty badge value was supplied. */
  protected readonly hasBadge = computed(() => {
    const badge = this.badge();
    return badge !== '' && badge !== null && badge !== undefined;
  });

  protected onActivate(): void {
    if (this.clickable() && this.state() !== 'disabled' && this.state() !== 'locked') {
      this.select.emit(this.index());
    }
  }
}
