import type {
  PixelQueryBuilderConfig,
  PixelQueryCondition,
  PixelQueryExport,
  PixelQueryExportGroup,
  PixelQueryExportParseResult,
  PixelQueryExportRule,
  PixelQueryGroup,
  PixelQueryNode,
  PixelQueryRule,
} from './pixel-query-builder.types';

let nextQueryNodeId = 0;

/** Creates a stable node id for drag/drop and form wiring. */
export function createQueryNodeId(prefix = 'qb'): string {
  nextQueryNodeId += 1;
  return `${prefix}-${nextQueryNodeId}`;
}

/** Type guard for nested groups. */
export function isQueryGroup(node: PixelQueryNode): node is PixelQueryGroup {
  return 'condition' in node && Array.isArray(node.rules);
}

/** Creates a blank rule row. */
export function createQueryRule(
  partial?: Partial<Omit<PixelQueryRule, 'id'>> & { id?: string },
): PixelQueryRule {
  return {
    id: partial?.id ?? createQueryNodeId('rule'),
    field: partial?.field ?? '',
    operator: partial?.operator ?? '',
    value: partial?.value ?? null,
  };
}

/** Creates an empty group. */
export function createQueryGroup(
  condition: PixelQueryCondition = 'and',
  rules: readonly PixelQueryNode[] = [],
): PixelQueryGroup {
  return {
    id: createQueryNodeId('group'),
    condition,
    rules,
  };
}

/** Default root query tree. */
export function createEmptyQuery(
  condition: PixelQueryCondition = 'and',
): PixelQueryGroup {
  return createQueryGroup(condition, []);
}

/** Coerces partial / exported trees into a valid in-memory query group. */
export function normalizeQueryGroup(
  input: Partial<PixelQueryGroup> | PixelQueryExportGroup | null | undefined,
  fallbackCondition: PixelQueryCondition = 'and',
): PixelQueryGroup {
  if (!input || typeof input !== 'object') {
    return createEmptyQuery(fallbackCondition);
  }

  const condition =
    input.condition === 'or' ? 'or' : input.condition === 'and' ? 'and' : fallbackCondition;
  const rawRules = 'rules' in input && Array.isArray(input.rules) ? input.rules : [];
  const rules = rawRules.map((child) => normalizeQueryNode(child, fallbackCondition));
  const id =
    'id' in input && typeof input.id === 'string' && input.id.trim()
      ? input.id
      : createQueryNodeId('group');

  return { id, condition, rules };
}

function normalizeQueryNode(
  node: unknown,
  fallbackCondition: PixelQueryCondition,
): PixelQueryNode {
  if (!node || typeof node !== 'object') {
    return createQueryRule();
  }

  const record = node as Record<string, unknown>;
  const isGroupNode =
    record['condition'] === 'and' ||
    record['condition'] === 'or' ||
    (Array.isArray(record['rules']) &&
      !('field' in record) &&
      !('operator' in record));

  if (isGroupNode) {
    return normalizeQueryGroup(node as PixelQueryExportGroup, fallbackCondition);
  }

  const rule = node as Partial<PixelQueryRule> & Partial<PixelQueryExportRule>;
  return createQueryRule({
    id: typeof rule.id === 'string' ? rule.id : undefined,
    field: typeof rule.field === 'string' ? rule.field : '',
    operator: typeof rule.operator === 'string' ? rule.operator : '',
    value: rule.value ?? null,
  });
}

/** Deep clone while preserving ids. */
export function cloneQueryNode<T extends PixelQueryNode>(node: T): T {
  if (isQueryGroup(node)) {
    return {
      ...node,
      rules: node.rules.map((child) => cloneQueryNode(child)),
    } as T;
  }
  return createQueryRule(node as Partial<PixelQueryRule> & { id?: string }) as T;
}

/** Normalizes and clones a full query tree. */
export function cloneQueryTree(
  root: Partial<PixelQueryGroup> | PixelQueryExportGroup | null | undefined,
): PixelQueryGroup {
  const normalized = normalizeQueryGroup(root);
  return {
    ...normalized,
    rules: normalized.rules.map((child) => cloneQueryNode(child)),
  };
}

/** Finds a group by id (depth-first). */
export function findQueryGroup(
  root: PixelQueryGroup,
  groupId: string,
): PixelQueryGroup | null {
  if (root.id === groupId) {
    return root;
  }
  for (const child of root.rules) {
    if (isQueryGroup(child)) {
      const found = findQueryGroup(child, groupId);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/** Finds a rule by id. */
export function findQueryRule(root: PixelQueryGroup, ruleId: string): PixelQueryRule | null {
  for (const child of root.rules) {
    if (isQueryGroup(child)) {
      const found = findQueryRule(child, ruleId);
      if (found) {
        return found;
      }
    } else if (child.id === ruleId) {
      return child;
    }
  }
  return null;
}

/** Finds the parent group that directly contains `nodeId`. */
export function findParentGroup(
  root: PixelQueryGroup,
  nodeId: string,
): PixelQueryGroup | null {
  for (const child of root.rules) {
    if (child.id === nodeId) {
      return root;
    }
    if (isQueryGroup(child)) {
      const found = findParentGroup(child, nodeId);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

function mapGroup(
  group: PixelQueryGroup,
  groupId: string,
  mapper: (group: PixelQueryGroup) => PixelQueryGroup,
): PixelQueryGroup {
  if (group.id === groupId) {
    return mapper(group);
  }
  return {
    ...group,
    rules: group.rules.map((child) =>
      isQueryGroup(child) ? mapGroup(child, groupId, mapper) : child,
    ),
  };
}

/** Immutable update of a group anywhere in the tree. */
export function updateQueryGroup(
  root: PixelQueryGroup,
  groupId: string,
  updater: (group: PixelQueryGroup) => PixelQueryGroup,
): PixelQueryGroup {
  return mapGroup(root, groupId, updater);
}

/** Removes a node (rule or group) from the tree. */
export function removeQueryNode(root: PixelQueryGroup, nodeId: string): PixelQueryGroup {
  return {
    ...root,
    rules: root.rules
      .filter((child) => child.id !== nodeId)
      .map((child) => (isQueryGroup(child) ? removeQueryNode(child, nodeId) : child)),
  };
}

/** Adds a rule to a target group. */
export function addQueryRule(
  root: PixelQueryGroup,
  groupId: string,
  rule: PixelQueryRule = createQueryRule(),
): PixelQueryGroup {
  return updateQueryGroup(root, groupId, (group) => ({
    ...group,
    rules: [...group.rules, rule],
  }));
}

/** Adds a nested group to a target group. */
export function addQueryGroup(
  root: PixelQueryGroup,
  groupId: string,
  nested: PixelQueryGroup = createQueryGroup('or'),
): PixelQueryGroup {
  return updateQueryGroup(root, groupId, (group) => ({
    ...group,
    rules: [...group.rules, nested],
  }));
}

/** Updates a rule anywhere in the tree. */
export function updateQueryRule(
  root: PixelQueryGroup,
  ruleId: string,
  patch: Partial<Omit<PixelQueryRule, 'id'>>,
): PixelQueryGroup {
  return {
    ...root,
    rules: root.rules.map((child) => {
      if (isQueryGroup(child)) {
        return updateQueryRule(child, ruleId, patch);
      }
      if (child.id !== ruleId) {
        return child;
      }
      return { ...child, ...patch };
    }),
  };
}

/** Sets the combinator on a group. */
export function setQueryCondition(
  root: PixelQueryGroup,
  groupId: string,
  condition: PixelQueryCondition,
): PixelQueryGroup {
  return updateQueryGroup(root, groupId, (group) => ({ ...group, condition }));
}

/** Moves a rule within the same group. */
export function moveQueryRule(
  root: PixelQueryGroup,
  groupId: string,
  fromIndex: number,
  toIndex: number,
): PixelQueryGroup {
  return updateQueryGroup(root, groupId, (group) => {
    const next = [...group.rules];
    if (fromIndex < 0 || fromIndex >= next.length || toIndex < 0 || toIndex >= next.length) {
      return group;
    }
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    return { ...group, rules: next };
  });
}

/** Computes nesting depth of a group (root = 0). */
export function getGroupDepth(root: PixelQueryGroup, groupId: string, depth = 0): number {
  if (root.id === groupId) {
    return depth;
  }
  for (const child of root.rules) {
    if (isQueryGroup(child)) {
      const found = getGroupDepth(child, groupId, depth + 1);
      if (found >= 0) {
        return found;
      }
    }
  }
  return -1;
}

/** Counts leaf rules in the tree. */
export function countQueryRules(root: PixelQueryGroup): number {
  return root.rules.reduce((total, child) => {
    if (isQueryGroup(child)) {
      return total + countQueryRules(child);
    }
    return total + 1;
  }, 0);
}

/** Strips internal ids for API export. */
export function exportQuery(
  root: Partial<PixelQueryGroup> | PixelQueryExportGroup | null | undefined,
): PixelQueryExport {
  return exportGroup(normalizeQueryGroup(root));
}

function exportGroup(group: PixelQueryGroup): PixelQueryExportGroup {
  return {
    condition: group.condition,
    rules: (group.rules ?? []).map((child) =>
      isQueryGroup(child) ? exportGroup(child) : exportRule(child),
    ),
  };
}

function exportRule(rule: PixelQueryRule): PixelQueryExportRule {
  return {
    field: rule.field,
    operator: rule.operator,
    value: rule.value,
  };
}

/** Rehydrates an exported query with fresh internal ids. */
export function importQuery(
  exported: PixelQueryExport,
  config?: PixelQueryBuilderConfig,
): PixelQueryGroup {
  return importGroup(exported, config?.defaultCondition ?? 'and');
}

/** Serializes a portable export payload to JSON. */
export function serializeQueryExport(
  exported: PixelQueryExport,
  pretty = true,
): string {
  return pretty ? JSON.stringify(exported, null, 2) : JSON.stringify(exported);
}

/** Parses portable query JSON into an export payload. */
export function parseQueryExportJson(json: string): PixelQueryExportParseResult {
  const trimmed = json.trim();
  if (!trimmed) {
    return { ok: false, error: 'Paste a query JSON payload to import.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: 'Invalid JSON. Check the syntax and try again.' };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'Query export must be a JSON object.' };
  }

  const record = parsed as Record<string, unknown>;
  if (record['rules'] !== undefined && !Array.isArray(record['rules'])) {
    return { ok: false, error: 'Query export `rules` must be an array.' };
  }
  if (
    record['condition'] !== undefined &&
    record['condition'] !== 'and' &&
    record['condition'] !== 'or'
  ) {
    return { ok: false, error: 'Query export `condition` must be "and" or "or".' };
  }

  const exportPayload = parsed as PixelQueryExport;
  if (!isValidExportNode(exportPayload)) {
    return { ok: false, error: 'Query export contains invalid rule or ruleset nodes.' };
  }

  return { ok: true, export: exportPayload };
}

function isValidExportNode(node: unknown): boolean {
  if (!node || typeof node !== 'object' || Array.isArray(node)) {
    return false;
  }

  const record = node as Record<string, unknown>;
  if ('condition' in record && Array.isArray(record['rules'])) {
    return (record['rules'] as unknown[]).every((child) => isValidExportNode(child));
  }

  return (
    ('field' in record || 'operator' in record || 'value' in record) &&
    (record['field'] === undefined || typeof record['field'] === 'string') &&
    (record['operator'] === undefined || typeof record['operator'] === 'string')
  );
}

function importGroup(
  exported: PixelQueryExportGroup,
  fallbackCondition: PixelQueryCondition,
): PixelQueryGroup {
  const rules = Array.isArray(exported.rules) ? exported.rules : [];
  return createQueryGroup(exported.condition ?? fallbackCondition, rules.map((child) => {
    if ('condition' in child && Array.isArray(child.rules)) {
      return importGroup(child as PixelQueryExportGroup, fallbackCondition);
    }
    const rule = child as PixelQueryExportRule;
    return createQueryRule({
      field: rule.field ?? '',
      operator: rule.operator ?? '',
      value: rule.value ?? null,
    });
  }));
}

/** Human-readable hint for a combinator pill. */
export function conditionHint(condition: PixelQueryCondition): string {
  return condition === 'and'
    ? 'All conditions must be met'
    : 'At least one condition must be met';
}

/** Uppercase label for operator pills. */
export function conditionLabel(condition: PixelQueryCondition): string {
  return condition === 'and' ? 'AND' : 'OR';
}
