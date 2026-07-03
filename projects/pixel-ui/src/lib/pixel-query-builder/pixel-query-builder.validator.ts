import type {
  PixelQueryBuilderConfig,
  PixelQueryExport,
  PixelQueryGroup,
  PixelQueryGroupValidationIssue,
  PixelQueryRule,
  PixelQueryRuleValidationIssue,
  PixelQueryValidationResult,
} from './pixel-query-builder.types';
import { operatorNeedsValue } from './pixel-query-operator.registry';
import { countQueryRules, exportQuery, isQueryGroup } from './pixel-query-builder.utils';
import { buildQuerySummaryTree, summaryTreeToText } from './pixel-query-summary.utils';

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

function validateRule(
  rule: PixelQueryRule,
  config: PixelQueryBuilderConfig,
): Record<string, unknown> | null {
  const errors: Record<string, unknown> = {};

  if (!rule.field.trim()) {
    errors['field'] = true;
  }

  if (!rule.operator.trim()) {
    errors['operator'] = true;
  }

  const fieldConfig = rule.field ? config.fields[rule.field] : undefined;

  if (rule.field && !fieldConfig) {
    errors['unknownField'] = rule.field;
  }

  if (operatorNeedsValue(rule.operator) && isEmptyValue(rule.value)) {
    errors['value'] = true;
  }

  if (
    rule.operator === 'between' &&
    (!Array.isArray(rule.value) || rule.value.length < 2 || isEmptyValue(rule.value[0]) || isEmptyValue(rule.value[1]))
  ) {
    errors['range'] = true;
  }

  return Object.keys(errors).length ? errors : null;
}

function collectRuleIssues(
  group: PixelQueryGroup,
  config: PixelQueryBuilderConfig,
): PixelQueryRuleValidationIssue[] {
  const issues: PixelQueryRuleValidationIssue[] = [];

  for (const child of group.rules) {
    if (isQueryGroup(child)) {
      issues.push(...collectRuleIssues(child, config));
      continue;
    }
    const errors = validateRule(child, config);
    if (errors) {
      issues.push({ ruleId: child.id, field: child.field, errors });
    }
  }

  return issues;
}

/** Nested rulesets must always contain at least one rule or child ruleset. */
function collectNestedEmptyGroupIssues(group: PixelQueryGroup): PixelQueryGroupValidationIssue[] {
  const issues: PixelQueryGroupValidationIssue[] = [];

  for (const child of group.rules) {
    if (!isQueryGroup(child)) {
      continue;
    }
    if (child.rules.length === 0) {
      issues.push({ groupId: child.id, errors: { emptyGroup: true } });
    }
    issues.push(...collectNestedEmptyGroupIssues(child));
  }

  return issues;
}

/** Validates the full query tree against config. */
export function validateQuery(
  query: PixelQueryGroup,
  config: PixelQueryBuilderConfig,
): PixelQueryValidationResult {
  const ruleIssues = collectRuleIssues(query, config);
  const groupIssues = collectNestedEmptyGroupIssues(query);
  const empty = countQueryRules(query) === 0;
  const allowEmpty = config.allowEmpty ?? false;
  const valid =
    ruleIssues.length === 0 &&
    groupIssues.length === 0 &&
    (allowEmpty || !empty);

  return { valid, ruleIssues, groupIssues, empty };
}

/** Convenience boolean wrapper. */
export function isQueryValid(query: PixelQueryGroup, config: PixelQueryBuilderConfig): boolean {
  return validateQuery(query, config).valid;
}

/** Whether a nested ruleset is empty and invalid. */
export function isGroupEmptyInvalid(
  groupId: string,
  result: PixelQueryValidationResult,
): boolean {
  return result.groupIssues.some(
    (issue) => issue.groupId === groupId && issue.errors['emptyGroup'] === true,
  );
}

/** Whether a specific rule field failed validation. */
export function hasRuleValidationError(
  issues: readonly PixelQueryRuleValidationIssue[],
  ruleId: string,
  key: string,
): boolean {
  const issue = issues.find((item) => item.ruleId === ruleId);
  return Boolean(issue?.errors[key]);
}

/** Builds a human-readable summary string. */
export function queryToSummary(
  query: PixelQueryGroup,
  config: PixelQueryBuilderConfig,
): string {
  return summaryTreeToText(buildQuerySummaryTree(query, config));
}

export { buildQuerySummaryTree } from './pixel-query-summary.utils';
