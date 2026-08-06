import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import PixelAvatarComponent from '../pixel-avatar/pixel-avatar';
import PixelBadgeComponent from '../pixel-badge/pixel-badge';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';
import PixelTooltipDirective from '../pixel-tooltip/pixel-tooltip';

export type PixelChipType =
  | 'default'
  | 'selectable'
  | 'filter'
  | 'input'
  | 'choice'
  | 'action'
  | 'status'
  | 'assist'
  | 'suggestion';

/** Only `selectable`, `filter`, and `choice` enable listbox selection behavior. Others are labels for app logic. */
export const PIXEL_CHIP_SELECTABLE_TYPES = ['selectable', 'filter', 'choice'] as const satisfies readonly PixelChipType[];

export type PixelChipVariant = 'solid' | 'soft' | 'outline';
export type PixelChipSemantic = 'default' | 'success' | 'error' | 'warning' | 'info';
export type PixelChipSize = 'xs' | 'sm' | 'md' | 'lg';

export type PixelChipClassValue =
  | string
  | string[]
  | Record<string, boolean>
  | null
  | undefined;

export interface PixelChipItem {
  id?: string;
  label: string;
  value?: string;
  type?: PixelChipType;
  variant?: PixelChipVariant;
  semantic?: PixelChipSemantic;
  size?: PixelChipSize;
  selected?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  removable?: boolean;
  clickable?: boolean;
  editable?: boolean;
  draggable?: boolean;
  icon?: string;
  prefixIcon?: string;
  suffixIcon?: string;
  avatarUrl?: string;
  avatarText?: string;
  statusIndicator?: 'default' | 'success' | 'error' | 'warning' | 'info';
  count?: number;
  tooltip?: string;
  loading?: boolean;
  truncate?: boolean;
  category?: string;
  className?: string;
}

export interface PixelChipSelectionChange {
  selected: boolean;
  value: string;
  type: PixelChipType;
  source: 'mouse' | 'keyboard' | 'programmatic';
  originalEvent?: MouseEvent | KeyboardEvent;
}

export interface PixelChipRemoveEvent {
  value: string;
  label: string;
  source: 'mouse' | 'keyboard';
  originalEvent: MouseEvent | KeyboardEvent;
}

export interface PixelChipEditEvent {
  value: string;
  label: string;
}

let nextChipId = 0;

function normalizeClassValue(classValue: PixelChipClassValue): string {
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
    .filter(([, enabled]) => enabled)
    .map(([name]) => name)
    .join(' ')
    .trim();
}

@Component({
  selector: 'pixel-chip',
  imports: [
    NgTemplateOutlet,
    PixelAvatarComponent,
    PixelBadgeComponent,
    PixelSkeletonComponent,
    PixelTooltipDirective,
  ],
  templateUrl: './pixel-chip.html',
  styleUrl: './pixel-chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelChipComponent {
  protected readonly fallbackId = `pixel-chip-${++nextChipId}`;
  protected readonly focusVisible = signal(false);
  protected readonly hovered = signal(false);
  protected readonly editing = signal(false);
  protected readonly editValue = signal('');
  protected readonly pressing = signal(false);

  /**
   * @component Stable id for accessibility and testing selectors.
   */
  readonly id = input('');

  /**
   * @component Main text shown inside the chip.
   */
  readonly label = input('');

  /**
   * @component Semantic value used for selection and events.
   */
  readonly value = input('');

  /**
   * @component Chip role / use-case label (Material-like taxonomy).
   * Only `selectable`, `filter`, and `choice` change behavior (toggle selection in a set).
   */
  readonly type = input<PixelChipType>('default');

  /**
   * @component Visual treatment variant (soft, solid, outline).
   */
  readonly variant = input<PixelChipVariant>('soft');

  /**
   * @component Semantic color role (success, error, warning, info).
   */
  readonly semantic = input<PixelChipSemantic>('default');

  /**
   * @component Density size scale.
   */
  readonly size = input<PixelChipSize>('md');

  /**
   * @component Controlled selected state.
   */
  readonly selected = input(false, { transform: booleanAttribute });

  /**
   * @component When true, renders a skeleton pill placeholder instead of the chip content.
   */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  /**
   * @component Hard disabled state.
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * @component Readonly state that blocks mutating actions.
   */
  readonly readonly = input(false, { transform: booleanAttribute });

  /**
   * @component Enables remove affordance and keyboard remove.
   */
  readonly removable = input(false, { transform: booleanAttribute });

  /**
   * @component Enables click behavior when not selectable.
   */
  readonly clickable = input(true, { transform: booleanAttribute });

  /**
   * @component Renders the chip as a non-button host (a `<span>`) so it can be nested inside
   * another interactive element (e.g. the `pixel-select` trigger button) without producing
   * invalid nested-button markup. The remove affordance stays interactive.
   */
  readonly presentational = input(false, { transform: booleanAttribute });

  /**
   * @component Enables inline label editing with Enter/Escape support.
   */
  readonly editable = input(false, { transform: booleanAttribute });

  /**
   * @component Enables draggable behavior and drag outputs.
   */
  readonly draggable = input(false, { transform: booleanAttribute });

  /**
   * @component Optional primary icon glyph.
   */
  readonly icon = input('');

  /**
   * @component Optional icon before label.
   */
  readonly prefixIcon = input('');

  /**
   * @component Optional icon after label.
   */
  readonly suffixIcon = input('');

  /**
   * @component Avatar image URL.
   */
  readonly avatarUrl = input('');

  /**
   * @component Avatar text fallback.
   */
  readonly avatarText = input('');

  /**
   * @component Avatar icon glyph, used as the avatar's final fallback (image → initials → icon)
   * inside the nested `pixel-avatar`. Distinct from `icon`, which is a standalone chip glyph.
   */
  readonly avatarIcon = input('');

  /**
   * @component Optional status indicator dot variant.
   */
  readonly statusIndicator = input<'default' | 'success' | 'error' | 'warning' | 'info'>('default');

  /**
   * @component Optional counter badge value.
   */
  readonly count = input<number | null>(null);

  /**
   * @component Optional tooltip text.
   */
  readonly tooltip = input('');

  /**
   * @component Truncates long label content.
   */
  readonly truncate = input(true, { transform: booleanAttribute });

  /**
   * @component Compact mode for tighter spacing.
   */
  readonly compact = input(false, { transform: booleanAttribute });

  /**
   * @component Loading state with spinner.
   */
  readonly loading = input(false, { transform: booleanAttribute });

  /**
   * @component Optional category token for grouped sets.
   */
  readonly category = input('');

  /**
   * @component Optional aria-label override.
   */
  readonly ariaLabel = input('');

  /**
   * @component Optional aria-describedby ids.
   */
  readonly ariaDescribedBy = input('');

  /**
   * @component Keyboard/tab order value.
   */
  readonly tabIndex = input(0);

  /**
   * @component Auto-focuses chip when rendered.
   */
  readonly autofocus = input(false, { transform: booleanAttribute });

  /**
   * @component Extra static classes for custom styling.
   */
  readonly className = input('');

  /**
   * @component Class map/string support without ngClass.
   */
  readonly ngClass = input<PixelChipClassValue>('');

  readonly chipClick = output<MouseEvent | KeyboardEvent>();
  readonly chipRemove = output<PixelChipRemoveEvent>();
  readonly selectionChange = output<PixelChipSelectionChange>();
  readonly valueChange = output<string>();
  readonly chipEdit = output<PixelChipEditEvent>();
  readonly chipFocus = output<FocusEvent>();
  readonly chipBlur = output<FocusEvent>();
  readonly dragStart = output<DragEvent>();
  readonly dragEnd = output<DragEvent>();

  protected readonly resolvedId = computed(() => this.id().trim() || this.fallbackId);
  protected readonly normalizedValue = computed(() => this.value().trim() || this.label().trim());
  protected readonly isSelected = computed(() => this.selected());
  protected readonly skeletonHeight = computed(() => {
    switch (this.size()) {
      case 'xs': return '1.25rem';
      case 'sm': return '1.375rem';
      case 'lg': return '1.75rem';
      default:   return '1.625rem';
    }
  });

  protected readonly isLoading = computed(() => this.loading());
  protected readonly isDisabled = computed(() => this.disabled() || this.isLoading());
  protected readonly isReadonly = computed(
    () => this.readonly() && !this.disabled() && !this.isLoading(),
  );
  protected readonly isInteractive = computed(
    () => !this.isDisabled() && (this.clickable() || this.isSelectableType() || this.removable()),
  );
  protected readonly ariaRole = computed(() => (this.isSelectableType() ? 'option' : 'button'));
  /** In presentational (`<span>`) mode the host is focusable/actionable only when it genuinely
   * acts on click — clickable or selectable. A removable-only tag is inert; its `×` handles input. */
  protected readonly hostFocusable = computed(
    () => !this.isDisabled() && (this.clickable() || this.isSelectableType()),
  );
  protected readonly presentationalRole = computed(() =>
    this.hostFocusable() ? this.ariaRole() : null,
  );
  protected readonly presentationalTabIndex = computed(() =>
    this.hostFocusable() ? this.tabIndex() : null,
  );
  protected readonly ariaSelected = computed(() => (this.isSelectableType() ? String(this.isSelected()) : null));
  protected readonly chipLabel = computed(() => this.label().trim() || this.normalizedValue());
  protected readonly hasAvatar = computed(() =>
    Boolean(this.avatarUrl().trim() || this.avatarText().trim() || this.avatarIcon().trim()),
  );
  /** Nested `pixel-avatar` density: tucked-in `xs` for compact chips, `sm` for `lg`. */
  protected readonly avatarSize = computed<'xs' | 'sm'>(() => (this.size() === 'lg' ? 'sm' : 'xs'));
  /** Nested `pixel-badge` counter density mirrors the chip size. */
  protected readonly badgeSize = computed<'xs' | 'sm'>(() => (this.size() === 'xs' ? 'xs' : 'sm'));
  protected readonly hasIcon = computed(
    () => Boolean(this.prefixIcon().trim() || this.icon().trim() || this.suffixIcon().trim()),
  );
  protected readonly customClasses = computed(() =>
    [this.className().trim(), normalizeClassValue(this.ngClass())].filter(Boolean).join(' ').trim(),
  );
  protected readonly resolvedSemantic = computed<PixelChipSemantic>(() => this.semantic());
  protected readonly resolvedAriaLabel = computed(() => this.ariaLabel().trim() || this.chipLabel());

  protected onChipClick(event: MouseEvent): void {
    if (this.isDisabled()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    this.chipClick.emit(event);
    if (this.isSelectableType() && !this.isReadonly()) {
      this.selectionChange.emit({
        selected: !this.isSelected(),
        value: this.normalizedValue(),
        type: this.type(),
        source: 'mouse',
        originalEvent: event,
      });
    }
  }

  protected onChipKeyDown(event: KeyboardEvent): void {
    if (this.isDisabled()) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.pressing.set(true);
      this.chipClick.emit(event);
      if (this.isSelectableType() && !this.isReadonly()) {
        this.selectionChange.emit({
          selected: !this.isSelected(),
          value: this.normalizedValue(),
          type: this.type(),
          source: 'keyboard',
          originalEvent: event,
        });
      }
      return;
    }
    if ((event.key === 'Delete' || event.key === 'Backspace') && this.removable() && !this.isReadonly()) {
      event.preventDefault();
      this.chipRemove.emit({
        value: this.normalizedValue(),
        label: this.chipLabel(),
        source: 'keyboard',
        originalEvent: event,
      });
      return;
    }
    if (event.key === 'Escape' && this.editing()) {
      event.preventDefault();
      this.cancelEdit();
    }
    if (event.key === 'F2' && this.editable() && !this.isReadonly()) {
      event.preventDefault();
      this.startEdit();
    }
  }

  protected onChipKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      this.pressing.set(false);
    }
  }

  protected onRemoveClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.isDisabled() || this.isReadonly()) {
      return;
    }
    this.chipRemove.emit({
      value: this.normalizedValue(),
      label: this.chipLabel(),
      source: 'mouse',
      originalEvent: event,
    });
  }

  protected onFocus(event: FocusEvent): void {
    this.focusVisible.set(true);
    this.chipFocus.emit(event);
  }

  protected onBlur(event: FocusEvent): void {
    this.focusVisible.set(false);
    this.pressing.set(false);
    if (this.editing()) {
      this.commitEdit();
    }
    this.chipBlur.emit(event);
  }

  protected onDragStart(event: DragEvent): void {
    if (!this.draggable() || this.isDisabled()) {
      event.preventDefault();
      return;
    }
    event.dataTransfer?.setData('text/plain', this.normalizedValue());
    this.dragStart.emit(event);
  }

  protected onDragEnd(event: DragEvent): void {
    this.dragEnd.emit(event);
  }

  protected startEdit(): void {
    if (!this.editable() || this.isDisabled() || this.isReadonly()) {
      return;
    }
    this.editing.set(true);
    this.editValue.set(this.chipLabel());
  }

  protected commitEdit(): void {
    if (!this.editing()) {
      return;
    }
    const nextLabel = this.editValue().trim();
    this.editing.set(false);
    if (!nextLabel || nextLabel === this.chipLabel()) {
      return;
    }
    this.valueChange.emit(nextLabel);
    this.chipEdit.emit({ value: this.normalizedValue(), label: nextLabel });
  }

  protected cancelEdit(): void {
    this.editing.set(false);
    this.editValue.set(this.chipLabel());
  }

  protected onEditInput(event: Event): void {
    this.editValue.set((event.target as HTMLInputElement).value);
  }

  protected onEditKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.commitEdit();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelEdit();
    }
  }

  private isSelectableType(): boolean {
    const type = this.type();
    return (PIXEL_CHIP_SELECTABLE_TYPES as readonly PixelChipType[]).includes(type);
  }
}
