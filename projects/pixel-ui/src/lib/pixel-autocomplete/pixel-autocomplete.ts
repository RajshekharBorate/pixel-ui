import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  NgControl,
  ValidationErrors,
  Validator,
  Validators,
} from '@angular/forms';
import { merge } from 'rxjs';
import PixelInputComponent, { type PixelInputSize } from '../pixel-input/pixel-input';
import PixelAvatarComponent from '../pixel-avatar/pixel-avatar';
import PixelTooltipDirective from '../pixel-tooltip/pixel-tooltip';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';
import {
  ConnectedOverlay,
  OVERLAY_PANEL_OFFSET,
  OVERLAY_VIEWPORT_MARGIN,
  type OverlayPlacement,
  type OverlayWidthStrategy,
} from '../shared/overlay/connected-overlay';

export type PixelAutocompleteSize = 'xs' | 'sm' | 'md' | 'lg';
export type PixelAutocompleteLabelPosition = 'top' | 'left' | 'floating' | 'hidden';
export type PixelAutocompleteOpenDirection = 'auto' | 'top' | 'bottom';
export type PixelAutocompleteScrollBehavior = 'close' | 'reposition' | 'block';
export type PixelAutocompletePanelWidthMode = 'auto' | 'match-trigger' | 'custom';
export type PixelAutocompleteInteractionSource = 'mouse' | 'keyboard';

/** A selectable suggestion rendered in the dropdown. */
export interface PixelAutocompleteOption {
  readonly value: unknown;
  readonly label: string;
  readonly disabled?: boolean;
  readonly group?: string;
  readonly subtitle?: string;
  readonly meta?: string;
  readonly icon?: string;
  readonly imageSrc?: string;
  readonly avatarText?: string;
}

/** Pre-grouped options, mirroring `pixel-select`'s grouped shape. */
export interface PixelAutocompleteGroup {
  readonly id: string;
  readonly label: string;
  readonly options: readonly PixelAutocompleteOption[];
}

export interface PixelAutocompleteSelectionChange {
  readonly value: unknown;
  readonly option: PixelAutocompleteOption | null;
  readonly source: PixelAutocompleteInteractionSource;
}

/** Maps `AbstractControl` error keys to user-visible copy (same shape as `pixel-input`). */
export interface PixelAutocompleteValidationMessages {
  required?: string;
  [errorCode: string]: string | undefined;
}

function defaultDisplayWith(option: PixelAutocompleteOption): string {
  return option.label;
}

/** Picks user-visible copy for the first matching error key (required first, then any). */
function resolveValidationMessage(
  errors: ValidationErrors,
  messages: PixelAutocompleteValidationMessages,
): string {
  if (errors['required'] != null && messages.required?.trim()) {
    return messages.required.trim();
  }
  for (const key of Object.keys(errors)) {
    const message = messages[key]?.trim();
    if (message) {
      return message;
    }
  }
  return '';
}

let nextAutocompleteId = 0;

/**
 * Text field with a typeahead suggestion list. Composes `pixel-input` for the field and the shared
 * connected-overlay for a body-appended listbox panel (same architecture as `pixel-datepicker`),
 * and renders suggestions like `pixel-select`'s options. Implements the WAI-ARIA combobox pattern:
 * the input keeps focus while `aria-activedescendant` tracks the highlighted option.
 *
 * Implements `ControlValueAccessor` + `Validator` for reactive and template-driven forms. The form
 * value is the selected option's `value`; with `allowCustomValue` (default) free text becomes the
 * value when it matches no option.
 */
@Component({
  selector: 'pixel-autocomplete',
  imports: [PixelInputComponent, PixelAvatarComponent, PixelTooltipDirective, PixelSkeletonComponent],
  templateUrl: './pixel-autocomplete.html',
  styleUrl: './pixel-autocomplete.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PixelAutocompleteComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PixelAutocompleteComponent),
      multi: true,
    },
  ],
})
export default class PixelAutocompleteComponent implements ControlValueAccessor, Validator {
  protected readonly fallbackId = `pixel-autocomplete-${++nextAutocompleteId}`;
  protected readonly listboxId = `${this.fallbackId}-listbox`;
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly panelRef = viewChild<ElementRef<HTMLElement>>('panelRef');
  protected readonly optionsScrollRef = viewChild<ElementRef<HTMLElement>>('optionsScrollRef');
  protected readonly inputRef = viewChild(PixelInputComponent);
  /** Shared connected-overlay controller: body-appended panel, positioning, scroll strategy. */
  private readonly overlay = new ConnectedOverlay();

  protected readonly isOpen = signal(false);
  protected readonly isFocused = signal(false);
  /** Text currently shown in the field. */
  protected readonly inputText = signal('');
  /** Query used for local filtering; cleared after a selection so reopening shows the full list. */
  protected readonly searchQuery = signal('');
  /** True once the user types; gates local filtering so a fresh open lists every option (Material-style). */
  private readonly hasUserTyped = signal(false);
  protected readonly focusedIndex = signal(-1);
  /** The committed value (selected option value, or free text when `allowCustomValue`). */
  private readonly internalValue = signal<unknown>(null);
  private readonly formDisabled = signal(false);
  private readonly controlShowsError = signal(false);
  private readonly controlValidationErrors = signal<ValidationErrors | null>(null);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  /** Prevents the panel from re-opening when focus returns to the input right after a selection. */
  private justSelected = false;

  private onChange: (value: unknown) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private onValidatorChange: () => void = () => undefined;

  /**
   * @component pixel-autocomplete
   * Optional id for the native input; falls back to a generated stable id.
   */
  readonly id = input('');

  /**
   * @component pixel-autocomplete
   * Visible field label.
   */
  readonly label = input('');

  /**
   * @component pixel-autocomplete
   * Controlled value. Matches an option's `value`, or is the raw text for a custom entry.
   */
  readonly value = input<unknown>(null);

  /**
   * @component pixel-autocomplete
   * Flat suggestion list rendered in the panel.
   */
  readonly options = input<readonly PixelAutocompleteOption[]>([]);

  /**
   * @component pixel-autocomplete
   * Optional pre-grouped suggestions. Preferred over `options` when `grouped` is true.
   */
  readonly groups = input<readonly PixelAutocompleteGroup[]>([]);

  /**
   * @component pixel-autocomplete
   * Size token controlling typography, padding, and height.
   */
  readonly size = input<PixelAutocompleteSize>('md');

  /**
   * @component pixel-autocomplete
   * Label layout relative to the field.
   */
  readonly labelPosition = input<PixelAutocompleteLabelPosition>('top');

  /**
   * @component pixel-autocomplete
   * Placeholder shown when the field is empty.
   */
  readonly placeholder = input('');

  /**
   * @component pixel-autocomplete
   * When true, replaces the field with a skeleton placeholder. Bind to a loading signal or
   * a reactive form control's `pending` state: `[showSkeleton]="control.pending"`.
   */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-autocomplete
   * Disables interaction and applies disabled styling.
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-autocomplete
   * Prevents edits while keeping the field focusable.
   */
  readonly readonly = input(false, { transform: booleanAttribute });

  /**
   * When false, the field does not inherit error state from an ancestor `NgControl`.
   */
  readonly inheritParentControlErrors = input(true, { transform: booleanAttribute });

  /**
   * @component pixel-autocomplete
   * Marks the control as required for validation and UI.
   */
  readonly required = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-autocomplete
   * Helper/hint copy rendered under the field.
   */
  readonly helperText = input('');

  /**
   * @component pixel-autocomplete
   * Messages for each `ValidationErrors` key when the bound control is invalid and touched or dirty.
   */
  readonly validationMessages = input<PixelAutocompleteValidationMessages>({});

  /**
   * @component pixel-autocomplete
   * Shows a clear affordance when the field has text.
   */
  readonly clearable = input(true, { transform: booleanAttribute });

  /**
   * @component pixel-autocomplete
   * Shows loading UI while async suggestions are fetched (e.g. during `serverSearch`).
   */
  readonly loading = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-autocomplete
   * Allows committing the raw typed text when it matches no option. When false, the field reverts
   * to the last valid selection on blur (Material's `requireSelection`).
   */
  readonly allowCustomValue = input(true, { transform: booleanAttribute });

  /**
   * @component pixel-autocomplete
   * Skips local filtering and emits `searchChange` (debounced) so the parent supplies `options`.
   */
  readonly serverSearch = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-autocomplete
   * Debounce duration for the `searchChange` emit when `serverSearch` is on.
   */
  readonly searchDebounceMs = input(300, { transform: numberAttribute });

  /**
   * @component pixel-autocomplete
   * Minimum characters before the panel opens / a search is emitted.
   */
  readonly minChars = input(0, { transform: numberAttribute });

  /**
   * @component pixel-autocomplete
   * Opens the panel as soon as the field gains focus (when suggestions are available).
   */
  readonly openOnFocus = input(true, { transform: booleanAttribute });

  /**
   * @component pixel-autocomplete
   * Enables grouped rendering via `groups` or `option.group`.
   */
  readonly grouped = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-autocomplete
   * Highlights the matched substring inside option labels.
   */
  readonly highlightSearchMatches = input(true, { transform: booleanAttribute });

  /**
   * @component pixel-autocomplete
   * Max option rows visible before the panel scrolls.
   */
  readonly visibleOptionCount = input(6, { transform: numberAttribute });

  /**
   * @component pixel-autocomplete
   * Preferred open direction for panel placement.
   */
  readonly openDirection = input<PixelAutocompleteOpenDirection>('auto');

  /**
   * @component pixel-autocomplete
   * Page-scroll behaviour while the panel is open (see `pixel-select`).
   */
  readonly scrollBehavior = input<PixelAutocompleteScrollBehavior>('reposition');

  /**
   * @component pixel-autocomplete
   * Panel width strategy.
   */
  readonly panelWidth = input<PixelAutocompletePanelWidthMode>('match-trigger');

  /**
   * @component pixel-autocomplete
   * Custom CSS width used when `panelWidth` is custom.
   */
  readonly panelCustomWidth = input('20rem');

  /**
   * @component pixel-autocomplete
   * Message shown when no suggestions are available.
   */
  readonly emptyStateMessage = input('No suggestions.');

  /**
   * @component pixel-autocomplete
   * Message shown when the query matches no option.
   */
  readonly noResultMessage = input('No matching results.');

  /**
   * @component pixel-autocomplete
   * Custom formatter for the field text once an option is selected.
   */
  readonly displayWith = input<(option: PixelAutocompleteOption) => string>(defaultDisplayWith);

  /**
   * @component pixel-autocomplete
   * Compare function for object values.
   */
  readonly compareWith = input<(a: unknown, b: unknown) => boolean>((a, b) => Object.is(a, b));

  /**
   * @component pixel-autocomplete
   * Accessible name override when no visible label is shown.
   */
  readonly ariaLabel = input('');

  /**
   * @component pixel-autocomplete
   * Additional ids merged into `aria-describedby`.
   */
  readonly ariaDescribedBy = input('');

  /**
   * @component pixel-autocomplete
   * Extra classes appended to the host container.
   */
  readonly className = input('');

  readonly valueChange = output<unknown>();
  readonly optionSelected = output<PixelAutocompleteSelectionChange>();
  readonly inputChange = output<string>();
  readonly searchChange = output<string>();
  readonly openChange = output<boolean>();
  readonly focusChange = output<boolean>();
  readonly clearClick = output<void>();
  readonly enterPress = output<KeyboardEvent>();

  /** Mirror an external `[value]` into the field text + committed value. */
  private readonly syncExternalValue = effect(() => {
    const next = this.value();
    untracked(() => {
      if (this.resolveFormControl()) {
        return;
      }
      // Skip the echo of our own emit: `valueChange` round-trips through a two-way `[value]` binding,
      // and re-applying would wipe the in-progress query / typed text. Only genuine external changes
      // (a value differing from what we committed) re-derive the field.
      if (this.compareWith()(next, this.internalValue())) {
        return;
      }
      this.applyValue(next);
    });
  });

  /** Re-run validity styling derived from a bound `NgControl`. */
  private readonly syncControlErrorVisibility = effect((onCleanup) => {
    const control = untracked(() => this.resolveFormControl());
    if (!control) {
      untracked(() => {
        this.controlShowsError.set(false);
        this.controlValidationErrors.set(null);
      });
      return;
    }
    const sync = (): void => {
      this.controlValidationErrors.set(control.errors);
      this.controlShowsError.set(Boolean(control.invalid && (control.touched || control.dirty)));
    };
    sync();
    // `touched` changes emit on `control.events` (not statusChanges/valueChanges), so a required
    // field that is focused then blurred without a value flips its error styling on.
    const sub = merge(control.statusChanges, control.valueChanges, control.events).subscribe(sync);
    onCleanup(() => sub.unsubscribe());
  });

  private readonly syncValidators = effect(() => {
    this.required();
    untracked(() => this.onValidatorChange());
  });

  /** Debounced server-search emit (parallels `pixel-select`). */
  private readonly syncSearchEmitter = effect((onCleanup) => {
    const query = this.searchQuery();
    if (!this.serverSearch() || !this.hasUserTyped()) {
      return;
    }
    const debounceMs = Math.max(0, this.searchDebounceMs());
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
    if (debounceMs === 0) {
      this.searchChange.emit(query);
      return;
    }
    this.searchTimer = setTimeout(() => {
      this.searchChange.emit(query);
      this.searchTimer = null;
    }, debounceMs);
    onCleanup(() => {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
        this.searchTimer = null;
      }
    });
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }
      this.overlay.destroy();
    });
  }

  protected readonly fieldId = computed(() => this.id().trim() || this.fallbackId);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly customClassList = computed(() => this.className().trim());

  protected readonly skeletonFieldHeight = computed(() => {
    switch (this.size()) {
      case 'xs': return '2.35rem';
      case 'sm': return '2.5rem';
      case 'lg': return '3.125rem';
      default:   return '2.75rem';
    }
  });

  protected readonly shouldShowSkeletonLabel = computed(() =>
    !!this.label().trim() &&
    this.labelPosition() !== 'hidden' &&
    this.labelPosition() !== 'floating',
  );

  protected readonly inputSize = computed((): PixelInputSize => this.size());

  protected readonly effectivePanelEdge = computed((): 'top' | 'bottom' => {
    const direction = this.openDirection();
    if (direction === 'top' || direction === 'bottom') {
      return direction;
    }
    return this.overlay.position()?.edge ?? 'bottom';
  });

  protected readonly inputValidationMessages = computed(() => ({
    required: 'This field is required.',
    ...this.validationMessages(),
  }));

  /**
   * Error copy forwarded to the inner `pixel-input` as `errorOverride`. The inner input has
   * `inheritParentControlErrors=false` (so it honours `[value]` instead of binding to this
   * component's `NgControl`), so we surface the bound control's validation here explicitly.
   */
  protected readonly inputErrorOverride = computed(() => {
    if (!this.controlShowsError()) {
      return '';
    }
    const errors = this.controlValidationErrors();
    if (!errors) {
      return '';
    }
    return resolveValidationMessage(errors, this.inputValidationMessages());
  });

  /** Flat options resolved from `options` or `groups`. */
  protected readonly allOptions = computed((): readonly PixelAutocompleteOption[] => {
    if (this.grouped() && this.groups().length > 0) {
      return this.groups().flatMap((group) => group.options);
    }
    return this.options();
  });

  protected readonly filteredOptions = computed((): readonly PixelAutocompleteOption[] => {
    const all = this.allOptions();
    // Server search: parent already returns the matched set. No-typing: show everything.
    if (this.serverSearch() || !this.hasUserTyped()) {
      return all;
    }
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) {
      return all;
    }
    return all.filter((option) => {
      const text = `${option.label} ${option.subtitle ?? ''} ${option.meta ?? ''}`.toLowerCase();
      return text.includes(query);
    });
  });

  protected readonly groupedOptions = computed((): readonly PixelAutocompleteGroup[] => {
    const filtered = this.filteredOptions();
    if (!this.grouped()) {
      return [{ id: 'all', label: '', options: filtered }];
    }

    if (this.groups().length > 0) {
      return this.groups()
        .map((group) => ({
          id: group.id,
          label: group.label,
          options: group.options.filter((candidate) =>
            filtered.some((opt) => this.compareWith()(opt.value, candidate.value)),
          ),
        }))
        .filter((group) => group.options.length > 0);
    }

    const byGroup = new Map<string, PixelAutocompleteOption[]>();
    for (const option of filtered) {
      const key = option.group?.trim() || 'Suggestions';
      const existing = byGroup.get(key) ?? [];
      existing.push(option);
      byGroup.set(key, existing);
    }
    return Array.from(byGroup.entries()).map(([label, options], index) => ({
      id: `group-${index}`,
      label,
      options,
    }));
  });

  /** Keyboard-navigable (enabled-only) flat list. */
  protected readonly flatVisibleOptions = computed(() =>
    this.groupedOptions()
      .flatMap((group) => group.options)
      .filter((option) => !option.disabled),
  );
  protected readonly activeOption = computed(
    () => this.flatVisibleOptions()[this.focusedIndex()] ?? null,
  );
  protected readonly panelEmpty = computed(() =>
    this.groupedOptions().every((group) => group.options.length === 0),
  );
  protected readonly noResult = computed(
    () => this.searchQuery().trim().length > 0 && this.panelEmpty(),
  );

  protected readonly panelWidthStrategy = computed((): OverlayWidthStrategy => {
    switch (this.panelWidth()) {
      case 'custom':
        return { kind: 'custom', value: this.panelCustomWidth() };
      case 'match-trigger':
        return { kind: 'match-origin' };
      default:
        return { kind: 'min-origin' };
    }
  });

  protected readonly showClear = computed(
    () =>
      this.clearable() &&
      this.inputText().length > 0 &&
      !this.isDisabled() &&
      !this.readonly(),
  );

  protected readonly describedBy = computed(() => this.ariaDescribedBy().trim() || '');

  protected readonly activeDescendant = computed(() =>
    this.isOpen() && this.activeOption() ? this.optionId(this.focusedIndex()) : null,
  );

  writeValue(value: unknown): void {
    this.applyValue(value);
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  validate(control: AbstractControl): ValidationErrors | null {
    if (!this.isControlRequired(control)) {
      return null;
    }
    const value = control.value;
    const empty = value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
    return empty ? { required: true } : null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  /** Moves focus to the native input. */
  focus(): void {
    this.inputRef()?.focus();
  }

  protected onInputChange(raw: string): void {
    if (this.isDisabled() || this.readonly()) {
      return;
    }
    this.inputText.set(raw);
    this.searchQuery.set(raw);
    this.hasUserTyped.set(true);
    this.inputChange.emit(raw);

    if (this.allowCustomValue()) {
      this.commitValue(raw === '' ? null : raw, null);
    }

    const meetsMin = raw.trim().length >= this.minChars();
    this.setOpenState(meetsMin);
    this.focusedIndex.set(this.flatVisibleOptions().length > 0 ? 0 : -1);
    this.scheduleScrollActiveOptionIntoView();
  }

  protected onInputFocusChange(focused: boolean): void {
    this.isFocused.set(focused);
    this.focusChange.emit(focused);
    if (focused) {
      if (this.justSelected) {
        this.justSelected = false;
        return;
      }
      if (this.openOnFocus() && this.inputText().trim().length >= this.minChars()) {
        this.setOpenState(this.allOptions().length > 0);
      }
      return;
    }
    // Blur: revert to last valid selection when custom text isn't allowed.
    if (!this.allowCustomValue() && !this.optionForValue(this.internalValue())) {
      this.resetTextToValue();
    }
    if (!this.isOpen()) {
      this.onTouched();
    }
  }

  protected onInputKeydown(event: KeyboardEvent): void {
    if (this.isDisabled() || this.readonly()) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!this.isOpen()) {
        this.setOpenState(this.allOptions().length > 0);
        this.focusedIndex.set(this.flatVisibleOptions().length > 0 ? 0 : -1);
        this.scheduleScrollActiveOptionIntoView();
        return;
      }
      this.focusNextOption(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.isOpen()) {
        return;
      }
      this.focusNextOption(-1);
      return;
    }

    if (event.key === 'Home' && this.isOpen()) {
      event.preventDefault();
      const n = this.flatVisibleOptions().length;
      this.focusedIndex.set(n > 0 ? 0 : -1);
      this.scheduleScrollActiveOptionIntoView();
      return;
    }

    if (event.key === 'End' && this.isOpen()) {
      event.preventDefault();
      const n = this.flatVisibleOptions().length;
      this.focusedIndex.set(n > 0 ? n - 1 : -1);
      this.scheduleScrollActiveOptionIntoView();
      return;
    }

    if (event.key === 'Enter') {
      const active = this.activeOption();
      if (this.isOpen() && active) {
        event.preventDefault();
        this.selectOption(active, 'keyboard');
      }
      this.enterPress.emit(event);
      return;
    }

    if (event.key === 'Escape' && this.isOpen()) {
      event.preventDefault();
      event.stopPropagation();
      this.setOpenState(false);
    }
  }

  protected onClear(): void {
    if (this.isDisabled() || this.readonly()) {
      return;
    }
    this.inputText.set('');
    this.searchQuery.set('');
    this.hasUserTyped.set(false);
    this.commitValue(null, null);
    this.clearClick.emit();
    this.inputChange.emit('');
    this.setOpenState(false);
    this.inputRef()?.focus();
  }

  protected onOptionClick(option: PixelAutocompleteOption): void {
    if (option.disabled) {
      return;
    }
    this.selectOption(option, 'mouse');
  }

  protected isOptionActive(option: PixelAutocompleteOption): boolean {
    const active = this.activeOption();
    return Boolean(active) && this.compareWith()(active!.value, option.value);
  }

  protected isOptionSelected(option: PixelAutocompleteOption): boolean {
    return this.compareWith()(this.internalValue(), option.value);
  }

  protected optionAriaSelected(option: PixelAutocompleteOption): 'true' | 'false' {
    return this.isOptionSelected(option) ? 'true' : 'false';
  }

  protected optionId(index: number): string {
    return `${this.fieldId()}-option-${index}`;
  }

  /** Index into the enabled-only flat list, or -1 when disabled. */
  protected enabledFlatIndex(option: PixelAutocompleteOption): number {
    return this.flatVisibleOptions().findIndex((o) => this.compareWith()(o.value, option.value));
  }

  protected optionDomId(option: PixelAutocompleteOption, groupIndex: number, optionIndex: number): string {
    const vi = this.enabledFlatIndex(option);
    return vi >= 0 ? this.optionId(vi) : `${this.fieldId()}-option-disabled-${groupIndex}-${optionIndex}`;
  }

  protected groupHeaderId(groupId: string): string {
    return `${this.fieldId()}-group-${groupId}`;
  }

  protected optionHasAvatar(option: PixelAutocompleteOption): boolean {
    return Boolean(option.imageSrc || option.avatarText || option.icon);
  }

  /** Splits a label into `[before, match, after]` for highlighting, else `[label]`. */
  protected optionLabelParts(label: string): readonly string[] {
    const query = this.searchQuery().trim();
    if (!this.highlightSearchMatches() || !query || !this.hasUserTyped()) {
      return [label];
    }
    const index = label.toLowerCase().indexOf(query.toLowerCase());
    if (index < 0) {
      return [label];
    }
    return [label.slice(0, index), label.slice(index, index + query.length), label.slice(index + query.length)];
  }

  private selectOption(option: PixelAutocompleteOption, source: PixelAutocompleteInteractionSource): void {
    const text = this.displayWith()(option);
    this.inputText.set(text);
    this.searchQuery.set('');
    this.hasUserTyped.set(false);
    this.commitValue(option.value, option);
    this.optionSelected.emit({ value: option.value, option, source });
    this.justSelected = true;
    this.setOpenState(false);
    this.inputRef()?.focus();
  }

  private commitValue(value: unknown, _option: PixelAutocompleteOption | null): void {
    if (this.compareWith()(this.internalValue(), value)) {
      return;
    }
    this.internalValue.set(value);
    this.onChange(value);
    this.valueChange.emit(value);
  }

  private applyValue(value: unknown): void {
    this.internalValue.set(value);
    this.resetTextToValue();
  }

  /** Re-derive field text from the committed value (option label, or the raw string). */
  private resetTextToValue(): void {
    const value = this.internalValue();
    if (value === null || value === undefined || value === '') {
      this.inputText.set('');
      this.searchQuery.set('');
      this.hasUserTyped.set(false);
      return;
    }
    const option = this.optionForValue(value);
    this.inputText.set(option ? this.displayWith()(option) : String(value));
    this.searchQuery.set('');
    this.hasUserTyped.set(false);
  }

  private optionForValue(value: unknown): PixelAutocompleteOption | null {
    if (value === null || value === undefined) {
      return null;
    }
    return this.allOptions().find((option) => this.compareWith()(option.value, value)) ?? null;
  }

  private focusNextOption(step: 1 | -1): void {
    const options = this.flatVisibleOptions();
    if (options.length === 0) {
      this.focusedIndex.set(-1);
      return;
    }
    const last = options.length - 1;
    const current = this.focusedIndex();
    let next: number;
    if (current < 0) {
      next = step === 1 ? 0 : last;
    } else {
      next = step === 1 ? Math.min(current + 1, last) : Math.max(current - 1, 0);
    }
    if (next !== current) {
      this.focusedIndex.set(next);
      this.scheduleScrollActiveOptionIntoView();
    }
  }

  private setOpenState(next: boolean): void {
    if (this.isDisabled() || this.readonly()) {
      return;
    }
    if (next === this.isOpen()) {
      return;
    }
    if (next) {
      this.isOpen.set(true);
      this.scheduleAttachOverlay();
    } else {
      this.overlay.detach();
      this.isOpen.set(false);
      this.focusedIndex.set(-1);
      // Material-style: mark touched when the panel closes (e.g. outside click), not only on a
      // blur that lands after the panel is already shut — so required errors surface reliably.
      this.onTouched();
    }
    this.openChange.emit(next);
  }

  private placements(): OverlayPlacement[] {
    switch (this.openDirection()) {
      case 'top':
        return ['top-start', 'bottom-start'];
      default:
        return ['bottom-start', 'top-start'];
    }
  }

  private scheduleAttachOverlay(): void {
    afterNextRender(
      () => {
        if (!this.isOpen()) {
          return;
        }
        const origin = this.inputRef()?.overlayOrigin();
        const panel = this.panelRef()?.nativeElement;
        if (!origin || !panel) {
          return;
        }
        // Carry the active theme context to the body-appended panel.
        const themed = origin.closest<HTMLElement>('[data-theme]');
        if (themed) {
          panel.setAttribute('data-theme', themed.getAttribute('data-theme') ?? '');
        }
        this.overlay.attach(origin, panel, {
          preferredPlacements: this.placements(),
          scrollStrategy: this.scrollBehavior(),
          offset: OVERLAY_PANEL_OFFSET,
          viewportMargin: OVERLAY_VIEWPORT_MARGIN,
          width: this.panelWidthStrategy(),
          hasBackdrop: false,
          onOutsidePointer: () => this.setOpenState(false),
          onScrollClose: () => this.setOpenState(false),
        });
      },
      { injector: this.injector },
    );
  }

  private scheduleScrollActiveOptionIntoView(): void {
    afterNextRender(() => this.scrollActiveOptionIntoView(), { injector: this.injector });
  }

  private scrollActiveOptionIntoView(): void {
    const scroll = this.optionsScrollRef()?.nativeElement;
    const idx = this.focusedIndex();
    if (!scroll || idx < 0) {
      return;
    }
    const activeEl = document.getElementById(this.optionId(idx));
    if (!activeEl || !scroll.contains(activeEl)) {
      return;
    }
    activeEl.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }

  private resolveFormControl(): AbstractControl | null {
    const fromSelf = this.injector.get(NgControl, null, { optional: true, self: true });
    if (fromSelf?.control) {
      return fromSelf.control;
    }
    if (!this.inheritParentControlErrors()) {
      return null;
    }
    return this.injector.get(NgControl, null, { optional: true })?.control ?? null;
  }

  private isControlRequired(control: AbstractControl | null): boolean {
    return Boolean(this.required() || control?.hasValidator?.(Validators.required));
  }
}
