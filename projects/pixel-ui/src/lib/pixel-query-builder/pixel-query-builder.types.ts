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
