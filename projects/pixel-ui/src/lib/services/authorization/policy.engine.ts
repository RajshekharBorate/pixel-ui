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

function resolveOperand(operand: unknown, env: EvalEnv): unknown {
  if (typeof operand === 'string' && operand.includes('.') && /^(subject|resource|context|request)\./.test(operand)) {
    return resolvePolicyPath(operand, env);
  }
  return operand;
}

/**
 * Evaluates a condition tree. Missing path → fail-closed (returns false).
 * No regex operators (ReDoS).
 */
export function evaluatePolicyCondition(
  condition: PixelPolicyCondition | undefined,
  env: EvalEnv,
): boolean {
  if (!condition) {
    return true;
  }
  if ('and' in condition) {
    return condition.and.every((c) => evaluatePolicyCondition(c, env));
  }
  if ('or' in condition) {
    return condition.or.some((c) => evaluatePolicyCondition(c, env));
  }
  if ('not' in condition) {
    return !evaluatePolicyCondition(condition.not, env);
  }
  if ('eq' in condition) {
    const [leftPath, rightRaw] = condition.eq;
    const left = resolvePolicyPath(leftPath, env);
    if (left === undefined) {
      return false;
    }
    return coerceComparable(left) === coerceComparable(resolveOperand(rightRaw, env));
  }
  if ('neq' in condition) {
    const [leftPath, rightRaw] = condition.neq;
    const left = resolvePolicyPath(leftPath, env);
    if (left === undefined) {
      return false;
    }
    return coerceComparable(left) !== coerceComparable(resolveOperand(rightRaw, env));
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
    const left = coerceComparable(resolvePolicyPath(leftPath, env));
    const right = coerceComparable(resolveOperand(rightRaw, env));
    if (left === null || right === null || typeof left === 'boolean' || typeof right === 'boolean') {
      return false;
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
      return false;
    }
    const needle = coerceComparable(left);
    return list.some((item) => coerceComparable(resolveOperand(item, env)) === needle);
  }
  if ('contains' in condition) {
    const [leftPath, itemRaw] = condition.contains;
    const left = resolvePolicyPath(leftPath, env);
    if (left === undefined) {
      return false;
    }
    const item = coerceComparable(resolveOperand(itemRaw, env));
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

export function isActivePolicy(policy: PixelPolicy): boolean {
  return (policy.status ?? 'active') === 'active';
}
