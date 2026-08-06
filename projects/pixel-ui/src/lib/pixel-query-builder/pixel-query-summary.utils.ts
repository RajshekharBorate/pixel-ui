import {
  getQueryOperatorLabel,
  operatorExpectsRange,
  operatorNeedsValue,
} from './pixel-query-operator.registry';
import type {
  PixelQueryBuilderConfig,
  PixelQueryBuilderLabels,
  PixelQueryExport,
  PixelQueryExportRule,
  PixelQueryGroup,
  PixelQuerySummaryGroupNode,
  PixelQuerySummaryNode,
  PixelQuerySummaryRuleNode,
  PixelQuerySummaryTree,
} from './pixel-query-builder.types';
import { resolveQueryBuilderLabels } from './pixel-query-builder.types';
import { exportQuery } from './pixel-query-builder.utils';

/** Builds a structured summary tree for the visual preview panel. */
export function buildQuerySummaryTree(
  query: PixelQueryGroup,
  config: PixelQueryBuilderConfig,
): PixelQuerySummaryTree {
  const exported = exportQuery(query);
  const labels = resolveQueryBuilderLabels(config);
  const root = buildGroupNode(exported, config, labels);
  return {
    empty: root.children.length === 0,
    root,
  };
}

/** Flattens a summary tree into a readable string (events / clipboard). */
export function summaryTreeToText(
  tree: PixelQuerySummaryTree,
  labels: PixelQueryBuilderLabels = resolveQueryBuilderLabels(undefined),
): string {
  if (tree.empty) {
    return labels.noConditionsDefined;
  }
  return flattenGroup(tree.root, labels);
}

function buildGroupNode(
  group: PixelQueryExport,
  config: PixelQueryBuilderConfig,
  labels: PixelQueryBuilderLabels,
): PixelQuerySummaryGroupNode {
  const children = (group.rules ?? [])
    .map((child) => {
      if ('condition' in child && Array.isArray(child.rules)) {
        const nested = buildGroupNode(child, config, labels);
        return nested.children.length ? nested : null;
      }
      return buildRuleNode(child as PixelQueryExportRule, config, labels);
    })
    .filter((child): child is PixelQuerySummaryNode => child !== null);

  return {
    type: 'group',
    condition: group.condition ?? config.defaultCondition ?? 'and',
    children,
  };
}

function buildRuleNode(
  rule: PixelQueryExportRule,
  config: PixelQueryBuilderConfig,
  labels: PixelQueryBuilderLabels,
): PixelQuerySummaryRuleNode {
  const fieldConfig = rule.field ? config.fields[rule.field] : undefined;
  const operatorLabel = getQueryOperatorLabel(rule.operator, config.operatorLabels);
  const needsValue = operatorNeedsValue(rule.operator);
  const valueLabel = needsValue ? formatSummaryValue(rule, config, labels) : null;

  return {
    type: 'rule',
    field: rule.field ?? '',
    fieldLabel: fieldConfig?.name ?? rule.field ?? labels.field,
    fieldIcon: fieldConfig?.icon,
    operator: rule.operator ?? '',
    operatorLabel,
    valueLabel,
    incomplete: isExportRuleIncomplete(rule, config),
  };
}

function isExportRuleIncomplete(
  rule: PixelQueryExportRule,
  config: PixelQueryBuilderConfig,
): boolean {
  if (!rule.field?.trim() || !rule.operator?.trim()) {
    return true;
  }
  if (rule.field && !config.fields[rule.field]) {
    return true;
  }
  if (!operatorNeedsValue(rule.operator)) {
    return false;
  }
  if (isEmptyValue(rule.value)) {
    return true;
  }
  if (
    operatorExpectsRange(rule.operator) &&
    (!Array.isArray(rule.value) ||
      rule.value.length < 2 ||
      isEmptyValue(rule.value[0]) ||
      isEmptyValue(rule.value[1]))
  ) {
    return true;
  }
  return false;
}

function isEmptyValue(value: unknown): boolean {
  if (value == null) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  if (Array.isArray(value)) {
    return value.length === 0 || value.every((item) => isEmptyValue(item));
  }
  return false;
}

function formatSummaryValue(
  rule: PixelQueryExportRule,
  config: PixelQueryBuilderConfig,
  labels: PixelQueryBuilderLabels,
): string {
  const value = rule.value;
  const field = rule.field ? config.fields[rule.field] : undefined;
  const options = field?.options ?? [];

  const labelFor = (raw: unknown): string => {
    const match = options.find((option) => option.value === raw);
    return match?.name ?? String(raw);
  };

  if (isEmptyValue(value)) {
    return labels.notSet;
  }

  if (Array.isArray(value)) {
    if (operatorExpectsRange(rule.operator)) {
      const [start, end] = value;
      return `${formatDatePart(start, labels)} – ${formatDatePart(end, labels)}`;
    }
    return value.map(labelFor).join(', ');
  }

  if (value instanceof Date) {
    return formatDatePart(value, labels);
  }

  if (field?.type === 'number' && typeof value === 'number') {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 }).format(value);
  }

  if (field?.type === 'boolean') {
    return value ? labels.yes : labels.no;
  }

  if (field?.type === 'date' && typeof value === 'string') {
    return formatDatePart(value, labels);
  }

  if (options.length) {
    return labelFor(value);
  }

  return String(value);
}

function formatDatePart(value: unknown, labels: PixelQueryBuilderLabels): string {
  if (!value) {
    return labels.ellipsis;
  }
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function flattenGroup(
  group: PixelQuerySummaryGroupNode,
  labels: PixelQueryBuilderLabels,
): string {
  if (!group.children.length) {
    return '';
  }

  const joiner = ` ${group.condition === 'and' ? labels.andJoiner : labels.orJoiner} `;
  return group.children
    .map((child) => {
      if (child.type === 'group') {
        const nested = flattenGroup(child, labels);
        return nested ? `(${nested})` : '';
      }
      return flattenRule(child, labels);
    })
    .filter(Boolean)
    .join(joiner);
}

function flattenRule(
  rule: PixelQuerySummaryRuleNode,
  labels: PixelQueryBuilderLabels,
): string {
  const field = rule.fieldLabel;
  const operator = rule.operatorLabel.toLowerCase();

  if (!operatorNeedsValue(rule.operator)) {
    return `${field} ${operator}`;
  }

  const value = formatTextValue(rule, labels);
  return `${field} ${operator} ${value}`;
}

function formatTextValue(
  rule: PixelQuerySummaryRuleNode,
  labels: PixelQueryBuilderLabels,
): string {
  if (rule.incomplete || !rule.valueLabel || rule.valueLabel === labels.notSet) {
    return labels.ellipsis;
  }

  const label = rule.valueLabel;
  if (label.includes(', ') || label.includes(' – ') || label.includes(' - ')) {
    return `"${label}"`;
  }

  if (/^\d[\d,.\s]*$/.test(label)) {
    return label;
  }

  return `"${label}"`;
}
