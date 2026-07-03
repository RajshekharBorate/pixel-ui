import type { PixelQueryFieldType, PixelQueryOperator } from './pixel-query-builder.types';

const DEFAULT_OPERATOR_LABELS: Record<PixelQueryOperator, string> = {
  equals: 'Equals',
  notEquals: 'Does not equal',
  contains: 'Contains',
  notContains: 'Does not contain',
  startsWith: 'Starts with',
  endsWith: 'Ends with',
  gt: 'Greater than',
  gte: 'Greater than or equal',
  lt: 'Less than',
  lte: 'Less than or equal',
  in: 'In',
  notIn: 'Not in',
  between: 'Between',
  before: 'Before',
  after: 'After',
  empty: 'Is null',
  notEmpty: 'Is not null',
};

const OPERATORS_BY_FIELD_TYPE: Record<PixelQueryFieldType, readonly PixelQueryOperator[]> = {
  string: [
    'equals',
    'notEquals',
    'contains',
    'notContains',
    'startsWith',
    'endsWith',
    'empty',
    'notEmpty',
  ],
  number: ['equals', 'notEquals', 'gt', 'gte', 'lt', 'lte', 'between', 'empty', 'notEmpty'],
  category: ['equals', 'notEquals', 'in', 'notIn', 'empty', 'notEmpty'],
  multiselect: ['in', 'notIn', 'empty', 'notEmpty'],
  date: ['equals', 'before', 'after', 'between', 'empty', 'notEmpty'],
  boolean: ['equals', 'notEquals'],
  custom: ['equals', 'notEquals', 'contains', 'empty', 'notEmpty'],
};

const DEFAULT_OPERATOR_BY_FIELD_TYPE: Record<PixelQueryFieldType, PixelQueryOperator> = {
  string: 'contains',
  number: 'equals',
  category: 'equals',
  multiselect: 'in',
  date: 'equals',
  boolean: 'equals',
  custom: 'equals',
};

/** Operators that do not require a value input. */
export const VALUELESS_QUERY_OPERATORS = new Set<PixelQueryOperator>(['empty', 'notEmpty']);

/** Operators that expect a range value (tuple). */
export const RANGE_QUERY_OPERATORS = new Set<PixelQueryOperator>(['between']);

/** Operators that expect multi-value arrays. */
export const MULTI_VALUE_QUERY_OPERATORS = new Set<PixelQueryOperator>(['in', 'notIn']);

/** Resolves operator label with optional config overrides. */
export function getQueryOperatorLabel(
  operator: PixelQueryOperator | string,
  overrides?: Partial<Record<PixelQueryOperator, string>>,
): string {
  const key = operator as PixelQueryOperator;
  return overrides?.[key] ?? DEFAULT_OPERATOR_LABELS[key] ?? operator;
}

/** Returns allowed operators for a field type, honouring per-field overrides. */
export function getOperatorsForFieldType(
  type: PixelQueryFieldType,
  fieldOperators?: readonly PixelQueryOperator[],
): readonly PixelQueryOperator[] {
  if (fieldOperators?.length) {
    return fieldOperators;
  }
  return OPERATORS_BY_FIELD_TYPE[type] ?? OPERATORS_BY_FIELD_TYPE.string;
}

/** Default operator when a field is first selected. */
export function getDefaultOperatorForFieldType(
  type: PixelQueryFieldType,
  fieldDefault?: PixelQueryOperator,
): PixelQueryOperator {
  return fieldDefault ?? DEFAULT_OPERATOR_BY_FIELD_TYPE[type] ?? 'equals';
}

/** Whether the operator needs a value editor. */
export function operatorNeedsValue(operator: string): boolean {
  return !VALUELESS_QUERY_OPERATORS.has(operator as PixelQueryOperator);
}

/** Whether the operator expects an array value. */
export function operatorExpectsMultiValue(operator: string): boolean {
  return MULTI_VALUE_QUERY_OPERATORS.has(operator as PixelQueryOperator);
}

/** Whether the operator expects a two-value range. */
export function operatorExpectsRange(operator: string): boolean {
  return RANGE_QUERY_OPERATORS.has(operator as PixelQueryOperator);
}
