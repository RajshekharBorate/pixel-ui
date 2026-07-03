import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { normalizeClassValue } from './pixel-radio.shared';
import {
  PIXEL_RADIO_GROUP,
  PixelRadioClassValue,
  PixelRadioInteractionSource,
  PixelRadioLabelPosition,
  PixelRadioSelectionChangeEvent,
  PixelRadioSize,
  PixelRadioVisualState,
} from './pixel-radio.tokens';

let nextRadioId = 0;

@Component({
  selector: 'pixel-radio',
  standalone: true,
  templateUrl: './pixel-radio.html',
  styleUrl: './pixel-radio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelRadioComponent implements OnInit {
  protected readonly registrationId = `pixel-radio-${++nextRadioId}`;
  protected readonly fallbackId = this.registrationId;
  protected readonly helperId = `${this.fallbackId}-helper`;
  protected readonly descriptionId = `${this.fallbackId}-description`;
  protected readonly hintId = `${this.fallbackId}-hint`;

  private readonly group = inject(PIXEL_RADIO_GROUP, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly hasFocus = signal(false);
  protected readonly isHovered = signal(false);
  protected readonly nativeInput =
    viewChild<ElementRef<HTMLInputElement>>('nativeInput');

  /**
   * @component pixel-radio
   * Option value used for group selection.
   *
   * @type {unknown}
   * @default null
   */
  readonly value = input<unknown>(null);

  /**
   * @component pixel-radio
   * Visible option label.
   *
   * @type {string}
   * @default ''
   */
  readonly label = input('');

  /**
   * @component pixel-radio
   * Secondary description copy.
   *
   * @type {string}
   * @default ''
   */
  readonly description = input('');

  /**
   * @component pixel-radio
   * Short hint below the label.
   *
   * @type {string}
   * @default ''
   */
  readonly hint = input('');

  /**
   * @component pixel-radio
   * Helper text for standalone usage.
   *
   * @type {string}
   * @default ''
   */
  readonly helperText = input('');

  /**
   * @component pixel-radio
   * Disables this option.
   *
   * @type {boolean}
   * @default false
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-radio
   * Prevents selection changes.
   *
   * @type {boolean}
   * @default false
   */
  readonly readonly = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-radio
   * Marks the option as required (standalone).
   *
   * @type {boolean}
   * @default false
   */
  readonly required = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-radio
   * Visual state override.
   *
   * @type {PixelRadioVisualState}
   * @default 'default'
   */
  readonly state = input<PixelRadioVisualState>('default');

  /**
   * @component pixel-radio
   * Size variant.
   *
   * @type {PixelRadioSize}
   * @default 'md'
   */
  readonly size = input<PixelRadioSize>('md');

  /**
   * @component pixel-radio
   * Label position relative to the control.
   *
   * @type {PixelRadioLabelPosition}
   * @default 'right'
   */
  readonly labelPosition = input<PixelRadioLabelPosition>('right');

  /**
   * @component pixel-radio
   * Material Symbols icon name.
   *
   * @type {string}
   * @default ''
   */
  readonly icon = input('');

  /**
   * @component pixel-radio
   * Optional image URL.
   *
   * @type {string}
   * @default ''
   */
  readonly imageUrl = input('');

  /**
   * @component pixel-radio
   * Image alt text.
   *
   * @type {string}
   * @default ''
   */
  readonly imageAlt = input('');

  /**
   * @component pixel-radio
   * Inline badge text.
   *
   * @type {string}
   * @default ''
   */
  readonly badge = input('');

  /**
   * @component pixel-radio
   * Card-style option surface.
   *
   * @type {boolean}
   * @default false
   */
  readonly card = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-radio
   * Bordered surface styling.
   *
   * @type {boolean}
   * @default false
   */
  readonly bordered = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-radio
   * Filled surface styling.
   *
   * @type {boolean}
   * @default false
   */
  readonly filled = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-radio
   * Compact density.
   *
   * @type {boolean}
   * @default false
   */
  readonly compact = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-radio
   * Optional id for the native input.
   *
   * @type {string}
   * @default ''
   */
  readonly id = input('');

  /**
   * @component pixel-radio
   * Native name override (standalone).
   *
   * @type {string}
   * @default ''
   */
  readonly name = input('');

  /**
   * @component pixel-radio
   * Accessible name override.
   *
   * @type {string}
   * @default ''
   */
  readonly ariaLabel = input('');

  /**
   * @component pixel-radio
   * Extra CSS classes on the root label.
   *
   * @type {string}
   * @default ''
   */
  readonly className = input('');

  /**
   * @component pixel-radio
   * Angular-style class map.
   *
   * @type {PixelRadioClassValue}
   * @default ''
   */
  readonly classList = input<PixelRadioClassValue>('');

  /** Emits when this option becomes selected. */
  readonly valueChange = output<unknown>();

  /** Emits a rich selection payload. */
  readonly selectionChange = output<PixelRadioSelectionChangeEvent>();

  /** Emits focus state. */
  readonly focusChange = output<boolean>();

  /** Emits blur state. */
  readonly blurChange = output<boolean>();

  /** Emits when the option is activated. */
  readonly optionClick = output<PixelRadioSelectionChangeEvent>();

  /** Emits keyboard-driven selection. */
  readonly keyboardSelection = output<PixelRadioSelectionChangeEvent>();

  /** Emits hover state. */
  readonly hoverChange = output<{ value: unknown; hovered: boolean }>();

  protected readonly resolvedSize = computed(() => this.group?.size() ?? this.size());

  protected readonly resolvedLabelPosition = computed(
    () => this.group?.labelPosition() ?? this.labelPosition(),
  );

  protected readonly resolvedBordered = computed(() => this.group?.bordered() ?? this.bordered());

  protected readonly resolvedFilled = computed(() => this.group?.filled() ?? this.filled());

  protected readonly resolvedCompact = computed(() => this.group?.compact() ?? this.compact());

  protected readonly resolvedCard = computed(() => this.group?.card() ?? this.card());

  protected readonly isDisabled = computed(
    () =>
      this.disabled() || this.group?.disabled() === true || this.state() === 'disabled',
  );

  protected readonly isReadonly = computed(
    () => this.readonly() || this.group?.readonly() === true || this.state() === 'readonly',
  );

  protected readonly resolvedState = computed<PixelRadioVisualState>(() => {
    if (this.isDisabled()) {
      return 'disabled';
    }
    if (this.isReadonly()) {
      return 'readonly';
    }
    if (this.state() === 'error' || this.group?.showErrorState() === true) {
      return 'error';
    }
    return 'default';
  });

  protected readonly isChecked = computed(() => {
    const group = this.group;
    if (group) {
      return group.isSelected(this.value());
    }
    return false;
  });

  protected readonly inputId = computed(() => this.id().trim() || this.fallbackId);

  protected readonly resolvedName = computed(() => {
    const groupName = this.group?.name();
    if (groupName) {
      return groupName;
    }
    return this.name();
  });

  protected readonly customClassList = computed(() =>
    [this.className().trim(), normalizeClassValue(this.classList())].filter(Boolean).join(' '),
  );

  protected readonly tabIndex = computed(() => {
    const group = this.group;
    if (!group) {
      return this.isDisabled() ? -1 : 0;
    }
    return group.getTabIndex(this.value(), this.isDisabled());
  });

  ngOnInit(): void {
    const group = this.group;
    if (!group) {
      return;
    }

    group.register({
      id: this.registrationId,
      value: () => this.value(),
      disabled: () => this.isDisabled(),
      readonly: () => this.isReadonly(),
      element: () => this.hostRef.nativeElement,
      focus: () => this.focusNative(),
    });

    this.destroyRef.onDestroy(() => group.unregister(this.registrationId));
  }

  protected hasContent(): boolean {
    return Boolean(
      this.label().trim() ||
        this.description().trim() ||
        this.hint().trim() ||
        this.icon().trim(),
    );
  }

  protected inputValue(): string {
    const value = this.value();
    if (value === null || value === undefined) {
      return '';
    }
    return typeof value === 'string' ? value : String(value);
  }

  protected describedBy(): string {
    return [
      this.description() ? this.descriptionId : '',
      this.hint() ? this.hintId : '',
      this.helperText() ? this.helperId : '',
    ]
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  protected isRequiredField(): boolean {
    return this.required() || this.group?.required() === true;
  }

  protected onInputClick(event: MouseEvent): void {
    if (this.isDisabled() || this.isReadonly()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.activate('mouse', event);
  }

  protected onInputKeyDown(event: KeyboardEvent): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (this.isDisabled() || this.isReadonly()) {
        return;
      }
      this.activate('keyboard', event);
      return;
    }

    if (!this.group) {
      return;
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.group.focusNext(this.registrationId, 1);
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.group.focusNext(this.registrationId, -1);
    }
  }

  protected onInputFocus(): void {
    this.hasFocus.set(true);
    this.focusChange.emit(true);
  }

  protected onInputBlur(): void {
    this.hasFocus.set(false);
    this.group?.markTouched();
    this.blurChange.emit(true);
  }

  protected onHover(hovered: boolean): void {
    this.isHovered.set(hovered);
    this.hoverChange.emit({ value: this.value(), hovered });
  }

  private activate(source: PixelRadioInteractionSource, event: Event): void {
    const group = this.group;
    const value = this.value();

    if (group) {
      const previousValue = group.selectedValue();
      group.select(value, source, event);
      const payload: PixelRadioSelectionChangeEvent = {
        value,
        previousValue: previousValue as never,
        source,
        originalEvent: event,
      };
      this.optionClick.emit(payload);
      if (source === 'keyboard') {
        this.keyboardSelection.emit(payload);
      }
      return;
    }

    this.valueChange.emit(value);
    this.selectionChange.emit({
      value,
      previousValue: null,
      source,
      originalEvent: event,
    });
  }

  private focusNative(): void {
    this.nativeInput()?.nativeElement.focus();
  }
}
