import type { AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import type { Observable } from 'rxjs';

/** Logical combinator for a rule group. */
export type PixelQueryCondition = 'and' | 'or';

/** Supported comparison operators. */
export type PixelQueryOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'notIn'
  | 'between'
  | 'before'
  | 'after'
  | 'empty'
  | 'notEmpty';

/** Field value editor type. */
export type PixelQueryFieldType =
  | 'string'
  | 'number'
  | 'category'
  | 'multiselect'
  | 'date'
  | 'boolean'
  | 'custom';

/** Visual density preset. */
export type PixelQueryBuilderSize = 'xs' | 'sm' | 'md' | 'lg';

/** Visual layout preset. */
export type PixelQueryBuilderVariant = 'ruleset' | 'tree' | 'card' | 'compact';

/** Query preview presentation. */
export type PixelQuerySummaryMode = 'basic' | 'advanced';

/** Which query preview styles are available in the builder chrome. */
export type PixelQuerySummaryPreview = 'basic' | 'advanced' | 'both';

/** Localized copy for ruleset chrome. */
export interface PixelQueryBuilderMessages {
  readonly addRule?: string;
  readonly addRuleset?: string;
  readonly emptyGroup?: string;
}

/**
 * Overridable user-visible copy for query-builder chrome (preview, badges, rule editors).
 * Pass a partial via the `labels` input; merged with {@link DEFAULT_PIXEL_QUERY_BUILDER_LABELS}.
 * Placeholders: `{n}` for counts. `summaryLabel` remains a dedicated input for the preview title.
 */
export interface PixelQueryBuilderLabels {
  readonly basic: string;
  readonly advanced: string;
  readonly previewMode: string;
  readonly valid: string;
  readonly incomplete: string;
  /** Placeholder `{n}` = rule count. */
  readonly ruleCountOne: string;
  /** Placeholder `{n}` = rule count. */
  readonly ruleCountMany: string;
  readonly queryBadge: string;
  readonly rulesetBadge: string;
  readonly ruleBadge: string;
  readonly logicalOperator: string;
  readonly and: string;
  readonly or: string;
  readonly removeRuleset: string;
  readonly removeRule: string;
  readonly dragToReorder: string;
  readonly expandRule: string;
  readonly collapseRule: string;
  readonly expandQuery: string;
  readonly collapseQuery: string;
  readonly expandRuleset: string;
  readonly collapseRuleset: string;
  readonly expandQueryPreview: string;
  readonly collapseQueryPreview: string;
  readonly field: string;
  readonly operator: string;
  readonly value: string;
  readonly noValueNeeded: string;
  readonly noConditionsDefined: string;
  readonly notSet: string;
  readonly queryBuilder: string;
  readonly dateRange: string;
  /** Placeholder `{label}` = add-rule / add-ruleset button label. */
  readonly addWithLabel: string;
  /** Placeholders `{condition}` (AND/OR) and `{n}` (1-based depth). */
  readonly rulesetLevelAria: string;
  /** Placeholder `{condition}` — nested basic-summary nest label. */
  readonly conditionGroup: string;
  /** Placeholder `{condition}` — nested advanced-summary nest badge. */
  readonly conditionRuleset: string;
  readonly andJoiner: string;
  readonly orJoiner: string;
  readonly noFiltersYet: string;
  readonly noFiltersCopy: string;
  readonly yes: string;
  readonly no: string;
  readonly ellipsis: string;
}

/** Default English chrome copy for `pixel-query-builder`. */
export const DEFAULT_PIXEL_QUERY_BUILDER_LABELS: PixelQueryBuilderLabels = {
  basic: 'Basic',
  advanced: 'Advanced',
  previewMode: 'Preview mode',
  valid: 'Valid',
  incomplete: 'Incomplete',
  ruleCountOne: '{n} rule',
  ruleCountMany: '{n} rules',
  queryBadge: 'Query',
  rulesetBadge: 'Ruleset',
  ruleBadge: 'Rule',
  logicalOperator: 'Logical operator',
  and: 'AND',
  or: 'OR',
  removeRuleset: 'Remove ruleset',
  removeRule: 'Remove rule',
  dragToReorder: 'Drag to reorder',
  expandRule: 'Expand rule',
  collapseRule: 'Collapse rule',
  expandQuery: 'Expand query',
  collapseQuery: 'Collapse query',
  expandRuleset: 'Expand ruleset',
  collapseRuleset: 'Collapse ruleset',
  expandQueryPreview: 'Expand query preview',
  collapseQueryPreview: 'Collapse query preview',
  field: 'Field',
  operator: 'Operator',
  value: 'Value',
  noValueNeeded: 'No value needed',
  noConditionsDefined: 'No conditions defined',
  notSet: 'Not set',
  queryBuilder: 'Query builder',
  dateRange: 'Date range',
  addWithLabel: 'Add {label}',
  rulesetLevelAria: '{condition} ruleset, level {n}',
  conditionGroup: '{condition} group',
  conditionRuleset: '{condition} ruleset',
  andJoiner: 'and',
  orJoiner: 'or',
  noFiltersYet: 'No filters yet',
  noFiltersCopy: 'Add rules below to build your query. The live expression will appear here.',
  yes: 'Yes',
  no: 'No',
  ellipsis: '…',
};

/** Merges a partial labels map with {@link DEFAULT_PIXEL_QUERY_BUILDER_LABELS}. */
export function mergePixelQueryBuilderLabels(
  partial: Partial<PixelQueryBuilderLabels> = {},
): PixelQueryBuilderLabels {
  return { ...DEFAULT_PIXEL_QUERY_BUILDER_LABELS, ...partial };
}

/** Replaces `{key}` placeholders in a query-builder label template. */
export function formatQueryBuilderLabel(
  tpl: string,
  vars: Readonly<Record<string, string | number>> = {},
): string {
  return tpl.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match,
  );
}

/** Selectable option for category / multiselect fields. */
export interface PixelQueryFieldOption {
  readonly name: string;
  readonly value: unknown;
  readonly icon?: string;
  readonly subtitle?: string;
}

/** Context passed to async field option loaders. */
export interface PixelQueryRuleContext {
  readonly getRuleValue: (field: string) => unknown;
  readonly query: PixelQueryGroup;
  readonly ruleId: string;
}

/** Per-field configuration supplied by the consumer. */
export interface PixelQueryFieldConfig {
  readonly name: string;
  readonly type: PixelQueryFieldType;
  readonly icon?: string;
  readonly options?: readonly PixelQueryFieldOption[];
  readonly operators?: readonly PixelQueryOperator[];
  readonly defaultOperator?: PixelQueryOperator;
  readonly nullable?: boolean;
  readonly searchable?: boolean;
  readonly serverSearch?: boolean;
  readonly dependsOn?: readonly string[];
  readonly resolveOptions?: (
    ctx: PixelQueryRuleContext,
  ) => Observable<readonly PixelQueryFieldOption[]>;
  readonly loadOptions?: (
    query: string,
    ctx: PixelQueryRuleContext,
  ) => Observable<readonly PixelQueryFieldOption[]>;
  readonly validators?: readonly ValidatorFn[];
  readonly asyncValidators?: readonly AsyncValidatorFn[];
}

/** Top-level builder configuration. */
export interface PixelQueryBuilderConfig {
  readonly fields: Record<string, PixelQueryFieldConfig>;
  readonly maxDepth?: number;
  /** When false (default), a query with no rules is invalid. Set by `[required]` on the builder. */
  readonly allowEmpty?: boolean;
  readonly defaultCondition?: PixelQueryCondition;
  readonly operatorLabels?: Partial<Record<PixelQueryOperator, string>>;
  readonly messages?: PixelQueryBuilderMessages;
  /** Chrome / i18n copy (merged by the host with defaults + `labels` input). */
  readonly labels?: Partial<PixelQueryBuilderLabels>;
}

/** Resolved labels from a builder config (always complete). */
export function resolveQueryBuilderLabels(
  config: Pick<PixelQueryBuilderConfig, 'labels'> | null | undefined,
): PixelQueryBuilderLabels {
  return mergePixelQueryBuilderLabels(config?.labels);
}

/** Single leaf condition (internal model — includes stable id). */
export interface PixelQueryRule {
  readonly id: string;
  readonly field: string;
  readonly operator: string;
  readonly value: unknown;
}

/** Nested AND/OR group (internal model — includes stable id). */
export interface PixelQueryGroup {
  readonly id: string;
  readonly condition: PixelQueryCondition;
  readonly rules: readonly PixelQueryNode[];
}

export type PixelQueryNode = PixelQueryRule | PixelQueryGroup;

/** Root query shape used by the component. */
export type PixelQuery = PixelQueryGroup;

/** Exported rule without internal ids (API / persistence friendly). */
export interface PixelQueryExportRule {
  readonly field: string;
  readonly operator: string;
  readonly value: unknown;
}

/** Exported group without internal ids. */
export interface PixelQueryExportGroup {
  readonly condition: PixelQueryCondition;
  readonly rules: readonly (PixelQueryExportRule | PixelQueryExportGroup)[];
}

export type PixelQueryExport = PixelQueryExportGroup;

/** Validation issue for a specific rule. */
export interface PixelQueryRuleValidationIssue {
  readonly ruleId: string;
  readonly field?: string;
  readonly errors: Record<string, unknown>;
}

/** Validation issue for an empty nested ruleset. */
export interface PixelQueryGroupValidationIssue {
  readonly groupId: string;
  readonly errors: Record<string, unknown>;
}

/** Aggregate validation result for the whole tree. */
export interface PixelQueryValidationResult {
  readonly valid: boolean;
  readonly ruleIssues: readonly PixelQueryRuleValidationIssue[];
  readonly groupIssues: readonly PixelQueryGroupValidationIssue[];
  readonly empty: boolean;
}

/** Emitted when the user activates Run Query. */
export interface PixelQueryRunEvent {
  readonly query: PixelQuery;
  readonly export: PixelQueryExport;
  readonly summary: string;
}

/** Emitted when structure or values change. */
export interface PixelQueryChangeEvent {
  readonly query: PixelQuery;
  readonly export: PixelQueryExport;
  readonly valid: boolean;
  readonly summary: string;
}

/** Emitted when the user copies or downloads an export payload. */
export interface PixelQueryExportEvent {
  readonly export: PixelQueryExport;
  readonly json: string;
}

/** Emitted when an export payload is loaded into the builder. */
export interface PixelQueryImportEvent {
  readonly query: PixelQuery;
  readonly export: PixelQueryExport;
}

/** Result of parsing portable query JSON. */
export type PixelQueryExportParseResult =
  | { readonly ok: true; readonly export: PixelQueryExport }
  | { readonly ok: false; readonly error: string };

/** Visual summary node for a single rule. */
export interface PixelQuerySummaryRuleNode {
  readonly type: 'rule';
  readonly field: string;
  readonly fieldLabel: string;
  readonly fieldIcon?: string;
  readonly operator: string;
  readonly operatorLabel: string;
  readonly valueLabel: string | null;
  readonly incomplete: boolean;
}

/** Visual summary node for a nested ruleset. */
export interface PixelQuerySummaryGroupNode {
  readonly type: 'group';
  readonly condition: PixelQueryCondition;
  readonly children: readonly PixelQuerySummaryNode[];
}

export type PixelQuerySummaryNode = PixelQuerySummaryRuleNode | PixelQuerySummaryGroupNode;

/** Structured tree used by the live query preview panel. */
export interface PixelQuerySummaryTree {
  readonly empty: boolean;
  readonly root: PixelQuerySummaryGroupNode;
}
