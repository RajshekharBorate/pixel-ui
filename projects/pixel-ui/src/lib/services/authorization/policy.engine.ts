import type {
  PixelAuthorizationRequest,
  PixelAuthorizationRequestContext,
  PixelAuthorizationResource,
  PixelAuthorizationSubject,
  PixelPolicy,
  PixelPolicyCondition,
} from './authorization.types';

type EvalEnv = {
  readonly subject: PixelAuthorizationSubject;
  readonly resource?: PixelAuthorizationResource;
  readonly context?: PixelAuthorizationRequestContext;
  readonly request: PixelAuthorizationRequest;
};

const FORBIDDEN_PATH_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor']);

/**
 * Safe path resolver — no Object.prototype traversal.
 * Paths: subject.*, resource.*, resource.attributes.*, context.*, request.permission, request.action
 */
export function resolvePolicyPath(path: string, env: EvalEnv): unknown {
  const segments = path.trim().split('.');
  if (!segments.length || segments.some((s) => !s || FORBIDDEN_PATH_SEGMENTS.has(s))) {
    return undefined;
  }
  const root = segments[0];
  let current: unknown;
  switch (root) {
    case 'subject':
      current = env.subject;
      break;
    case 'resource':
      current = env.resource;
      break;
    case 'context':
      current = env.context;
      break;
    case 'request':
      current = env.request;
      break;
    default:
      return undefined;
  }
  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i]!;
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    if (FORBIDDEN_PATH_SEGMENTS.has(seg)) {
      return undefined;
    }
    if (!Object.prototype.hasOwnProperty.call(current, seg)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[seg];
  }
  return current;
}

function coerceComparable(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed !== '' && !Number.isNaN(Number(trimmed)) && /^-?\d+(\.\d+)?$/.test(trimmed)) {
      return Number(trimmed);
    }
    return trimmed;
  }
  return String(value);
}

const PATH_OPERAND = /^(subject|resource|context|request)\./;

function isPathOperand(operand: unknown): operand is string {
  return typeof operand === 'string' && PATH_OPERAND.test(operand);
}

function resolveOperand(operand: unknown, env: EvalEnv): unknown {
  if (isPathOperand(operand)) {
    return resolvePolicyPath(operand, env);
  }
  return operand;
}

/** Condition evaluation: missing paths are `'unknown'` (not boolean false). */
export type PixelPolicyConditionTriState = boolean | 'unknown';

function collectConditionPaths(condition: PixelPolicyCondition | undefined): string[] {
  if (!condition) {
    return [];
  }
  if ('and' in condition) {
    return condition.and.flatMap(collectConditionPaths);
  }
  if ('or' in condition) {
    return condition.or.flatMap(collectConditionPaths);
  }
  if ('not' in condition) {
    return collectConditionPaths(condition.not);
  }
  const paths: string[] = [];
  const take = (operand: unknown): void => {
    if (isPathOperand(operand)) {
      paths.push(operand);
    }
  };
  if ('eq' in condition) {
    paths.push(condition.eq[0]);
    take(condition.eq[1]);
  } else if ('neq' in condition) {
    paths.push(condition.neq[0]);
    take(condition.neq[1]);
  } else if ('lt' in condition) {
    paths.push(condition.lt[0]);
    take(condition.lt[1]);
  } else if ('lte' in condition) {
    paths.push(condition.lte[0]);
    take(condition.lte[1]);
  } else if ('gt' in condition) {
    paths.push(condition.gt[0]);
    take(condition.gt[1]);
  } else if ('gte' in condition) {
    paths.push(condition.gte[0]);
    take(condition.gte[1]);
  } else if ('in' in condition) {
    paths.push(condition.in[0]);
    for (const item of condition.in[1]) {
      take(item);
    }
  } else if ('contains' in condition) {
    paths.push(condition.contains[0]);
    take(condition.contains[1]);
  }
  return paths;
}

/** True when any condition path reads `resource.*` (row/resource ABAC). */
export function conditionReferencesResource(
  condition: PixelPolicyCondition | undefined,
): boolean {
  return collectConditionPaths(condition).some((path) => path.startsWith('resource.'));
}

function evalTriState(
  condition: PixelPolicyCondition | undefined,
  env: EvalEnv,
): PixelPolicyConditionTriState {
  if (!condition) {
    return true;
  }
  if ('and' in condition) {
    let unknown = false;
    for (const child of condition.and) {
      const result = evalTriState(child, env);
      if (result === false) {
        return false;
      }
      if (result === 'unknown') {
        unknown = true;
      }
    }
    return unknown ? 'unknown' : true;
  }
  if ('or' in condition) {
    let unknown = false;
    for (const child of condition.or) {
      const result = evalTriState(child, env);
      if (result === true) {
        return true;
      }
      if (result === 'unknown') {
        unknown = true;
      }
    }
    return unknown ? 'unknown' : false;
  }
  if ('not' in condition) {
    const inner = evalTriState(condition.not, env);
    if (inner === 'unknown') {
      return 'unknown';
    }
    return !inner;
  }
  if ('eq' in condition) {
    const [leftPath, rightRaw] = condition.eq;
    const left = resolvePolicyPath(leftPath, env);
    if (left === undefined) {
      return 'unknown';
    }
    const right = resolveOperand(rightRaw, env);
    if (isPathOperand(rightRaw) && right === undefined) {
      return 'unknown';
    }
    return coerceComparable(left) === coerceComparable(right);
  }
  if ('neq' in condition) {
    const [leftPath, rightRaw] = condition.neq;
    const left = resolvePolicyPath(leftPath, env);
    if (left === undefined) {
      return 'unknown';
    }
    const right = resolveOperand(rightRaw, env);
    if (isPathOperand(rightRaw) && right === undefined) {
      return 'unknown';
    }
    return coerceComparable(left) !== coerceComparable(right);
  }
  if ('lt' in condition || 'lte' in condition || 'gt' in condition || 'gte' in condition) {
    const pair =
      'lt' in condition
        ? condition.lt
        : 'lte' in condition
          ? condition.lte
          : 'gt' in condition
            ? condition.gt
            : condition.gte;
    const [leftPath, rightRaw] = pair;
    const leftRaw = resolvePolicyPath(leftPath, env);
    if (leftRaw === undefined) {
      return 'unknown';
    }
    const rightResolved = resolveOperand(rightRaw, env);
    if (isPathOperand(rightRaw) && rightResolved === undefined) {
      return 'unknown';
    }
    const left = coerceComparable(leftRaw);
    const right = coerceComparable(rightResolved);
    if (left === null || right === null || typeof left === 'boolean' || typeof right === 'boolean') {
      return 'unknown';
    }
    if (typeof left === 'number' && typeof right === 'number') {
      if ('lt' in condition) return left < right;
      if ('lte' in condition) return left <= right;
      if ('gt' in condition) return left > right;
      return left >= right;
    }
    const ls = String(left);
    const rs = String(right);
    if ('lt' in condition) return ls < rs;
    if ('lte' in condition) return ls <= rs;
    if ('gt' in condition) return ls > rs;
    return ls >= rs;
  }
  if ('in' in condition) {
    const [leftPath, list] = condition.in;
    const left = resolvePolicyPath(leftPath, env);
    if (left === undefined) {
      return 'unknown';
    }
    const needle = coerceComparable(left);
    return list.some((item) => coerceComparable(resolveOperand(item, env)) === needle);
  }
  if ('contains' in condition) {
    const [leftPath, itemRaw] = condition.contains;
    const left = resolvePolicyPath(leftPath, env);
    if (left === undefined) {
      return 'unknown';
    }
    const itemResolved = resolveOperand(itemRaw, env);
    if (isPathOperand(itemRaw) && itemResolved === undefined) {
      return 'unknown';
    }
    const item = coerceComparable(itemResolved);
    if (Array.isArray(left)) {
      return left.some((entry) => coerceComparable(entry) === item);
    }
    if (typeof left === 'string' && typeof item === 'string') {
      return left.includes(item);
    }
    return false;
  }
  return false;
}

/**
 * Evaluates a condition tree. Missing path → fail-closed (`false`) for the public boolean API.
 * Use {@link evaluatePolicyConditionTriState} when deny vs skip must be distinguished.
 * No regex operators (ReDoS).
 */
export function evaluatePolicyCondition(
  condition: PixelPolicyCondition | undefined,
  env: EvalEnv,
): boolean {
  return evaluatePolicyConditionTriState(condition, env) === true;
}

/**
 * Tri-state condition eval. Missing attribute paths return `'unknown'` so `not`
 * cannot invert a missing path into a match, and deny policies can fail-closed.
 */
export function evaluatePolicyConditionTriState(
  condition: PixelPolicyCondition | undefined,
  env: EvalEnv,
): PixelPolicyConditionTriState {
  return evalTriState(condition, env);
}

export function policyMatchesTarget(
  policy: PixelPolicy,
  request: PixelAuthorizationRequest,
): boolean {
  const { target } = policy;
  if (target.actions?.length) {
    const action = request.action?.trim();
    if (!action || !target.actions.includes(action)) {
      return false;
    }
  }
  if (target.resourceTypes?.length) {
    const type = request.resource?.type;
    if (!type || !target.resourceTypes.includes(type)) {
      return false;
    }
  }
  if (target.permissions?.length) {
    const permission = request.permission?.trim();
    if (!permission || !target.permissions.includes(permission)) {
      return false;
    }
  }
  return true;
}

/**
 * Target match, plus resource-scoped conditions are skipped when the request has no resource
 * (chrome `can()` / `[pixelAccess]` must not be poisoned by row ABAC).
 */
export function isPolicyApplicable(
  policy: PixelPolicy,
  request: PixelAuthorizationRequest,
): boolean {
  if (!policyMatchesTarget(policy, request)) {
    return false;
  }
  if (!request.resource && conditionReferencesResource(policy.condition)) {
    return false;
  }
  return true;
}

export function isActivePolicy(policy: PixelPolicy): boolean {
  return (policy.status ?? 'active') === 'active';
}
