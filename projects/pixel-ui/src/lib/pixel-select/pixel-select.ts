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
import { merge } from 'rxjs';
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
import PixelAvatarComponent from '../pixel-avatar/pixel-avatar';
import PixelChipComponent from '../pixel-chip/pixel-chip';
import PixelCheckboxComponent from '../pixel-checkbox/pixel-checkbox';
import PixelInputComponent, { PixelInputSize } from '../pixel-input/pixel-input';
import PixelTooltipDirective from '../pixel-tooltip/pixel-tooltip';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';
import {
  ConnectedOverlay,
  OVERLAY_PANEL_OFFSET,
  OVERLAY_VIEWPORT_MARGIN,
  type OverlayPlacement,
  type OverlayWidthStrategy,
} from '../shared/overlay/connected-overlay';
import { formatPixelLabel } from '../shared/format-label';
import { copyPixelThemeContext } from '../theme/pixel-theme';

export type PixelSelectSize = 'xs' | 'sm' | 'md' | 'lg';
export type PixelSelectLabelPosition = 'top' | 'left' | 'floating' | 'hidden';
export type PixelSelectMode = 'single' | 'multiple';
export type PixelSelectVisualState = 'default' | 'error' | 'loading';
export type PixelSelectOpenDirection = 'auto' | 'top' | 'bottom';

export type PixelSelectScrollBehavior = 'close' | 'reposition' | 'block';
export type PixelSelectPanelWidthMode = 'auto' | 'match-trigger' | 'custom';
export type PixelSelectClassValue =
  | string
  | string[]
  | Record<string, boolean>
  | null
  | undefined;
export type PixelSelectValue = unknown | unknown[] | null;
export type PixelSelectInteractionSource = 'mouse' | 'keyboard' | 'programmatic';

/**
 * A value paired with a display label. Use in place of a plain value when the
 * matching `PixelSelectOption` may not yet be present in the `options` list
 * (e.g. infinite-scroll / lazy-loaded dropdowns). The component will show the
 * label in the trigger immediately instead of falling back to the placeholder
 * or selected-count text.
 *
 * Single: `[value]="{ value: 'US', label: 'United States' }"`
 * Multi:  `[value]="[{ value: 'US', label: 'United States' }, { value: 'IN', label: 'India' }]"`
 */
export interface PixelSelectLabeledValue {
  readonly value: unknown;
  readonly label: string;
}

export interface PixelSelectOption {
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

export interface PixelSelectGroup {
  readonly id: string;
  readonly label: string;
  readonly options: readonly PixelSelectOption[];
}

export interface PixelSelectSelectionChange {
  readonly mode: PixelSelectMode;
  readonly value: PixelSelectValue;
  readonly selectedOptions: readonly PixelSelectOption[];
  readonly changedOption: PixelSelectOption | null;
  readonly source: PixelSelectInteractionSource;
}

/** Maps `AbstractControl` error keys to user-visible copy (same shape as `pixel-input`). */
export interface PixelSelectValidationMessages {
  required?: string;
  [errorCode: string]: string | undefined;
}

function isLabeledValue(v: unknown): v is PixelSelectLabeledValue {
  return (
    v !== null &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    'value' in v &&
    'label' in v &&
    typeof (v as PixelSelectLabeledValue).label === 'string'
  );
}

const VALIDATION_MESSAGE_PRIORITY: readonly string[] = ['required'];

function interpolateValidationTemplate(template: string, errorDetail: unknown): string {
  if (errorDetail === true || errorDetail === null || errorDetail === undefined) {
    return template;
  }
  if (typeof errorDetail !== 'object') {
    return template.replaceAll('{value}', String(errorDetail));
  }
  let result = template;
  for (const [key, value] of Object.entries(errorDetail as Record<string, unknown>)) {
    result = result.replaceAll(`{${key}}`, String(value));
  }
  return result;
}

function resolveValidationMessage(
  errors: ValidationErrors,
  messages: PixelSelectValidationMessages,
): string {
  for (const key of VALIDATION_MESSAGE_PRIORITY) {
    if (errors[key] != null) {
      const tpl = messages[key]?.trim();
      if (tpl) {
        return interpolateValidationTemplate(tpl, errors[key]);
      }
    }
  }
  for (const key of Object.keys(errors)) {
    const tpl = messages[key]?.trim();
    if (tpl) {
      return interpolateValidationTemplate(tpl, errors[key]);
    }
  }
  return '';
}

function normalizeClassValue(classValue: PixelSelectClassValue): string {
  if (!classValue) {
    return '';
  }

  if (typeof classValue === 'string') {
    return classValue.trim();
  }

  if (Array.isArray(classValue)) {
    return classValue
      .flatMap((value) => normalizeClassValue(value as PixelSelectClassValue))
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  return Object.entries(classValue)
    .filter(([, active]) => active)
    .map(([className]) => className)
    .join(' ')
    .trim();
}

function defaultDisplayWith(option: PixelSelectOption): string {
  return option.label;
}

let nextSelectId = 0;

@Component({
  selector: 'pixel-select',
  imports: [
    PixelAvatarComponent,
    PixelChipComponent,
    PixelCheckboxComponent,
    PixelInputComponent,
    PixelTooltipDirective,
    PixelSkeletonComponent,
  ],
  templateUrl: './pixel-select.html',
  styleUrl: './pixel-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PixelSelectComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PixelSelectComponent),
      multi: true,
    },
  ],
})
export default class PixelSelectComponent implements ControlValueAccessor, Validator {
  protected readonly fallbackId = `pixel-select-${++nextSelectId}`;
  protected readonly helperId = `${this.fallbackId}-helper`;
  protected readonly errorId = `${this.fallbackId}-error`;
  protected readonly listboxId = `${this.fallbackId}-listbox`;
  protected readonly searchId = `${this.fallbackId}-search`;
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly panelRef = viewChild<ElementRef<HTMLElement>>('panelRef');
  protected readonly optionsScrollRef = viewChild<ElementRef<HTMLElement>>('optionsScrollRef');
  protected readonly overlayOriginRef = viewChild<ElementRef<HTMLElement>>('overlayOriginRef');
  protected readonly sentinelRef = viewChild<ElementRef<HTMLElement>>('sentinelRef');
  protected readonly triggerRef = viewChild<ElementRef<HTMLButtonElement>>('triggerRef');
  protected readonly triggerContentRef = viewChild<ElementRef<HTMLElement>>('triggerContent');
  private readonly tagMeasureRowRef = viewChild<ElementRef<HTMLElement>>('tagMeasureRow');
  private readonly moreChipMeasureRef = viewChild<ElementRef<HTMLElement>>('moreChipMeasure');
  protected readonly isOpen = signal(false);
  protected readonly isFocused = signal(false);
  protected readonly searchText = signal('');
  protected readonly selectedValues = signal<unknown[]>([]);
  protected readonly focusedIndex = signal(-1);
  protected readonly lastScrollTop = signal(0);
  private readonly externalValueSnapshot = signal<PixelSelectValue>(null);
  private readonly previousOptionLength = signal(0);
  private observer: IntersectionObserver | null = null;
  /** Shared connected-overlay controller: body-appended panel, positioning, scroll strategy. */
  private readonly overlay = new ConnectedOverlay();
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private tagMeasureRaf = 0;
  /** -1 = not measured / unreliable layout (show every pill). */
  private readonly measuredVisibleTagCount = signal(-1);
  /** Measured block size (px) for the options scroll viewport (up to `visibleOptionCount` rows). */
  private readonly optionsViewportBlockSize = signal<number | null>(null);
  private optionsViewportMeasureObserver: ResizeObserver | null = null;
  private onChange: (value: PixelSelectValue) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private onValidatorChange: () => void = () => undefined;
  private readonly formDisabled = signal(false);
  /** True when the bound NgControl is invalid and touched or dirty. */
  private readonly controlShowsError = signal(false);
  private readonly controlValidationErrors = signal<ValidationErrors | null>(null);
  /** Persists resolved option objects so labels survive option-list swaps (e.g. server search). */
  private readonly selectedOptionsCache = signal<readonly PixelSelectOption[]>([]);

  private readonly syncExternalValue = effect(() => {
    const next = this.value();
    const previous = untracked(this.externalValueSnapshot);
    if (previous === next) {
      return;
    }
    this.externalValueSnapshot.set(next);
    this.setSelectionFromExternal(next);
  });

  private readonly syncObserver = effect((onCleanup) => {
    const open = this.isOpen();
    const enabled = this.infiniteScroll();
    const hasMore = this.hasMore();
    const sentinel = this.sentinelRef()?.nativeElement;
    if (!open || !enabled || !hasMore || !sentinel) {
      return;
    }

    this.observer?.disconnect();
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }
          this.panelScrollEnd.emit();
          this.loadMore.emit({
            query: this.searchText().trim(),
            selectedCount: this.selectedValues().length,
          });
        }
      },
      { root: this.optionsScrollRef()?.nativeElement ?? null, threshold: 0.1 },
    );
    this.observer.observe(sentinel);

    onCleanup(() => {
      this.observer?.disconnect();
      this.observer = null;
    });
  });

  private readonly syncSearchEmitter = effect((onCleanup) => {
    const text = this.searchText();
    if (!this.searchable()) {
      return;
    }
    const debounceMs = Math.max(0, this.searchDebounceMs());
    const isServerSearch = this.serverSearch();
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    if (!isServerSearch || debounceMs === 0) {
      this.searchChange.emit(text);
      return;
    }

    this.searchTimer = setTimeout(() => {
      this.searchChange.emit(text);
      this.searchTimer = null;
    }, debounceMs);

    onCleanup(() => {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
        this.searchTimer = null;
      }
    });
  });

  private readonly measureOptionsViewportWhenOpen = effect((onCleanup) => {
    if (!this.isOpen()) {
      this.optionsViewportBlockSize.set(null);
      this.disconnectOptionsViewportMeasureObserver();
      return;
    }
    this.flatVisibleOptions().length;
    this.groupedOptions();
    this.searchText();
    this.noResult();
    this.panelEmpty();
    this.loading();
    this.scheduleMeasureOptionsViewportBlockSize();
    onCleanup(() => this.disconnectOptionsViewportMeasureObserver());
  });

  private readonly restoreScrollPosition = effect(() => {
    if (!this.preserveScrollOnAppend()) {
      return;
    }
    const scroll = this.optionsScrollRef()?.nativeElement;
    if (!scroll || !this.isOpen()) {
      return;
    }

    const nextLength = this.filteredOptions().length;
    const previousLength = this.previousOptionLength();
    if (nextLength > previousLength) {
      queueMicrotask(() => {
        scroll.scrollTop = this.lastScrollTop();
      });
    }
    this.previousOptionLength.set(nextLength);
  });

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
    const sub = merge(control.statusChanges, control.valueChanges, control.events).subscribe(sync);
    onCleanup(() => sub.unsubscribe());
  });

  private readonly syncValidators = effect(() => {
    this.required();
    untracked(() => this.onValidatorChange());
  });

  private readonly syncSelectedOptionsCache = effect(() => {
    const values = this.selectedValues();
    const all = this.options();
    const cmp = this.compareWith();
    const currentCache = untracked(this.selectedOptionsCache);

    const updated: PixelSelectOption[] = [];
    for (const val of values) {
      const fromOptions = all.find((opt) => cmp(val, opt.value));
      if (fromOptions) {
        updated.push(fromOptions);
      } else {
        const fromCache = currentCache.find((opt) => cmp(val, opt.value));
        if (fromCache) {
          updated.push(fromCache);
        }
      }
    }
    this.selectedOptionsCache.set(updated);
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.tagMeasureRaf !== 0) {
        cancelAnimationFrame(this.tagMeasureRaf);
        this.tagMeasureRaf = 0;
      }
      this.overlay.destroy();
    });
  }

  /**
   * @component pixel-select
   * Optional id for the trigger button. A stable id is generated when omitted.
   */
  readonly id = input('');

  /**
   * @component pixel-select
   * Visible field label text.
   */
  readonly label = input('');

  /**
   * @component pixel-select
   * Controlled value. Use a scalar for single mode and an array for multiple mode.
   * Accepts `PixelSelectLabeledValue` objects (`{ value, label }`) so the trigger
   * can display labels immediately when the matching option hasn't loaded yet
   * (e.g. infinite-scroll). Plain values keep the existing behaviour.
   */
  readonly value = input<PixelSelectValue>(null);

  /**
   * @component pixel-select
   * Flat option list rendered in the dropdown.
   */
  readonly options = input<readonly PixelSelectOption[]>([]);

  /**
   * @component pixel-select
   * Optional pre-grouped options. When present and `grouped` is true this source is preferred.
   */
  readonly groups = input<readonly PixelSelectGroup[]>([]);

  /**
   * @component pixel-select
   * Selection mode: single-value select or multi-value select.
   */
  readonly mode = input<PixelSelectMode>('single');

  /**
   * @component pixel-select
   * Size token that controls spacing and typography.
   */
  readonly size = input<PixelSelectSize>('md');

  /**
   * @component pixel-select
   * Visual state style token.
   */
  readonly state = input<PixelSelectVisualState>('default');

  /**
   * @component pixel-select
   * When true, replaces the field with a skeleton placeholder. Bind to a loading signal or
   * a reactive form control's `pending` state: `[showSkeleton]="control.pending"`.
   */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-select
   * Disables all interactions and applies disabled semantics.
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-select
   * Prevents value changes while keeping the trigger focusable.
   */
  readonly readonly = input(false, { transform: booleanAttribute });

  /**
   * When false, the field does not inherit error state from an ancestor `NgControl`
   * (e.g. value-only fields nested inside another `ControlValueAccessor`).
   */
  readonly inheritParentControlErrors = input(true, { transform: booleanAttribute });

  /**
   * @component pixel-select
   * Marks the control as required for semantics and UI.
   */
  readonly required = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-select
   * Label layout relative to trigger.
   */
  readonly labelPosition = input<PixelSelectLabelPosition>('top');

  /**
   * @component pixel-select
   * Placeholder text shown when no option is selected.
   */
  readonly placeholder = input('');

  /**
   * @component pixel-select
   * Helper/hint copy rendered under the field.
   */
  readonly helperText = input('');

  /**
   * @component pixel-select
   * Messages for each `ValidationErrors` key when the bound control is invalid and touched or dirty.
   */
  readonly validationMessages = input<PixelSelectValidationMessages>({});

  /**
   * @component pixel-select
   * Optional prefix text shown in the trigger.
   */
  readonly prefixText = input('');

  /**
   * @component pixel-select
   * Optional suffix text shown in the trigger.
   */
  readonly suffixText = input('');

  /**
   * @component pixel-select
   * Optional prefix icon glyph name.
   */
  readonly prefixIcon = input('');

  /**
   * @component pixel-select
   * Optional suffix icon glyph name.
   */
  readonly suffixIcon = input('');

  /**
   * @component pixel-select
   * Enables search input in the panel.
   */
  readonly searchable = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-select
   * Emits search as a debounced server-side query when enabled.
   */
  readonly serverSearch = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-select
   * Debounce duration for server-side search emit.
   */
  readonly searchDebounceMs = input(300, { transform: numberAttribute });

  /**
   * @component pixel-select
   * When `mode` is `multiple` and `showTags` is true, shows a remove control on each pill.
   * There is no standalone clear button on the trigger.
   */
  readonly clearable = input(true, { transform: booleanAttribute });

  /**
   * @component pixel-select
   * Shows loading UI for async option fetch/search.
   */
  readonly loading = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-select
   * Enables grouped rendering via `groups` or option.group.
   */
  readonly grouped = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-select
   * Enables infinite scroll sentinel and load events.
   */
  readonly infiniteScroll = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-select
   * Whether additional pages are still available.
   */
  readonly hasMore = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-select
   * Indicates next-page loading state.
   */
  readonly loadingMore = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-select
   * Maximum options that can be selected in multiple mode. 0 means unlimited.
   */
  readonly maxSelectedItems = input(0, { transform: numberAttribute });

  /**
   * @component pixel-select
   * Displays "N selected" in trigger for multiple mode.
   */
  readonly showSelectedCount = input(true, { transform: booleanAttribute });

  /**
   * @component pixel-select
   * Renders removable chips in trigger for multiple mode.
   */
  readonly showTags = input(true, { transform: booleanAttribute });

  /**
   * @component pixel-select
   * Template for the overflow summary when not every pill fits in the trigger width. Use `{count}` placeholder.
   */
  readonly moreTagsLabel = input('+{count} more');

  /**
   * @component pixel-select
   * Max option rows visible in the panel viewport before scrolling (measured from DOM).
   */
  readonly visibleOptionCount = input(5, { transform: numberAttribute });

  /**
   * @component pixel-select
   * Shows select-all/unselect-all row in multiple mode.
   */
  readonly showSelectAll = input(true, { transform: booleanAttribute });

  /**
   * @component pixel-select
   * Closes panel after selecting. Defaults to true in single mode and false in multi mode.
   */
  readonly closeOnSelect = input<boolean | null>(null);

  /**
   * @component pixel-select
   * Preferred open direction for panel placement.
   */
  readonly openDirection = input<PixelSelectOpenDirection>('auto');

  /**
   * @component pixel-select
   * Page-scroll behaviour while the dropdown panel is open:
   * - `block` (default) — freeze page scrolling by swallowing wheel/touch input outside the panel.
   *   The page scrollbar (thumb included) is untouched, so there is no layout shift or flicker;
   *   the options list still scrolls normally. Scrolls that bypass input blocking (dragging the
   *   scrollbar itself) keep the panel glued to the field.
   * - `close` — dismiss the panel as soon as the page scrolls; scrolling inside the panel's own
   *   options list never dismisses it
   * - `reposition` — keep the panel open and glued to the field while the page scrolls
   *   (Angular Material's default for select)
   */
  readonly scrollBehavior = input<PixelSelectScrollBehavior>('block');

  /**
   * @component pixel-select
   * Forces the `block` scroll behaviour while the dropdown panel is open.
   * @deprecated Use `scrollBehavior="block"` instead; this input wins over `scrollBehavior` when set.
   */
  readonly lockScroll = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-select
   * Panel width strategy.
   */
  readonly panelWidth = input<PixelSelectPanelWidthMode>('match-trigger');

  /**
   * @component pixel-select
   * Custom CSS width used when `panelWidth` is custom.
   */
  readonly panelCustomWidth = input('20rem');

  /**
   * @component pixel-select
   * Empty state message shown when options are absent.
   */
  readonly emptyStateMessage = input('No options available.');

  /**
   * @component pixel-select
   * No-result message shown for search misses.
   */
  readonly noResultMessage = input('No matching results.');

  /**
   * @component pixel-select
   * Select-all row text.
   */
  readonly selectAllLabel = input('Select all');

  /**
   * @component pixel-select
   * Unselect-all row text.
   */
  readonly unselectAllLabel = input('Unselect all');

  /**
   * @component pixel-select
   * Optional autocomplete/searchbox placeholder.
   */
  readonly autocompletePlaceholder = input('Search options');

  /**
   * @component pixel-select
   * Toggles highlighted search matches in option labels.
   */
  readonly highlightSearchMatches = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-select
   * Custom formatter for trigger and tag labels.
   */
  readonly displayWith = input<(option: PixelSelectOption) => string>(defaultDisplayWith);

  /**
   * @component pixel-select
   * Compare function for object values.
   */
  readonly compareWith = input<(a: unknown, b: unknown) => boolean>((a, b) => Object.is(a, b));

  /**
   * @component pixel-select
   * Accessible name override when visible label is hidden.
   */
  readonly ariaLabel = input('');

  /**
   * @type {string}
   * @default 'Select option'
   * @description Fallback trigger accessible name when `ariaLabel` and a visible label are absent.
   */
  readonly defaultAriaLabel = input('Select option');

  /**
   * @type {string}
   * @default 'Options'
   * @description Default group header when `option.group` is empty and `grouped` is true.
   */
  readonly defaultGroupLabel = input('Options');

  /**
   * @type {string}
   * @default 'Filter options'
   * @description Accessible name for the panel search field.
   */
  readonly searchAriaLabel = input('Filter options');

  /**
   * @type {string}
   * @default 'Searching…'
   * @description Status text while server search is in progress.
   */
  readonly searchingLabel = input('Searching…');

  /**
   * @type {string}
   * @default 'Loading more…'
   * @description Status text while infinite-scroll loads the next page.
   */
  readonly loadingMoreLabel = input('Loading more…');

  /**
   * @type {string}
   * @default '{n} selected'
   * @description Trigger text for multiple mode when `showSelectedCount` is on. `{n}` is the count.
   */
  readonly selectedCountLabel = input('{n} selected');

  /**
   * @component pixel-select
   * Additional ids merged into aria-describedby.
   */
  readonly ariaDescribedBy = input('');

  /**
   * @component pixel-select
   * Additional classes appended to component root.
   */
  readonly className = input('');

  /**
   * @component pixel-select
   * Structured class bindings for root.
   */
  readonly classList = input<PixelSelectClassValue>('');

  /**
   * @component pixel-select
   * Preserves panel scroll position when options append.
   */
  readonly preserveScrollOnAppend = input(true, { transform: booleanAttribute });

  readonly valueChange = output<PixelSelectValue>();
  readonly selectionChange = output<PixelSelectSelectionChange>();
  readonly searchChange = output<string>();
  readonly openChange = output<boolean>();
  readonly focusChange = output<boolean>();
  readonly blurChange = output<boolean>();
  readonly clearClick = output<void>();
  readonly removeTag = output<unknown>();
  readonly loadMore = output<{ query: string; selectedCount: number }>();
  readonly optionClick = output<PixelSelectOption>();
  readonly panelScrollEnd = output<void>();
  readonly enterPress = output<KeyboardEvent>();

  protected readonly selectId = computed(() => this.id().trim() || this.fallbackId);
  protected readonly isMultiple = computed(() => this.mode() === 'multiple');
  /** Resolved panel edge for animation styling, from the overlay's chosen placement. */
  protected readonly effectivePanelEdge = computed((): 'top' | 'bottom' => {
    const d = this.openDirection();
    if (d === 'top') {
      return 'top';
    }
    if (d === 'bottom') {
      return 'bottom';
    }
    return this.overlay.position()?.edge ?? 'bottom';
  });
  /** Trigger / field chrome uses “focused” look while open even if focus moved into the panel (e.g. multi checkboxes). */
  protected readonly showFocusedChrome = computed(() => this.isFocused() || this.isOpen());
  protected readonly inputSize = computed((): PixelInputSize => this.size());
  protected readonly showRequiredIndicator = computed(
    () => this.required() || this.isControlRequired(this.resolveFormControl()),
  );

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

  protected readonly customClassList = computed(() => {
    return [this.className().trim(), normalizeClassValue(this.classList())]
      .filter(Boolean)
      .join(' ')
      .trim();
  });
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly isReadonly = computed(() => this.readonly());
  protected readonly selectedCount = computed(() => this.selectedValues().length);
  protected readonly hasSelection = computed(() => this.selectedCount() > 0);
  /** Remove icon on each tag (multi-select + chips only). */
  protected readonly showTagRemove = computed(
    () =>
      this.isMultiple() &&
      this.showTags() &&
      this.clearable() &&
      !this.isDisabled() &&
      !this.isReadonly(),
  );
  /** Maps the select density to a compact `pixel-chip` tag size. */
  protected readonly tagChipSize = computed<'xs' | 'sm'>(() =>
    this.size() === 'md' || this.size() === 'lg' ? 'sm' : 'xs',
  );
  protected readonly effectiveCloseOnSelect = computed(() => {
    const explicit = this.closeOnSelect();
    if (explicit !== null) {
      return explicit;
    }
    return !this.isMultiple();
  });
  protected readonly triggerAriaLabel = computed(() => {
    const explicit = this.ariaLabel().trim();
    if (explicit) {
      return explicit;
    }
    if (this.labelPosition() === 'hidden' && this.label().trim()) {
      return null;
    }
    return this.defaultAriaLabel();
  });
  protected readonly helperLines = computed(() => {
    const text = this.helperText();
    if (!text.trim()) {
      return [];
    }
    return text.split('\n').map((line) => line.trim());
  });

  protected readonly showHelperHint = computed(
    () => this.helperLines().length > 0 && !this.controlShowsError(),
  );

  protected readonly resolvedValidationMessage = computed(() => {
    if (!this.controlShowsError()) {
      return '';
    }
    const errors = this.controlValidationErrors();
    if (!errors) {
      return '';
    }
    return resolveValidationMessage(errors, this.validationMessages());
  });

  protected readonly describedBy = computed(() => {
    const ids = [
      this.ariaDescribedBy().trim(),
      this.resolvedValidationMessage().trim() ? this.errorId : '',
      this.showHelperHint() ? this.helperId : '',
    ];
    return ids.filter(Boolean).join(' ').trim();
  });

  protected readonly showFieldMeta = computed(
    () =>
      this.resolvedValidationMessage().trim().length > 0 || this.showHelperHint(),
  );

  /**
   * Merges explicit `state`, async loading, and reactive-form invalid styling (like `pixel-input`).
   */
  protected readonly visualState = computed((): PixelSelectVisualState => {
    if (this.loading() || this.state() === 'loading') {
      return 'loading';
    }
    if (this.controlShowsError()) {
      return 'error';
    }
    return this.state();
  });
  protected readonly selectedOptions = computed(() => {
    const values = this.selectedValues();
    const all = this.options();
    const cache = this.selectedOptionsCache();
    const cmp = this.compareWith();

    return values
      .map((val) =>
        all.find((opt) => cmp(val, opt.value))
        ?? cache.find((opt) => cmp(val, opt.value))
        ?? null,
      )
      .filter((opt): opt is PixelSelectOption => opt !== null);
  });
  /** Avatar shown in the single-select trigger: the selected option when it carries avatar media. */
  protected readonly triggerAvatarOption = computed(() => {
    if (this.isMultiple()) {
      return null;
    }
    const option = this.selectedOptions()[0] ?? null;
    return option && this.optionHasAvatar(option) ? option : null;
  });
  /** Pills actually rendered in the trigger (rest summarized as `+N more` when width-constrained). */
  protected readonly visibleTagOptions = computed(() => {
    const all = this.selectedOptions();
    const cap = this.measuredVisibleTagCount();
    if (cap < 0 || cap >= all.length) {
      return all;
    }
    return all.slice(0, cap);
  });
  protected readonly overflowTagCount = computed(() => {
    const total = this.selectedOptions().length;
    const shown = this.visibleTagOptions().length;
    return Math.max(0, total - shown);
  });
  protected readonly overflowTagsSummary = computed(() => {
    const n = this.overflowTagCount();
    if (n <= 0) {
      return '';
    }
    return this.moreTagsLabel().replaceAll('{count}', String(n));
  });

  private readonly scheduleTagMeasureOnDeps = effect(() => {
    this.selectedOptions();
    this.isMultiple();
    this.showTags();
    this.showTagRemove();
    this.moreTagsLabel();
    this.displayWith();
    untracked(() => this.scheduleTagLayoutMeasure());
  });

  private readonly tagResizeBind = effect((onCleanup) => {
    const el = this.triggerContentRef()?.nativeElement;
    if (!el || typeof ResizeObserver === 'undefined') {
      return;
    }
    untracked(() => this.scheduleTagLayoutMeasure());
    const ro = new ResizeObserver(() => {
      untracked(() => this.scheduleTagLayoutMeasure());
    });
    ro.observe(el);
    onCleanup(() => ro.disconnect());
  });

  protected readonly selectedLabels = computed(() =>
    this.selectedOptions().map((option) => this.displayWith()(option)),
  );
  protected readonly triggerText = computed(() => {
    if (this.selectedCount() === 0) {
      return this.placeholder();
    }

    if (this.isMultiple()) {
      if (this.showSelectedCount()) {
        return formatPixelLabel(this.selectedCountLabel(), { n: this.selectedCount() });
      }
      return this.selectedLabels().join(', ');
    }
    return this.selectedLabels()[0] ?? this.placeholder();
  });
  protected readonly filteredOptions = computed(() => {
    const all = this.options();
    const query = this.searchText().trim().toLowerCase();
    if (!this.searchable() || !query || this.serverSearch()) {
      return all;
    }
    return all.filter((option) => {
      const text = `${option.label} ${option.subtitle ?? ''} ${option.meta ?? ''}`.toLowerCase();
      return text.includes(query);
    });
  });
  protected readonly groupedOptions = computed(() => {
    if (!this.grouped()) {
      return [
        {
          id: 'all',
          label: '',
          options: this.filteredOptions(),
        },
      ];
    }

    if (this.groups().length > 0) {
      return this.groups()
        .map((group) => ({
          id: group.id,
          label: group.label,
          options: group.options.filter((candidate) =>
            this.filteredOptions().some((opt) => this.compareWith()(opt.value, candidate.value)),
          ),
        }))
        .filter((group) => group.options.length > 0);
    }

    const byGroup = new Map<string, PixelSelectOption[]>();
    for (const option of this.filteredOptions()) {
      const key = option.group?.trim() || this.defaultGroupLabel();
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
  protected readonly flatVisibleOptions = computed(() =>
    this.groupedOptions().flatMap((group) => group.options).filter((option) => !option.disabled),
  );
  protected readonly activeOption = computed(() => this.flatVisibleOptions()[this.focusedIndex()] ?? null);
  protected readonly panelEmpty = computed(() => this.groupedOptions().every((group) => group.options.length === 0));
  protected readonly noResult = computed(
    () => this.searchText().trim().length > 0 && this.panelEmpty(),
  );
  /** Maps `panelWidth` to the overlay's width strategy (the panel is body-appended, not in-flow). */
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
  protected readonly listboxAriaMulti = computed(() => (this.isMultiple() ? 'true' : null));
  protected readonly listboxAriaRequired = computed(() => (this.required() ? 'true' : 'false'));
  protected readonly listboxAriaInvalid = computed(() =>
    this.controlShowsError() || this.state() === 'error' ? 'true' : 'false',
  );
  protected readonly listboxAriaDisabled = computed(() => (this.isDisabled() ? 'true' : 'false'));
  protected readonly showSelectAllRow = computed(
    () => this.isMultiple() && this.showSelectAll() && this.filteredOptions().length > 0,
  );
  protected readonly allSelected = computed(
    () =>
      this.filteredOptions().length > 0 &&
      this.filteredOptions().every((option) => this.isValueSelected(option.value)),
  );
  protected readonly selectAllIndeterminate = computed(() => {
    const enabled = this.filteredOptions().filter((o) => !o.disabled);
    if (enabled.length === 0) {
      return false;
    }
    const selectedCount = enabled.filter((o) => this.isValueSelected(o.value)).length;
    return selectedCount > 0 && selectedCount < enabled.length;
  });
  protected readonly selectAllText = computed(() =>
    this.allSelected() ? this.unselectAllLabel() : this.selectAllLabel(),
  );

  writeValue(value: PixelSelectValue): void {
    this.setSelectionFromExternal(value);
  }

  registerOnChange(fn: (value: PixelSelectValue) => void): void {
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
    const value = control.value as PixelSelectValue;
    if (this.isEmptySelection(value)) {
      return { required: true };
    }
    return null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  protected onTriggerClick(): void {
    if (this.isDisabled()) {
      return;
    }
    this.setOpenState(!this.isOpen());
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) {
      return;
    }

    // Combobox pattern (same idea as Angular Material select): focus stays on the trigger while
    // aria-activedescendant points at the active option; listbox keys must be handled here when open.
    if (this.isOpen()) {
      if (this.handleOpenListboxKeydown(event)) {
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.enterPress.emit(event);
        return;
      }
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.enterPress.emit(event);
      this.setOpenState(true);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!this.isOpen()) {
        this.setOpenState(true);
        return;
      }
      this.focusNextOption(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.isOpen()) {
        const opts = this.flatVisibleOptions();
        this.setOpenState(true, opts.length > 0 ? opts.length - 1 : -1);
        return;
      }
      this.focusNextOption(-1);
      return;
    }

    if (event.key === 'Backspace' && this.isMultiple() && this.showTags() && this.searchText() === '') {
      const latest = this.selectedValues().at(-1);
      if (latest !== undefined) {
        this.removeValue(latest, 'keyboard');
      }
    }
  }

  protected onFocus(): void {
    this.isFocused.set(true);
    this.focusChange.emit(true);
  }

  protected onBlur(): void {
    this.isFocused.set(false);
    if (this.isOpen()) {
      return;
    }
    this.onTouched();
    this.blurChange.emit(true);
  }

  protected onSearchValueChange(value: string): void {
    this.searchText.set(value);
    this.focusedIndex.set(0);
    this.scheduleMeasureOptionsViewportBlockSize();
    this.scheduleScrollActiveOptionIntoView();
  }

  protected onPanelKeydown(event: KeyboardEvent): void {
    if (!this.isOpen()) {
      return;
    }
    if (this.handleOpenListboxKeydown(event)) {
      return;
    }
  }

  protected onPanelScroll(event: Event): void {
    const target = event.target as HTMLElement;
    this.lastScrollTop.set(target.scrollTop);
    if (!this.infiniteScroll() || !this.hasMore()) {
      return;
    }
    const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 24;
    if (nearBottom) {
      this.panelScrollEnd.emit();
    }
  }

  protected onOptionClick(option: PixelSelectOption): void {
    this.optionClick.emit(option);
    this.toggleOption(option, 'mouse');
  }

  protected onRemoveTag(value: unknown, event: MouseEvent | KeyboardEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.removeValue(value, 'mouse');
  }

  protected onSelectAllCheckedChange(checked: boolean): void {
    if (!this.isMultiple() || this.isReadonly() || this.isDisabled()) {
      return;
    }

    const compare = this.compareWith();
    const filteredEnabled = this.filteredOptions().filter((option) => !option.disabled);
    const current = this.selectedValues();

    if (!checked) {
      // Unselect only options in the current filter; keep selections outside the search.
      const next = current.filter(
        (selected) =>
          !filteredEnabled.some((option) => compare(selected, option.value)),
      );
      this.selectedValues.set(next);
      this.propagateSelection(null, null, 'programmatic');
      return;
    }

    // Union: add all filtered enabled options; retain prior selections.
    const next = [...current];
    for (const option of filteredEnabled) {
      if (!next.some((selected) => compare(selected, option.value))) {
        next.push(option.value);
      }
    }
    this.selectedValues.set(next);
    this.propagateSelection(null, null, 'programmatic');
  }

  protected hasTriggerLabel(): boolean {
    return Boolean(this.label().trim()) && this.labelPosition() !== 'hidden';
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

  private isEmptySelection(value: PixelSelectValue): boolean {
    if (this.isMultiple()) {
      return !Array.isArray(value) || value.length === 0;
    }
    return value === null || value === undefined;
  }

  protected isOptionSelected(option: PixelSelectOption): boolean {
    return this.isValueSelected(option.value);
  }

  protected isValueSelected(value: unknown): boolean {
    return this.selectedValues().some((selected) => this.compareWith()(selected, value));
  }

  protected optionAriaSelected(option: PixelSelectOption): 'true' | 'false' {
    return this.isOptionSelected(option) ? 'true' : 'false';
  }

  protected optionId(index: number): string {
    return `${this.selectId()}-option-${index}`;
  }

  /** Index in the keyboard-navigable (enabled-only) flat list, or -1 if the option is disabled. */
  protected enabledFlatIndex(option: PixelSelectOption): number {
    return this.flatVisibleOptions().findIndex((o) => this.compareWith()(o.value, option.value));
  }

  /** Stable DOM id for a row: matches `optionId(i)` when the row is enabled (for aria-activedescendant). */
  protected optionDomId(option: PixelSelectOption, groupIndex: number, optionIndexInGroup: number): string {
    const vi = this.enabledFlatIndex(option);
    if (vi >= 0) {
      return this.optionId(vi);
    }
    return `${this.selectId()}-option-disabled-${groupIndex}-${optionIndexInGroup}`;
  }

  protected groupHeaderId(groupId: string): string {
    return `${this.selectId()}-group-${groupId}`;
  }

  protected optionsViewportBlockSizePx(): number | null {
    return this.optionsViewportBlockSize();
  }

  protected optionText(option: PixelSelectOption): string {
    return this.displayWith()(option);
  }

  /** True when an option carries any avatar media (image, initials text, or icon). */
  protected optionHasAvatar(option: PixelSelectOption): boolean {
    return Boolean(option.imageSrc || option.avatarText || option.icon);
  }

  protected optionLabelParts(label: string): readonly string[] {
    const query = this.searchText().trim();
    if (!this.highlightSearchMatches() || !query) {
      return [label];
    }
    const lower = label.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lower.indexOf(lowerQuery);
    if (index < 0) {
      return [label];
    }
    return [
      label.slice(0, index),
      label.slice(index, index + query.length),
      label.slice(index + query.length),
    ];
  }

  private scheduleTagLayoutMeasure(): void {
    if (this.tagMeasureRaf !== 0) {
      cancelAnimationFrame(this.tagMeasureRaf);
    }
    this.tagMeasureRaf = requestAnimationFrame(() => {
      this.tagMeasureRaf = 0;
      this.runTagLayoutMeasure();
    });
  }

  private runTagLayoutMeasure(): void {
    const show =
      this.isMultiple() && this.showTags() && this.selectedOptions().length > 0;
    if (!show) {
      this.measuredVisibleTagCount.set(-1);
      return;
    }

    const content = this.triggerContentRef()?.nativeElement;
    const row = this.tagMeasureRowRef()?.nativeElement;
    const moreEl = this.moreChipMeasureRef()?.nativeElement;
    if (!content || !row || !moreEl) {
      return;
    }

    const available = content.getBoundingClientRect().width;
    if (!Number.isFinite(available) || available < 8) {
      this.measuredVisibleTagCount.set(-1);
      return;
    }

    row.style.maxWidth = `${available}px`;
    void row.offsetWidth;

    const n = this.selectedOptions().length;
    const children = row.children;
    if (children.length !== n) {
      this.measuredVisibleTagCount.set(-1);
      return;
    }

    const widths: number[] = [];
    for (let i = 0; i < n; i++) {
      widths.push((children[i] as HTMLElement).getBoundingClientRect().width);
    }
    if (widths.some((w) => !Number.isFinite(w) || w <= 0)) {
      this.measuredVisibleTagCount.set(-1);
      return;
    }

    const gap = this.readFlexGapPx(row);
    const labelTemplate = this.moreTagsLabel();
    const getMoreWidth = (hidden: number): number => {
      if (hidden <= 0) {
        return 0;
      }
      moreEl.textContent = labelTemplate.replaceAll('{count}', String(hidden));
      return moreEl.getBoundingClientRect().width;
    };

    for (let k = n; k >= 0; k--) {
      const hidden = n - k;
      let sum = 0;
      for (let i = 0; i < k; i++) {
        sum += widths[i]!;
      }
      if (k > 1) {
        sum += (k - 1) * gap;
      }
      if (hidden > 0) {
        if (k > 0) {
          sum += gap;
        }
        sum += getMoreWidth(hidden);
      }
      if (sum <= available + 0.5) {
        this.measuredVisibleTagCount.set(k);
        return;
      }
    }

    this.measuredVisibleTagCount.set(0);
  }

  private readFlexGapPx(el: HTMLElement): number {
    const raw = getComputedStyle(el).columnGap || getComputedStyle(el).gap;
    if (!raw || raw === 'normal') {
      return 4;
    }
    const px = parseFloat(raw);
    return Number.isFinite(px) ? px : 4;
  }

  private setSelectionFromExternal(value: PixelSelectValue): void {
    if (this.isMultiple()) {
      if (!Array.isArray(value)) {
        this.selectedValues.set([]);
        return;
      }

      if (value.length > 0 && value.some(isLabeledValue)) {
        const plainValues: unknown[] = [];
        const cacheEntries: PixelSelectOption[] = [];
        for (const item of value) {
          if (isLabeledValue(item)) {
            plainValues.push(item.value);
            cacheEntries.push({ value: item.value, label: item.label });
          } else {
            plainValues.push(item);
          }
        }
        this.selectedValues.set(plainValues);
        if (cacheEntries.length > 0) {
          this.selectedOptionsCache.set(cacheEntries);
        }
        return;
      }

      this.selectedValues.set([...value]);
      return;
    }

    if (Array.isArray(value)) {
      const first = value[0];
      if (first !== undefined && isLabeledValue(first)) {
        this.selectedValues.set([first.value]);
        this.selectedOptionsCache.set([{ value: first.value, label: first.label }]);
        return;
      }
      this.selectedValues.set(value.length > 0 ? [first] : []);
      return;
    }

    if (value === null || value === undefined) {
      this.selectedValues.set([]);
      return;
    }

    if (isLabeledValue(value)) {
      this.selectedValues.set([value.value]);
      this.selectedOptionsCache.set([{ value: value.value, label: value.label }]);
      return;
    }

    this.selectedValues.set([value]);
  }

  /**
   * @param initialFocusedIndex Optional index into `flatVisibleOptions()` when opening (e.g. last item for ArrowUp).
   *   When omitted, focus starts on the first selected visible option if any, else the first option (Material-style).
   */
  private setOpenState(next: boolean, initialFocusedIndex?: number): void {
    if (this.isDisabled()) {
      return;
    }
    const wasOpen = this.isOpen();
    if (next) {
      this.isOpen.set(true);
      const flat = this.flatVisibleOptions();
      let idx: number;
      if (initialFocusedIndex !== undefined) {
        idx = initialFocusedIndex;
      } else {
        idx = this.computeInitialListFocusIndexForOpen();
      }
      if (flat.length === 0) {
        this.focusedIndex.set(-1);
      } else {
        const clamped = idx < 0 ? 0 : Math.min(idx, flat.length - 1);
        this.focusedIndex.set(clamped);
      }
      this.scheduleScrollActiveOptionIntoView();
      this.scheduleAttachOverlay();
    } else {
      // Detach first (restores the panel to its original DOM slot) so the `@if` can tear it down.
      this.overlay.detach();
      this.isOpen.set(false);
      this.searchText.set('');
      if (wasOpen) {
        // Material-style: mark touched when the overlay closes, not when the trigger blurs into the panel.
        this.onTouched();
      }
    }
    this.openChange.emit(next);
  }

  /** Placements tried in priority order, derived from `openDirection`. */
  /** Element to anchor the options panel below the trigger (same role as `pixel-input.overlayOrigin`). */
  overlayOrigin(): HTMLElement | null {
    return this.overlayOriginRef()?.nativeElement ?? null;
  }

  private placements(): OverlayPlacement[] {
    switch (this.openDirection()) {
      case 'top':
        return ['top-start', 'bottom-start'];
      case 'bottom':
        return ['bottom-start', 'top-start'];
      default:
        return ['bottom-start', 'top-start'];
    }
  }

  /** After the panel renders, mount it in the overlay layer anchored to the field. */
  private scheduleAttachOverlay(): void {
    afterNextRender(
      () => {
        if (!this.isOpen()) {
          return;
        }
        const origin = this.overlayOrigin();
        const panel = this.panelRef()?.nativeElement;
        if (!origin || !panel) {
          return;
        }
        // Carry the active theme context to the body-appended panel.
        const themed = origin.closest<HTMLElement>('[data-theme]');
        copyPixelThemeContext(panel, themed);
        this.overlay.attach(origin, panel, {
          preferredPlacements: this.placements(),
          scrollStrategy: this.lockScroll() ? 'block' : this.scrollBehavior(),
          offset: OVERLAY_PANEL_OFFSET,
          viewportMargin: OVERLAY_VIEWPORT_MARGIN,
          width: this.panelWidthStrategy(),
          hasBackdrop: true,
          onOutsidePointer: () => this.setOpenState(false),
          onScrollClose: () => this.setOpenState(false),
        });
      },
      { injector: this.injector },
    );
  }

  /**
   * First index in `flatVisibleOptions()` that matches the current selection, else 0; -1 if the list is empty.
   * Matches Angular Material select: reopening highlights the selected row when it is still in the filtered list.
   */
  private computeInitialListFocusIndexForOpen(): number {
    const flat = this.flatVisibleOptions();
    if (flat.length === 0) {
      return -1;
    }
    for (let i = 0; i < flat.length; i++) {
      if (this.isValueSelected(flat[i].value)) {
        return i;
      }
    }
    return 0;
  }

  private toggleOption(option: PixelSelectOption, source: PixelSelectInteractionSource): void {
    if (option.disabled || this.isDisabled() || this.isReadonly()) {
      return;
    }

    if (!this.isMultiple()) {
      this.selectedValues.set([option.value]);
      this.propagateSelection(option, option.value, source);
      if (this.effectiveCloseOnSelect()) {
        this.setOpenState(false);
      }
      return;
    }

    const exists = this.isValueSelected(option.value);
    if (exists) {
      this.selectedValues.update((values) =>
        values.filter((value) => !this.compareWith()(value, option.value)),
      );
      this.propagateSelection(option, this.selectedValues(), source);
      return;
    }

    const max = this.maxSelectedItems();
    if (max > 0 && this.selectedValues().length >= max) {
      return;
    }
    this.selectedValues.update((values) => [...values, option.value]);
    this.propagateSelection(option, this.selectedValues(), source);
    if (this.effectiveCloseOnSelect()) {
      this.setOpenState(false);
    }
  }

  private removeValue(value: unknown, source: PixelSelectInteractionSource): void {
    if (this.isDisabled() || this.isReadonly()) {
      return;
    }
    this.selectedValues.update((values) =>
      values.filter((item) => !this.compareWith()(item, value)),
    );
    this.removeTag.emit(value);
    const next = this.isMultiple() ? this.selectedValues() : this.selectedValues()[0] ?? null;
    this.propagateSelection(null, next, source);
  }

  private propagateSelection(
    changedOption: PixelSelectOption | null,
    value: PixelSelectValue,
    source: PixelSelectInteractionSource,
  ): void {
    const normalizedValue = this.isMultiple()
      ? [...this.selectedValues()]
      : this.selectedValues()[0] ?? null;
    this.onChange(normalizedValue);
    this.valueChange.emit(normalizedValue);
    this.selectionChange.emit({
      mode: this.mode(),
      value: normalizedValue,
      selectedOptions: this.selectedOptions(),
      changedOption,
      source,
    });
    this.externalValueSnapshot.set(normalizedValue);
    if (this.isEmptySelection(normalizedValue)) {
      this.clearClick.emit();
    }
    void value;
  }

  private focusNextOption(step: 1 | -1): void {
    const options = this.flatVisibleOptions();
    if (options.length === 0) {
      this.focusedIndex.set(-1);
      return;
    }
    const last = options.length - 1;
    const current = this.focusedIndex();
    if (current < 0) {
      this.focusedIndex.set(0);
      this.scheduleScrollActiveOptionIntoView();
      return;
    }
    const next =
      step === 1 ? Math.min(current + 1, last) : Math.max(current - 1, 0);
    if (next !== current) {
      this.focusedIndex.set(next);
      this.scheduleScrollActiveOptionIntoView();
    }
  }

  /**
   * Listbox / Material-style keys while the panel is open (trigger or panel subtree has focus).
   * Returns true if the event was consumed.
   */
  private handleOpenListboxKeydown(event: KeyboardEvent): boolean {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.focusNextOption(1);
      return true;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.focusNextOption(-1);
      return true;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      const n = this.flatVisibleOptions().length;
      this.focusedIndex.set(n > 0 ? 0 : -1);
      this.scheduleScrollActiveOptionIntoView();
      return true;
    }

    if (event.key === 'End') {
      event.preventDefault();
      const n = this.flatVisibleOptions().length;
      this.focusedIndex.set(n > 0 ? n - 1 : -1);
      this.scheduleScrollActiveOptionIntoView();
      return true;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.setOpenState(false);
      this.triggerRef()?.nativeElement.focus();
      return true;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      this.closePanelAndMoveTabFocus(event.shiftKey);
      return true;
    }

    if (event.key === ' ') {
      if (this.isEventFromPanelSearch(event)) {
        return false;
      }
    }

    if (event.key === 'Enter' || event.key === ' ') {
      const active = this.activeOption();
      if (!active || active.disabled) {
        return false;
      }
      event.preventDefault();
      this.enterPress.emit(event);
      this.toggleOption(active, 'keyboard');
      return true;
    }

    return false;
  }

  /** True when the key event originated from the panel filter field (Space must type a space, not select). */
  private isEventFromPanelSearch(event: KeyboardEvent): boolean {
    if (!this.searchable()) {
      return false;
    }
    const target = event.target as Node | null;
    const panel = this.panelRef()?.nativeElement;
    if (!target || !panel || !panel.contains(target)) {
      return false;
    }
    const searchHost = panel.querySelector('.pixel-select__panel-search');
    return Boolean(searchHost?.contains(target));
  }

  /** Close the panel and move focus to the next / previous tab stop (Material-style). */
  private closePanelAndMoveTabFocus(shiftKey: boolean): void {
    const trigger = this.triggerRef()?.nativeElement ?? null;
    this.setOpenState(false);
    if (!trigger || typeof document === 'undefined') {
      return;
    }
    afterNextRender(
      () => {
        const tabbable = this.collectTabbableElementsPreorder(document.body);
        const idx = tabbable.indexOf(trigger);
        if (idx < 0) {
          return;
        }
        const next = tabbable[shiftKey ? idx - 1 : idx + 1];
        next?.focus();
      },
      { injector: this.injector },
    );
  }

  /** Depth-first preorder list; matches common DOM tab order when tabindex is not customized. */
  private collectTabbableElementsPreorder(root: HTMLElement): HTMLElement[] {
    const out: HTMLElement[] = [];
    const visit = (el: Element): void => {
      if (!(el instanceof HTMLElement)) {
        return;
      }
      if (this.isRoughlyTabbable(el)) {
        out.push(el);
      }
      for (const child of el.children) {
        visit(child);
      }
    };
    visit(root);
    return out;
  }

  private isRoughlyTabbable(el: HTMLElement): boolean {
    if (el.closest('[inert]')) {
      return false;
    }
    if (el.hidden) {
      return false;
    }
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }

    if (el.tabIndex < 0) {
      return false;
    }

    const tag = el.tagName;
    if (tag === 'BUTTON' || tag === 'SELECT' || tag === 'TEXTAREA') {
      return !(el as HTMLButtonElement).disabled;
    }
    if (tag === 'INPUT') {
      const inp = el as HTMLInputElement;
      return !inp.disabled && inp.type !== 'hidden';
    }
    if (tag === 'A') {
      return (el as HTMLAnchorElement).hasAttribute('href');
    }

    return el.hasAttribute('tabindex') && el.tabIndex >= 0;
  }

  private scheduleMeasureOptionsViewportBlockSize(): void {
    afterNextRender(
      () => {
        this.measureOptionsViewportBlockSize();
        requestAnimationFrame(() => this.measureOptionsViewportBlockSize());
        this.connectOptionsViewportMeasureObserver();
      },
      { injector: this.injector },
    );
  }

  /** Sum rendered heights for up to N enabled options (plus group headers in view). */
  private measureOptionsViewportBlockSize(): void {
    const scroll = this.optionsScrollRef()?.nativeElement;
    if (!scroll) {
      this.optionsViewportBlockSize.set(null);
      return;
    }

    const flat = this.flatVisibleOptions();
    if (flat.length === 0) {
      const status = scroll.querySelector<HTMLElement>(
        '.pixel-select__empty, .pixel-select__status-row',
      );
      this.optionsViewportBlockSize.set(status?.offsetHeight ?? null);
      return;
    }

    const targetCount = Math.min(Math.max(1, this.visibleOptionCount()), flat.length);
    const groups = this.groupedOptions();
    let accumulated = 0;
    let optionsCounted = 0;

    outer: for (let gi = 0; gi < groups.length; gi++) {
      const group = groups[gi];
      if (group.label) {
        const header = scroll.querySelector<HTMLElement>(`#${this.groupHeaderId(group.id)}`);
        if (header) {
          accumulated += header.offsetHeight;
        }
      }
      for (let oi = 0; oi < group.options.length; oi++) {
        const option = group.options[oi];
        if (option.disabled) {
          continue;
        }
        const row = document.getElementById(this.optionDomId(option, gi, oi));
        if (row) {
          accumulated += row.offsetHeight;
          optionsCounted++;
        }
        if (optionsCounted >= targetCount) {
          break outer;
        }
      }
    }

    const panel = this.panelRef()?.nativeElement;
    let size = accumulated;
    if (panel && size > 0) {
      const panelMaxPx = parseFloat(getComputedStyle(panel).maxBlockSize);
      const header = panel.querySelector<HTMLElement>('.pixel-select__panel-header');
      const headerHeight = header?.offsetHeight ?? 0;
      if (Number.isFinite(panelMaxPx) && panelMaxPx > 0) {
        size = Math.min(size, Math.max(0, panelMaxPx - headerHeight));
      }
    }

    this.optionsViewportBlockSize.set(size > 0 ? size : null);
  }

  private connectOptionsViewportMeasureObserver(): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    this.disconnectOptionsViewportMeasureObserver();
    const scroll = this.optionsScrollRef()?.nativeElement;
    if (!scroll) {
      return;
    }
    this.optionsViewportMeasureObserver = new ResizeObserver(() => {
      this.measureOptionsViewportBlockSize();
    });
    this.optionsViewportMeasureObserver.observe(scroll);
  }

  private disconnectOptionsViewportMeasureObserver(): void {
    this.optionsViewportMeasureObserver?.disconnect();
    this.optionsViewportMeasureObserver = null;
  }

  /** After the active option index changes, keep the highlighted row in view (same idea as Angular Material select). */
  private scheduleScrollActiveOptionIntoView(): void {
    afterNextRender(
      () => {
        this.scrollActiveOptionIntoView();
      },
      { injector: this.injector },
    );
  }

  private scrollActiveOptionIntoView(): void {
    const scroll = this.optionsScrollRef()?.nativeElement;
    const idx = this.focusedIndex();
    if (!scroll || idx < 0) {
      return;
    }
    const id = this.optionId(idx);
    const activeEl = document.getElementById(id);
    if (!activeEl || !scroll.contains(activeEl)) {
      return;
    }
    // `scrollIntoView` is absent in some non-browser DOMs (jsdom/SSR); skip when unavailable.
    activeEl.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }
}
