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
} from '@angular/forms';
import { merge } from 'rxjs';
import PixelInputComponent from '../pixel-input/pixel-input';
import PixelButtonComponent from '../pixel-button/pixel-button';
import PixelClockDialComponent from './pixel-clock-dial';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';
import {
  ConnectedOverlay,
  OVERLAY_PANEL_OFFSET,
  OVERLAY_VIEWPORT_MARGIN,
  type OverlayPlacement,
} from '../shared/overlay/connected-overlay';
import { copyPixelThemeContext } from '../theme/pixel-theme';
import {
  type PixelTimepickerChange,
  type PixelTimepickerFormat,
  type PixelTimepickerLabelPosition,
  type PixelTimepickerOpenDirection,
  type PixelTimepickerSize,
  type PixelTimepickerValidationMessages,
  type PixelTimepickerVariant,
  type PixelTimepickerView,
  type PixelTimeParts,
  type PixelTimepickerLabels,
  formatDisplayTime,
  formatTime,
  mergePixelTimepickerLabels,
  parseTime,
} from './pixel-timepicker.types';

let nextTimepickerId = 0;

/**
 * Time picker supporting both a compact text-input (input) and a full clock-dial (clock) variant.
 *
 * - **basic** — Large interactive hour / minute / period segments in the panel (keyboard-friendly).
 * - **advanced** — Material Design M2-style circular clock dial: tap/drag to pick hour then minute.
 *
 * Value is always a canonical `"HH:mm"` string (24-hour), identical to native `<input type="time">`.
 * Implements `ControlValueAccessor` + `Validator` for seamless Angular form integration.
 *
 * @example Basic
 * ```html
 * <pixel-timepicker label="Meeting time" [(value)]="time" />
 * ```
 * @example Advanced
 * ```html
 * <pixel-timepicker label="Alarm" variant="clock" format="12" [(value)]="alarm" />
 * ```
 */
@Component({
  selector: 'pixel-timepicker',
  imports: [PixelInputComponent, PixelButtonComponent, PixelClockDialComponent, PixelSkeletonComponent],
  templateUrl: './pixel-timepicker.html',
  styleUrl: './pixel-timepicker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-timepicker-host',
    '[attr.data-size]': 'size()',
    '[attr.data-variant]': 'variant()',
  },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PixelTimepickerComponent), multi: true },
    { provide: NG_VALIDATORS,     useExisting: forwardRef(() => PixelTimepickerComponent), multi: true },
  ],
})
export default class PixelTimepickerComponent implements ControlValueAccessor, Validator {
  protected readonly fallbackId = `pixel-timepicker-${++nextTimepickerId}`;
  protected readonly panelId    = `${this.fallbackId}-panel`;
  protected readonly helperId   = `${this.fallbackId}-helper`;
  private readonly injector   = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly overlay    = new ConnectedOverlay();

  constructor() {
    // Matches pixel-datepicker: destroy overlay with the component.
    this.destroyRef.onDestroy(() => this.overlay.destroy());
  }

  protected readonly inputRef  = viewChild(PixelInputComponent);
  protected readonly panelRef  = viewChild<ElementRef<HTMLElement>>('panelRef');
  protected readonly liveRef   = viewChild<ElementRef<HTMLElement>>('liveRef');

  protected readonly isOpen       = signal(false);
  protected readonly currentView  = signal<PixelTimepickerView>('hour');
  protected readonly isFocused    = signal(false);

  /** Internal parsed time state. */
  protected readonly internalHours   = signal(12);
  protected readonly internalMinutes = signal(0);
  protected readonly internalPeriod  = signal<'AM' | 'PM'>('AM');

  /**
   * Reactive store for the last confirmed canonical value.
   * Used in displayValue so the input field updates when a form control value
   * changes — resolveFormControl()?.value is a plain JS property, not a signal,
   * so reading it inside a computed() doesn't create a reactive dependency.
   */
  private readonly committedCanonical = signal('');

  private onChange: (v: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private onValidatorChange: () => void = () => undefined;

  private readonly formDisabled          = signal(false);
  private readonly controlShowsError     = signal(false);
  private readonly controlValidationErrors = signal<ValidationErrors | null>(null);

  // ── Inputs ────────────────────────────────────────────────────────────────

  /** Canonical `"HH:mm"` value (24-hour). Two-way bindable. */
  readonly value = input<string>('');

  /** `basic` = segment panel; `advanced` = clock dial. */
  readonly variant = input<PixelTimepickerVariant>('input');

  /**
   * Hour cycle to use. `'12'` = AM/PM; `'24'` = 24-hour.
   * When left at the default (`undefined`), the locale-aware hour cycle is derived from
   * `Intl.DateTimeFormat(locale).resolvedOptions().hour12`: `false` → `'24'`, otherwise `'12'`.
   * Pass `format="12"` or `format="24"` to override locale.
   *
   * @type {'12' | '24' | undefined}
   * @default undefined → locale-derived
   */
  readonly format = input<PixelTimepickerFormat | undefined>(undefined);

  /**
   * BCP-47 locale tag used to derive the default hour cycle when `format` is not set.
   * Falls back to the browser default when not provided.
   *
   * @type {string | undefined}
   * @default undefined
   */
  readonly locale = input<string | undefined>(undefined);

  /**
   * Resolved hour cycle: explicit `format` input wins; otherwise derived from `Intl` for the
   * given locale. Falls back to `'12'` when `Intl` resolution fails.
   */
  protected readonly resolvedFormat = computed<PixelTimepickerFormat>(() => {
    const explicit = this.format();
    if (explicit != null) {
      return explicit;
    }
    try {
      const opts = new Intl.DateTimeFormat(this.locale(), { hour: 'numeric' }).resolvedOptions();
      return opts.hour12 === false ? '24' : '12';
    } catch {
      return '12';
    }
  });

  /** Density scale. */
  readonly size = input<PixelTimepickerSize>('md');

  /** Visible label text. */
  readonly label = input('');

  /** Label layout relative to the field. */
  readonly labelPosition = input<PixelTimepickerLabelPosition>('top');

  /** Placeholder text shown when empty. */
  readonly placeholder = input('');

  /** Helper / hint text rendered below the field. */
  readonly helperText = input('');

  /** Marks the control as required for validation. */
  readonly required = input(false, { transform: booleanAttribute });

  /** Disables all interaction. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Preferred open direction for the panel. */
  readonly openDirection = input<PixelTimepickerOpenDirection>('auto');

  /** Validation error messages by Angular error code. */
  readonly validationMessages = input<PixelTimepickerValidationMessages>({});

  /** Show skeleton placeholder while loading. */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  /**
   * Partial i18n overrides for spinner / dial ARIA names and action buttons.
   *
   * @type {Partial<PixelTimepickerLabels>}
   * @default {}
   */
  readonly labels = input<Partial<PixelTimepickerLabels>>({});

  // ── Outputs ───────────────────────────────────────────────────────────────

  /** Emits on every confirmed change. */
  readonly valueChange = output<string>();
  /** Emits when the panel opens or closes. */
  readonly openChange  = output<boolean>();

  // ── Effects ───────────────────────────────────────────────────────────────

  private readonly syncExternalValue = effect(() => {
    const v = this.value();
    untracked(() => {
      if (this.resolveFormControl()) return;
      this.applyValue(v);
      this.committedCanonical.set(v);
    });
  });

  private readonly syncControlErrors = effect((onCleanup) => {
    const control = untracked(() => this.resolveFormControl());
    if (!control) {
      untracked(() => { this.controlShowsError.set(false); this.controlValidationErrors.set(null); });
      return;
    }
    const sync = () => {
      this.controlValidationErrors.set(control.errors);
      this.controlShowsError.set(Boolean(control.invalid && (control.touched || control.dirty)));
    };
    sync();
    const sub = merge(control.statusChanges, control.valueChanges, control.events).subscribe(sync);
    onCleanup(() => sub.unsubscribe());
  });

  // ── Computed ──────────────────────────────────────────────────────────────

  protected readonly isDisabled         = computed(() => this.disabled() || this.formDisabled());
  /** Resolved panel edge — lets the panel flip its border-radius when opening upward. */
  protected readonly effectivePanelEdge = computed((): 'top' | 'bottom' =>
    this.overlay.position()?.edge ?? 'bottom',
  );
  protected readonly is12h       = computed(() => this.resolvedFormat() === '12');
  protected readonly showLabel   = computed(() => !!this.label().trim() && this.labelPosition() !== 'hidden');
  protected readonly l = computed(() => mergePixelTimepickerLabels(this.labels()));

  protected readonly displayValue = computed(() => {
    // committedCanonical is a signal — reactive when commitCurrent() or writeValue() runs.
    // this.value() covers standalone [(value)] binding.
    const raw = this.committedCanonical() || this.value();
    if (!raw) return '';
    const parts = parseTime(raw);
    if (!parts) return '';
    return formatDisplayTime(parts, this.resolvedFormat());
  });

  protected readonly currentParts = computed((): PixelTimeParts | null => {
    const raw = this.committedCanonical() || this.value();
    return parseTime(raw) ?? null;
  });

  protected readonly resolvedValidationMessage = computed(() => {
    if (!this.controlShowsError()) return '';
    const errors = this.controlValidationErrors();
    if (!errors) return '';
    const msgs = this.validationMessages();
    for (const k of Object.keys(errors)) { const m = msgs[k]?.trim(); if (m) return m; }
    return '';
  });

  protected readonly hasError = computed(() => this.controlShowsError());

  protected readonly hourDisplay = computed(() => {
    const h = this.internalHours();
    if (this.is12h()) return String(h % 12 || 12).padStart(2, '0');
    return String(h).padStart(2, '0');
  });

  protected readonly minuteDisplay = computed(() =>
    String(this.internalMinutes()).padStart(2, '0'),
  );

  protected readonly skeletonHeight = computed(() => {
    switch (this.size()) {
      case 'xs': return '1.5rem';
      case 'sm': return '2rem';
      case 'lg': return '3.125rem';
      default: return '2.75rem';
    }
  });

  // ── ControlValueAccessor ─────────────────────────────────────────────────

  writeValue(value: unknown): void {
    const v = String(value ?? '');
    this.applyValue(v);
    this.committedCanonical.set(v);
  }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.formDisabled.set(d); }

  // ── Validator ─────────────────────────────────────────────────────────────

  validate(control: AbstractControl): ValidationErrors | null {
    const v = control.value as string | null;
    if (this.required() && (!v || !parseTime(v))) return { required: true };
    if (v && !parseTime(v)) return { invalidTime: true };
    return null;
  }

  registerOnValidatorChange(fn: () => void): void { this.onValidatorChange = fn; }

  // ── Panel ─────────────────────────────────────────────────────────────────

  protected toggle(): void {
    if (this.isDisabled()) return;
    this.setOpenState(!this.isOpen());
  }

  protected close(): void { this.setOpenState(false); }

  protected onInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen()) {
      event.preventDefault();
      this.closeAndReturnFocus();
    }
  }

  /** Keydown on the panel itself — Escape closes, Tab is trapped inside. */
  protected onPanelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.closeAndReturnFocus();
      return;
    }
    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  /** Keep Tab / Shift+Tab cycling within the panel. */
  private trapFocus(event: KeyboardEvent): void {
    const panel = this.panelRef()?.nativeElement;
    if (!panel) return;
    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'input:not([disabled]), button:not([disabled]), [tabindex="0"]',
      ),
    ).filter(el => !el.closest('[hidden]') && getComputedStyle(el).display !== 'none');
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /** Focus the first interactive element in the panel. */
  private focusPanelFirstElement(): void {
    const panel = this.panelRef()?.nativeElement;
    if (!panel) return;
    const el = panel.querySelector<HTMLElement>(
      'input:not([disabled]), button:not([disabled]), [tabindex="0"]',
    );
    el?.focus();
  }

  /** Announce the current time to screen readers via the live region. */
  private announceTime(): void {
    const liveEl = this.liveRef()?.nativeElement;
    if (!liveEl) return;
    const raw = this.committedCanonical() || this.value();
    if (!raw) return;
    const parts = parseTime(raw);
    if (!parts) return;
    liveEl.textContent = `Selected time: ${formatDisplayTime(parts, this.resolvedFormat())}`;
  }

  // ── Basic variant: segment interaction ────────────────────────────────────

  protected adjustHour(delta: number): void {
    const max = this.is12h() ? 12 : 23;
    const min = this.is12h() ? 1 : 0;
    const next = this.internalHours() + delta;
    this.internalHours.set(next > max ? min : next < min ? max : next);
  }

  protected adjustMinute(delta: number): void {
    const next = (this.internalMinutes() + delta + 60) % 60;
    this.internalMinutes.set(next);
  }

  protected togglePeriod(): void {
    this.internalPeriod.update(p => p === 'AM' ? 'PM' : 'AM');
  }

  /** Arrow Up/Down on the hour segment input. */
  protected onHourKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp')   { event.preventDefault(); this.adjustHour(1); }
    if (event.key === 'ArrowDown') { event.preventDefault(); this.adjustHour(-1); }
  }

  /** Arrow Up/Down on the minute segment input. */
  protected onMinuteKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp')   { event.preventDefault(); this.adjustMinute(1); }
    if (event.key === 'ArrowDown') { event.preventDefault(); this.adjustMinute(-1); }
  }

  protected onHourInput(raw: string): void {
    const n = parseInt(raw, 10);
    if (isNaN(n)) return;
    const max = this.is12h() ? 12 : 23;
    this.internalHours.set(Math.min(Math.max(this.is12h() ? 1 : 0, n), max));
  }

  protected onMinuteInput(raw: string): void {
    const n = parseInt(raw, 10);
    if (isNaN(n)) return;
    this.internalMinutes.set(Math.min(59, Math.max(0, n)));
  }

  protected confirmBasic(): void {
    this.commitCurrent();
    this.setOpenState(false);
  }

  protected cancelPanel(): void {
    this.restoreFromValue();
    this.setOpenState(false);
  }

  // ── Advanced variant: clock dial ──────────────────────────────────────────

  protected onDialSelectionComplete(): void {
    if (this.currentView() === 'hour') {
      // Auto-advance to minute selection; keep panel open until OK / Cancel.
      this.currentView.set('minute');
    }
    // Minute selection only updates the dial draft — commit happens via confirmBasic() (OK).
  }

  protected setView(view: PixelTimepickerView): void {
    this.currentView.set(view);
  }

  // ── Commit ────────────────────────────────────────────────────────────────

  private commitCurrent(): void {
    let h = this.internalHours();
    const m = this.internalMinutes();
    if (this.is12h()) {
      if (this.internalPeriod() === 'PM' && h < 12) h += 12;
      if (this.internalPeriod() === 'AM' && h === 12) h = 0;
    }
    const canonical = formatTime({ hours: h, minutes: m });
    this.committedCanonical.set(canonical);
    this.onChange(canonical);
    this.valueChange.emit(canonical);
    this.announceTime();
  }

  private closeAndReturnFocus(): void {
    this.setOpenState(false);
    // Return focus to the clock toggle icon inside pixel-input
    const trigger = this.inputRef()?.overlayOrigin()?.closest?.('.pixel-input')
      ?.querySelector<HTMLElement>('.pixel-button');
    trigger?.focus();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private applyValue(raw: string): void {
    const parts = parseTime(raw);
    if (!parts) return;
    const { hours, minutes } = parts;
    if (this.is12h()) {
      this.internalPeriod.set(hours < 12 ? 'AM' : 'PM');
      this.internalHours.set(hours % 12 || 12);
    } else {
      this.internalHours.set(hours);
    }
    this.internalMinutes.set(minutes);
  }

  private restoreFromValue(): void {
    this.applyValue(this.value() || (this.resolveFormControl()?.value as string) || '');
  }

  private setOpenState(open: boolean): void {
    if (open === this.isOpen()) return;
    if (open) {
      this.currentView.set('hour');
      this.restoreFromValue();
      this.isOpen.set(true);
      this.scheduleAttachOverlay();
    } else {
      this.overlay.detach();
      this.isOpen.set(false);
      this.onTouched();
    }
    this.openChange.emit(open);
  }

  private placements(): OverlayPlacement[] {
    return this.openDirection() === 'top'
      ? ['top-start', 'bottom-start']
      : ['bottom-start', 'top-start'];
  }

  private scheduleAttachOverlay(): void {
    afterNextRender(() => {
      if (!this.isOpen()) return;
      const origin = this.inputRef()?.overlayOrigin();
      const panel  = this.panelRef()?.nativeElement;
      if (origin && panel) {
        // Carry active theme context to the body-appended panel (same as pixel-autocomplete).
        const themed = origin.closest<HTMLElement>('[data-theme]');
        copyPixelThemeContext(panel, themed);
        this.overlay.attach(origin, panel, {
          preferredPlacements: this.placements(),
          scrollStrategy: 'reposition',
          offset: OVERLAY_PANEL_OFFSET,
          viewportMargin: OVERLAY_VIEWPORT_MARGIN,
          hasBackdrop: true,
          onOutsidePointer: () => this.setOpenState(false),
          onScrollClose:    () => this.setOpenState(false),
        });
        // Move keyboard focus into the panel once it is visible.
        queueMicrotask(() => this.focusPanelFirstElement());
      }
    }, { injector: this.injector });
  }

  private resolveFormControl(): AbstractControl | null {
    return this.injector.get(NgControl, null, { optional: true, self: true })?.control ?? null;
  }
}
