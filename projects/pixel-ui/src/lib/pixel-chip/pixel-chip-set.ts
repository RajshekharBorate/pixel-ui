import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import PixelChipComponent, { type PixelChipItem, type PixelChipSize, type PixelChipVariant } from './pixel-chip';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';

export type PixelChipSetLayout = 'horizontal' | 'vertical' | 'wrap' | 'scrollable';
export type PixelChipSetSelectionMode = 'single' | 'multiple';

export interface PixelChipSetSelectionChange {
  values: readonly string[];
  selectedCount: number;
}

export interface PixelChipReorderEvent {
  fromIndex: number;
  toIndex: number;
  chips: readonly PixelChipItem[];
}

const DEFAULT_SEPARATOR_KEYS = ['Enter', ',', ';'] as const;

function toChipValue(chip: PixelChipItem): string {
  return (chip.value ?? chip.label).trim();
}

@Component({
  selector: 'pixel-chip-set',
  standalone: true,
  imports: [PixelChipComponent, PixelSkeletonComponent],
  templateUrl: './pixel-chip-set.html',
  styleUrl: './pixel-chip.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PixelChipSetComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelChipSetComponent implements ControlValueAccessor {
  private readonly controlledSelection = signal<readonly string[] | null>(null);
  private readonly internalSelection = signal<readonly string[]>([]);
  protected readonly focusedIndex = signal(-1);
  protected readonly hoveredIndex = signal(-1);
  protected readonly expandedOverflow = signal(false);
  private readonly dragFromIndex = signal<number | null>(null);
  protected readonly inputValue = signal('');
  private readonly disabledFromForms = signal(false);

  private onChange: (value: readonly string[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  /**
   * @component Optional id for list semantics.
   */
  readonly id = input('');

  /**
   * @component Full list of chips to render.
   */
  readonly chips = input<readonly PixelChipItem[]>([]);

  /**
   * @component Select mode: single or multiple.
   */
  readonly selectionMode = input<PixelChipSetSelectionMode>('multiple');

  /**
   * @component Legacy alias for multi-select behavior.
   */
  readonly multiple = input(true, { transform: booleanAttribute });

  /**
   * @component When true, renders skeleton pill placeholders instead of the chip set.
   */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  /**
   * @component Number of skeleton chips shown when `showSkeleton` is true. Defaults to the
   * number of chips provided, otherwise 4.
   */
  readonly skeletonCount = input(0, { transform: numberAttribute });

  /**
   * @component Set-level disabled flag.
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * @component Set-level readonly flag.
   */
  readonly readonly = input(false, { transform: booleanAttribute });

  /**
   * @component Enables keyboard navigation shortcuts.
   */
  readonly keyboardNavigation = input(true, { transform: booleanAttribute });

  /**
   * @component Layout strategy.
   */
  readonly layout = input<PixelChipSetLayout>('wrap');

  /**
   * @component Default chip size fallback.
   */
  readonly size = input<PixelChipSize>('md');

  /**
   * @component Default chip variant fallback.
   */
  readonly variant = input<PixelChipVariant>('soft');

  /**
   * @component Enables drag-drop reordering.
   */
  readonly reorderable = input(false, { transform: booleanAttribute });

  /**
   * @component Controls max visible chips before overflow.
   */
  readonly maxVisible = input<number | null>(null);

  /**
   * @component Enables overflow collapse/expand behavior.
   */
  readonly showOverflow = input(true, { transform: booleanAttribute });

  /**
   * @component Compact density mode for all chips.
   */
  readonly compact = input(false, { transform: booleanAttribute });

  /**
   * @component Maximum allowed selected chips.
   */
  readonly maxSelection = input<number | null>(null);

  /**
   * @component Shows selected count summary text.
   */
  readonly showSelectionCounter = input(true, { transform: booleanAttribute });

  /**
   * @component Enables inline chip input.
   */
  readonly chipInput = input(false, { transform: booleanAttribute });

  /**
   * @component Placeholder for inline input.
   */
  readonly chipInputPlaceholder = input('Add a tag');

  /**
   * @component Key list for creating chips from input.
   */
  readonly separatorKeys = input<readonly string[]>(DEFAULT_SEPARATOR_KEYS);

  /**
   * @component Prevents duplicate chip values.
   */
  readonly preventDuplicates = input(true, { transform: booleanAttribute });

  /**
   * @component Optional regex source used to validate new chip values.
   */
  readonly inputPattern = input('');

  /**
   * @component Optional aria-label for listbox/list.
   */
  readonly ariaLabel = input('Chip set');

  /**
   * @component Optional aria-describedby ids.
   */
  readonly ariaDescribedBy = input('');

  /**
   * @component Extra host classes.
   */
  readonly className = input('');

  readonly chipClick = output<{ chip: PixelChipItem; index: number; event: MouseEvent | KeyboardEvent }>();
  readonly chipRemove = output<{ chip: PixelChipItem; index: number }>();
  readonly selectionChange = output<PixelChipSetSelectionChange>();
  readonly valueChange = output<readonly PixelChipItem[]>();
  readonly chipEdit = output<{ chip: PixelChipItem; index: number; nextLabel: string }>();
  readonly chipAdd = output<{ chip: PixelChipItem; value: string }>();
  readonly chipFocus = output<{ chip: PixelChipItem; index: number }>();
  readonly chipBlur = output<{ chip: PixelChipItem; index: number }>();
  readonly dragStart = output<{ chip: PixelChipItem; index: number }>();
  readonly dragEnd = output<{ chip: PixelChipItem; index: number | null }>();
  readonly reorder = output<PixelChipReorderEvent>();
  readonly overflowExpand = output<boolean>();
  readonly inputChange = output<string>();

  protected readonly resolvedSelectionMode = computed<PixelChipSetSelectionMode>(() => {
    if (!this.multiple()) {
      return 'single';
    }
    return this.selectionMode();
  });
  protected readonly listRole = computed(() =>
    this.isSelectableSet() ? 'listbox' : 'list',
  );
  protected readonly selectedValues = computed(() =>
    this.controlledSelection() ?? this.internalSelection(),
  );
  protected readonly disabledSet = computed(() => this.disabled() || this.disabledFromForms());

  protected readonly skeletonChipArray = computed(() => {
    const explicit = this.skeletonCount();
    const count = explicit > 0 ? explicit : (this.chips().length || 4);
    return Array.from({ length: count });
  });
  protected readonly mappedChips = computed(() =>
    this.chips().map((chip) => {
      const value = toChipValue(chip);
      return {
        ...chip,
        value,
        selected: this.selectedValues().includes(value) || chip.selected === true,
        disabled: this.disabledSet() || chip.disabled === true,
        readonly: this.readonly() || chip.readonly === true,
        size: chip.size ?? this.size(),
        variant: chip.variant ?? this.variant(),
      };
    }),
  );
  protected readonly canCollapse = computed(() => {
    if (!this.showOverflow()) {
      return false;
    }
    const maxVisible = this.maxVisible();
    return maxVisible !== null && maxVisible >= 0 && this.mappedChips().length > maxVisible;
  });
  protected readonly visibleChips = computed(() => {
    if (!this.canCollapse() || this.expandedOverflow()) {
      return this.mappedChips();
    }
    const maxVisible = this.maxVisible() ?? this.mappedChips().length;
    return this.mappedChips().slice(0, maxVisible);
  });
  protected readonly hiddenChipCount = computed(() =>
    Math.max(this.mappedChips().length - this.visibleChips().length, 0),
  );
  protected readonly selectedCount = computed(() => this.selectedValues().length);
  protected readonly selectionSummary = computed(() =>
    `${this.selectedCount()} selected`,
  );
  protected readonly hostClass = computed(() =>
    ['pixel-chip__set', this.className().trim(), this.layoutClass()]
      .filter(Boolean)
      .join(' ')
      .trim(),
  );

  private readonly _initSelectionEffect = effect(() => {
    if (this.controlledSelection() !== null) {
      return;
    }
    const selected = this.chips()
      .filter((chip) => chip.selected)
      .map((chip) => toChipValue(chip));
    this.internalSelection.set(this.ensureSelectionMode(selected));
  });

  writeValue(value: readonly string[] | string | null): void {
    if (value === null) {
      this.controlledSelection.set(null);
      return;
    }
    const normalized = Array.isArray(value) ? value : [value];
    this.controlledSelection.set(this.ensureSelectionMode(normalized));
  }

  registerOnChange(fn: (value: readonly string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledFromForms.set(isDisabled);
  }

  protected onChipSelectionChange(index: number, selected: boolean): void {
    const chip = this.visibleChips()[index];
    if (!chip || this.disabledSet() || this.readonly()) {
      return;
    }
    const current = this.selectedValues();
    const value = toChipValue(chip);
    let next = current;
    if (selected) {
      if (this.maxSelection() !== null && current.length >= (this.maxSelection() ?? 0)) {
        return;
      }
      if (this.resolvedSelectionMode() === 'single') {
        next = [value];
      } else if (!current.includes(value)) {
        next = [...current, value];
      }
    } else {
      next = current.filter((entry) => entry !== value);
    }
    this.setSelection(next);
  }

  protected onChipRemove(index: number): void {
    const chip = this.visibleChips()[index];
    if (!chip || this.disabledSet() || this.readonly()) {
      return;
    }
    const next = this.mappedChips().filter((entry) => toChipValue(entry) !== toChipValue(chip));
    const selected = this.selectedValues().filter((value) => value !== toChipValue(chip));
    this.setSelection(selected);
    this.valueChange.emit(next);
    this.chipRemove.emit({ chip, index });
  }

  protected onChipClick(index: number, event: MouseEvent | KeyboardEvent): void {
    const chip = this.visibleChips()[index];
    if (!chip) {
      return;
    }
    this.focusedIndex.set(index);
    this.chipClick.emit({ chip, index, event });
  }

  protected onChipFocus(index: number): void {
    const chip = this.visibleChips()[index];
    if (!chip) {
      return;
    }
    this.focusedIndex.set(index);
    this.chipFocus.emit({ chip, index });
  }

  protected onChipBlur(index: number): void {
    const chip = this.visibleChips()[index];
    if (!chip) {
      return;
    }
    this.chipBlur.emit({ chip, index });
    this.onTouched();
  }

  protected onChipEdit(index: number, nextLabel: string): void {
    const chip = this.visibleChips()[index];
    if (!chip) {
      return;
    }
    const next = this.mappedChips().map((entry, chipIndex) =>
      chipIndex === index ? { ...entry, label: nextLabel } : entry,
    );
    this.valueChange.emit(next);
    this.chipEdit.emit({ chip, index, nextLabel });
  }

  protected onChipSetKeydown(event: KeyboardEvent): void {
    if (!this.keyboardNavigation()) {
      return;
    }
    const chips = this.visibleChips();
    if (!chips.length) {
      return;
    }
    const focused = this.focusedIndex();
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.focusedIndex.set(Math.min(focused + 1, chips.length - 1));
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.focusedIndex.set(Math.max(focused - 1, 0));
      return;
    }
    if ((event.key === 'Delete' || event.key === 'Backspace') && focused >= 0) {
      event.preventDefault();
      this.onChipRemove(focused);
      this.focusedIndex.set(Math.max(focused - 1, 0));
      return;
    }
    if (event.key === 'Escape' && this.expandedOverflow()) {
      event.preventDefault();
      this.expandedOverflow.set(false);
      this.overflowExpand.emit(false);
    }
  }

  protected onDragStart(index: number): void {
    if (!this.reorderable()) {
      return;
    }
    this.dragFromIndex.set(index);
    const chip = this.visibleChips()[index];
    if (chip) {
      this.dragStart.emit({ chip, index });
    }
  }

  protected onDrop(index: number): void {
    if (!this.reorderable()) {
      return;
    }
    const fromIndex = this.dragFromIndex();
    if (fromIndex === null || fromIndex === index) {
      return;
    }
    const chips = [...this.mappedChips()];
    const [moved] = chips.splice(fromIndex, 1);
    if (!moved) {
      return;
    }
    chips.splice(index, 0, moved);
    this.valueChange.emit(chips);
    this.reorder.emit({ fromIndex, toIndex: index, chips });
    this.dragFromIndex.set(null);
  }

  protected onDragEnd(index: number | null = null): void {
    const chipIndex = index ?? this.dragFromIndex();
    if (chipIndex !== null) {
      const chip = this.visibleChips()[chipIndex];
      if (chip) {
        this.dragEnd.emit({ chip, index: chipIndex });
      }
    } else {
      this.dragEnd.emit({ chip: { label: '' }, index: null });
    }
    this.dragFromIndex.set(null);
  }

  protected toggleOverflow(): void {
    const next = !this.expandedOverflow();
    this.expandedOverflow.set(next);
    this.overflowExpand.emit(next);
  }

  protected onInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.inputValue.set(value);
    this.inputChange.emit(value);
  }

  protected onInputKeydown(event: KeyboardEvent): void {
    if (!this.separatorKeys().includes(event.key)) {
      return;
    }
    event.preventDefault();
    this.addChipFromInput(this.inputValue());
  }

  protected onInputPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text');
    if (!text) {
      return;
    }
    const separators = this.separatorKeys()
      .map((key) => (key === 'Enter' ? '\n' : key))
      .filter(Boolean)
      .map((separator) => separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const splitter = new RegExp(`[${separators.join('')}]`, 'g');
    const chunks = text
      .split(splitter)
      .map((part) => part.trim())
      .filter(Boolean);
    if (!chunks.length) {
      return;
    }
    event.preventDefault();
    chunks.forEach((chunk) => this.addChipFromInput(chunk));
    this.inputValue.set('');
  }

  protected trackChip(_index: number, chip: PixelChipItem): string {
    return chip.id?.trim() || toChipValue(chip);
  }

  private addChipFromInput(rawValue: string): void {
    const value = rawValue.trim();
    if (!value || this.disabledSet() || this.readonly()) {
      return;
    }
    if (this.preventDuplicates() && this.mappedChips().some((chip) => toChipValue(chip) === value)) {
      return;
    }
    const pattern = this.inputPattern().trim();
    if (pattern) {
      const regex = new RegExp(pattern);
      if (!regex.test(value)) {
        return;
      }
    }
    const chip: PixelChipItem = {
      label: value,
      value,
      type: 'input',
      removable: true,
      size: this.size(),
      variant: this.variant(),
    };
    this.valueChange.emit([...this.mappedChips(), chip]);
    this.chipAdd.emit({ chip, value });
    this.inputValue.set('');
  }

  private setSelection(values: readonly string[]): void {
    const next = this.ensureSelectionMode(values);
    if (this.controlledSelection() === null) {
      this.internalSelection.set(next);
    }
    this.onChange(next);
    this.selectionChange.emit({
      values: next,
      selectedCount: next.length,
    });
  }

  private ensureSelectionMode(values: readonly string[]): readonly string[] {
    const unique = [...new Set(values.map((value) => value.trim()).filter(Boolean))];
    if (this.resolvedSelectionMode() === 'single') {
      return unique.slice(0, 1);
    }
    return unique;
  }

  private isSelectableSet(): boolean {
    return this.chips().some((chip) => chip.type === 'selectable' || chip.type === 'filter' || chip.type === 'choice');
  }

  private layoutClass(): string {
    return `pixel-chip__set--${this.layout()}`;
  }
}
