import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import PixelSelectComponent, {
  type PixelSelectOption,
} from '../pixel-select/pixel-select';
import PixelTooltipDirective from '../pixel-tooltip/pixel-tooltip';
import PixelButtonComponent from '../pixel-button/pixel-button';
import type { PixelSelectVisualState } from '../pixel-select/pixel-select';
import {
  getDefaultOperatorForFieldType,
  getOperatorsForFieldType,
  getQueryOperatorLabel,
  operatorExpectsMultiValue,
  operatorExpectsRange,
  operatorNeedsValue,
} from './pixel-query-operator.registry';
import { hasRuleValidationError } from './pixel-query-builder.validator';
import { injectPixelQueryBuilderStore } from './pixel-query-builder.store';
import type { PixelQueryBuilderConfig, PixelQueryBuilderSize, PixelQueryRule } from './pixel-query-builder.types';
import { resolveQueryBuilderLabels } from './pixel-query-builder.types';
import { toQueryButtonSize, toQuerySelectSize } from './pixel-query-builder-size';
import PixelQueryValueComponent from './pixel-query-value';

@Component({
  selector: 'pixel-query-rule',
  imports: [PixelSelectComponent, PixelQueryValueComponent, PixelTooltipDirective, PixelButtonComponent],
  templateUrl: './pixel-query-rule.html',
  styleUrl: './pixel-query-rule.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-query-rule',
    '[attr.data-size]': 'size()',
    '[class.pixel-query-rule--invalid]': 'invalid()',
    '[class.pixel-query-rule--collapsed]': 'collapsed()',
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
  },
})
export default class PixelQueryRuleComponent {
  protected readonly store = injectPixelQueryBuilderStore();

  readonly ruleId = input.required<string>();
  readonly groupId = input.required<string>();
  readonly index = input.required<number>();
  readonly size = input<PixelQueryBuilderSize>('md');

  protected readonly collapsed = signal(false);
  protected readonly l = computed(() => resolveQueryBuilderLabels(this.store.config()));

  protected readonly rule = computed(() => this.store.ruleById(this.ruleId()));

  protected readonly selectSize = computed(() => toQuerySelectSize(this.size()));
  protected readonly buttonSize = computed(() => toQueryButtonSize(this.size()));

  protected readonly fieldOptions = computed<readonly PixelSelectOption[]>(() =>
    Object.entries(this.store.config().fields).map(([value, field]) => ({
      value,
      label: field.name,
      icon: field.icon,
    })),
  );

  protected readonly operatorOptions = computed<readonly PixelSelectOption[]>(() => {
    const fieldKey = this.rule()?.field ?? '';
    const field = fieldKey ? this.store.config().fields[fieldKey] : undefined;
    if (!field) {
      return [];
    }
    const operators = getOperatorsForFieldType(field.type, field.operators);
    const labels = this.store.config().operatorLabels;
    return operators.map((operator) => ({
      value: operator,
      label: getQueryOperatorLabel(operator, labels),
    }));
  });

  protected readonly invalid = computed(() =>
    this.store.validation().ruleIssues.some((issue) => issue.ruleId === this.ruleId()),
  );

  protected readonly fieldState = computed((): PixelSelectVisualState =>
    hasRuleValidationError(this.store.validation().ruleIssues, this.ruleId(), 'field')
      ? 'error'
      : 'default',
  );

  protected readonly operatorState = computed((): PixelSelectVisualState =>
    hasRuleValidationError(this.store.validation().ruleIssues, this.ruleId(), 'operator')
      ? 'error'
      : 'default',
  );

  protected readonly fieldLabel = computed(() => {
    const fieldKey = this.rule()?.field ?? '';
    if (!fieldKey) {
      return null;
    }
    return this.store.config().fields[fieldKey]?.name ?? fieldKey;
  });

  protected readonly collapseTooltip = computed(() =>
    this.collapsed() ? this.l().expandRule : this.l().collapseRule,
  );

  protected readonly ruleSummaryOperator = computed(() => {
    const rule = this.rule();
    if (!rule?.field || !rule.operator) {
      return null;
    }
    return getQueryOperatorLabel(rule.operator, this.store.config().operatorLabels);
  });

  protected readonly ruleSummaryValue = computed(() => {
    const rule = this.rule();
    if (!rule?.field || !rule.operator || !operatorNeedsValue(rule.operator)) {
      return null;
    }
    return formatRuleValueSummary(rule, this.store.config());
  });

  protected isInteractiveDisabled(): boolean {
    return this.store.disabled() || this.store.readOnly();
  }

  protected toggleCollapsed(): void {
    this.collapsed.update((value) => !value);
  }

  protected onFieldChange(field: unknown): void {
    const rule = this.rule();
    if (!rule || typeof field !== 'string') {
      return;
    }
    const fieldConfig = this.store.config().fields[field];
    const operator = fieldConfig
      ? getDefaultOperatorForFieldType(fieldConfig.type, fieldConfig.defaultOperator)
      : '';
    this.store.patchRule(rule.id, {
      field,
      operator,
      value: defaultValueForOperator(operator, fieldConfig?.type),
    });
  }

  protected onOperatorChange(operator: unknown): void {
    const rule = this.rule();
    if (!rule || typeof operator !== 'string') {
      return;
    }
    const fieldConfig = rule.field ? this.store.config().fields[rule.field] : undefined;
    this.store.patchRule(rule.id, {
      operator,
      value: defaultValueForOperator(operator, fieldConfig?.type),
    });
  }

  protected removeRule(): void {
    this.store.removeNode(this.ruleId());
  }
}

function defaultValueForOperator(operator: string, fieldType?: string): unknown {
  if (!operatorNeedsValue(operator)) {
    return null;
  }
  if (operatorExpectsRange(operator)) {
    return [null, null];
  }
  if (operatorExpectsMultiValue(operator) || fieldType === 'multiselect') {
    return [];
  }
  return null;
}

function formatRuleValueSummary(rule: PixelQueryRule, config: PixelQueryBuilderConfig): string | null {
  if (!operatorNeedsValue(rule.operator)) {
    return null;
  }
  const value = rule.value;
  if (value == null || value === '') {
    return null;
  }
  const field = config.fields[rule.field];
  const options = field?.options ?? [];

  const labelFor = (raw: unknown): string => {
    const match = options.find((option) => option.value === raw);
    return match?.name ?? String(raw);
  };

  if (Array.isArray(value)) {
    if (operatorExpectsRange(rule.operator)) {
      const [start, end] = value;
      if (!start && !end) {
        return null;
      }
      return `${formatDatePart(start)} – ${formatDatePart(end)}`;
    }
    if (!value.length) {
      return null;
    }
    return value.map(labelFor).join(', ');
  }

  if (value instanceof Date) {
    return formatDatePart(value);
  }

  if (field?.type === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}

function formatDatePart(value: unknown): string {
  if (!value) {
    return '…';
  }
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
