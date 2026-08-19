import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import PixelDateRangePickerComponent from '../pixel-date-range-picker/pixel-date-range-picker';
import PixelDatepickerComponent from '../pixel-datepicker/pixel-datepicker';
import PixelInputComponent from '../pixel-input/pixel-input';
import PixelSelectComponent, {
  type PixelSelectOption,
  type PixelSelectVisualState,
} from '../pixel-select/pixel-select';
import {
  toQueryDateRangePickerSize,
  toQueryDatepickerSize,
  toQueryInputSize,
  toQuerySelectSize,
} from './pixel-query-builder-size';
import {
  operatorExpectsMultiValue,
  operatorExpectsRange,
  operatorNeedsValue,
} from './pixel-query-operator.registry';
import { injectPixelQueryBuilderStore } from './pixel-query-builder.store';
import { parseLocalIsoDate } from '../shared/datetime/pixel-date-utils';
import { hasRuleValidationError } from './pixel-query-builder.validator';
import type { PixelQueryBuilderSize, PixelQueryFieldOption, PixelQueryGroup } from './pixel-query-builder.types';
import { resolveQueryBuilderLabels } from './pixel-query-builder.types';
import { isQueryGroup } from './pixel-query-builder.utils';

@Component({
  selector: 'pixel-query-value',
  imports: [
    ReactiveFormsModule,
    PixelInputComponent,
    PixelSelectComponent,
    PixelDatepickerComponent,
    PixelDateRangePickerComponent,
  ],
  templateUrl: './pixel-query-value.html',
  styleUrl: './pixel-query-value.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-query-value',
    '[attr.data-size]': 'size()',
    '[attr.data-value-kind]': 'valueKind()',
  },
})
export default class PixelQueryValueComponent {
  protected readonly store = injectPixelQueryBuilderStore();
  private readonly destroyRef = inject(DestroyRef);

  readonly ruleId = input.required<string>();
  readonly size = input<PixelQueryBuilderSize>('md');

  protected readonly l = computed(() => resolveQueryBuilderLabels(this.store.config()));
  protected readonly resolvedOptions = signal<readonly PixelSelectOption[]>([]);
  protected readonly optionsLoading = signal(false);
  protected readonly valueControl = new FormControl<unknown>(null);
  protected readonly rangeForm = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  protected readonly rule = computed(() => this.store.ruleById(this.ruleId()));
  protected readonly fieldConfig = computed(() => {
    const field = this.rule()?.field ?? '';
    return field ? this.store.config().fields[field] : undefined;
  });

  protected readonly selectSize = computed(() => toQuerySelectSize(this.size()));
  protected readonly inputSize = computed(() => toQueryInputSize(this.size()));
  protected readonly datepickerSize = computed(() => toQueryDatepickerSize(this.size()));
  protected readonly dateRangePickerSize = computed(() => toQueryDateRangePickerSize(this.size()));

  protected readonly showValue = computed(() => {
    const operator = this.rule()?.operator ?? '';
    return operatorNeedsValue(operator);
  });

  protected readonly isRange = computed(() =>
    operatorExpectsRange(this.rule()?.operator ?? ''),
  );

  protected readonly isMulti = computed(() => {
    const operator = this.rule()?.operator ?? '';
    const type = this.fieldConfig()?.type;
    return operatorExpectsMultiValue(operator) || type === 'multiselect';
  });

  protected readonly isDate = computed(() => this.fieldConfig()?.type === 'date');
  protected readonly isNumber = computed(() => this.fieldConfig()?.type === 'number');
  protected readonly isBoolean = computed(() => this.fieldConfig()?.type === 'boolean');
  protected readonly isCategory = computed(() => {
    const type = this.fieldConfig()?.type;
    return type === 'category' || type === 'multiselect';
  });

  protected readonly valueKind = computed(() => {
    if (!this.showValue()) {
      return 'none';
    }
    if (this.isBoolean() || this.isCategory()) {
      return this.isMulti() ? 'multiselect' : 'select';
    }
    if (this.isDate() && this.isRange()) {
      return 'range';
    }
    if (this.isDate()) {
      return 'date';
    }
    return 'text';
  });

  protected readonly booleanOptions = computed<readonly PixelSelectOption[]>(() => [
    { value: true, label: this.l().yes },
    { value: false, label: this.l().no },
  ]);

  protected readonly searchable = computed(
    () => this.fieldConfig()?.searchable ?? this.fieldConfig()?.serverSearch ?? false,
  );

  protected readonly serverSearch = computed(() => this.fieldConfig()?.serverSearch ?? false);

  protected readonly valueState = computed((): PixelSelectVisualState => {
    const issues = this.store.validation().ruleIssues;
    const ruleId = this.ruleId();
    if (
      hasRuleValidationError(issues, ruleId, 'value') ||
      hasRuleValidationError(issues, ruleId, 'range')
    ) {
      return 'error';
    }
    return 'default';
  });

  protected readonly valueErrorText = computed(() =>
    this.valueState() === 'error' ? 'Enter a value.' : '',
  );

  protected readonly dateValue = computed(() => {
    const value = this.rule()?.value;
    if (value == null || value === '') return null;
    return parseLocalIsoDate(value as string | Date | number);
  });

  constructor() {
    effect(() => {
      const rule = this.rule();
      this.valueControl.setValue(rule?.value ?? null, { emitEvent: false });
    });

    this.valueControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      const rule = this.rule();
      if (!rule) {
        return;
      }
      this.store.patchRule(rule.id, { value });
    });

    effect(() => {
      const rule = this.rule();
      if (!this.isDate() || !this.isRange()) {
        return;
      }
      const start = readRangePart(rule?.value, 0);
      const end = readRangePart(rule?.value, 1);
      const currentStart = this.rangeForm.controls.start.value;
      const currentEnd = this.rangeForm.controls.end.value;
      if (sameDateValue(currentStart, start) && sameDateValue(currentEnd, end)) {
        return;
      }
      this.rangeForm.setValue({ start, end }, { emitEvent: false });
    });

    this.rangeForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ start, end }) => {
      this.patchRangeValue(start ?? null, end ?? null);
    });

    effect(() => {
      const rule = this.rule();
      const config = this.fieldConfig();
      if (!rule?.field || !config?.resolveOptions) {
        this.applyStaticOptions(config?.options);
        return;
      }
      this.optionsLoading.set(true);
      config
        .resolveOptions({
          getRuleValue: (field) => findValueInTree(this.store.query(), field),
          query: this.store.query(),
          ruleId: rule.id,
        })
        .pipe(finalize(() => this.optionsLoading.set(false)))
        .subscribe((options) => this.applyStaticOptions(options));
    });
  }

  protected onSearch(query: string): void {
    const config = this.fieldConfig();
    const rule = this.rule();
    if (!config?.loadOptions || !rule) {
      return;
    }
    this.optionsLoading.set(true);
    config
      .loadOptions(query, {
        getRuleValue: (field) => findValueInTree(this.store.query(), field),
        query: this.store.query(),
        ruleId: rule.id,
      })
      .pipe(finalize(() => this.optionsLoading.set(false)))
      .subscribe((options) => this.applyStaticOptions(options));
  }

  protected onDateChange(value: Date | null): void {
    const rule = this.rule();
    if (!rule) {
      return;
    }
    this.store.patchRule(rule.id, { value });
  }

  protected onSelectValueChange(value: unknown): void {
    const rule = this.rule();
    if (!rule) {
      return;
    }
    this.store.patchRule(rule.id, { value });
  }

  protected onRangeChange(event: { start: Date | null; end: Date | null }): void {
    this.patchRangeValue(event.start, event.end);
  }

  private patchRangeValue(start: Date | null, end: Date | null): void {
    const rule = this.rule();
    if (!rule || !this.isDate() || !this.isRange()) {
      return;
    }
    const nextValue: [Date | null, Date | null] = [start, end];
    if (sameRangeValue(rule.value, nextValue)) {
      return;
    }
    this.store.patchRule(rule.id, { value: nextValue });
  }

  private applyStaticOptions(options?: readonly PixelQueryFieldOption[]): void {
    this.resolvedOptions.set(
      (options ?? []).map((option) => ({
        value: option.value,
        label: option.name,
        icon: option.icon,
        subtitle: option.subtitle,
      })),
    );
  }
}

function readRangePart(value: unknown, index: 0 | 1): Date | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const part = value[index];
  if (part == null || part === '') {
    return null;
  }
  return parseLocalIsoDate(part as string | Date | number);
}

function sameDateValue(a: Date | null | undefined, b: Date | null | undefined): boolean {
  if (!a && !b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.getTime() === b.getTime();
}

function sameRangeValue(current: unknown, next: readonly [Date | null, Date | null]): boolean {
  if (!Array.isArray(current)) {
    return !next[0] && !next[1];
  }
  return sameDateValue(readRangePart(current, 0), next[0]) &&
    sameDateValue(readRangePart(current, 1), next[1]);
}

function findValueInTree(query: PixelQueryGroup, field: string): unknown {
  for (const child of query.rules) {
    if (isQueryGroup(child)) {
      const nested = findValueInTree(child, field);
      if (nested !== undefined) {
        return nested;
      }
    } else if (child.field === field) {
      return child.value;
    }
  }
  return undefined;
}
