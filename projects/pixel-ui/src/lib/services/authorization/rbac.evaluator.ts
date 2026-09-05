import type { PixelAccessAction, PixelPermissionCatalog } from './authorization.types';

const KNOWN_ACTIONS = new Set<string>([
  'view',
  'create',
  'edit',
  'delete',
  'export',
  'approve',
  'navigate',
  'execute',
]);

/**
 * Infer a PDP action from a permission key so chrome `can('claims:export')` matches
 * policies that target `actions: ['export']`.
 *
 * Order: catalog `actions` when exactly one is listed → last `:` segment if it is a
 * known action → `'view'`.
 */
export function inferAccessAction(
  permission: string,
  catalog: PixelPermissionCatalog | null,
): PixelAccessAction {
  const key = permission.trim();
  if (!key) {
    return 'view';
  }
  const def = catalog?.permissions?.[key];
  if (def && 'actions' in def && Array.isArray(def.actions) && def.actions.length === 1) {
    const only = def.actions[0]?.trim();
    if (only) {
      return only as PixelAccessAction;
    }
  }
  const last = key.split(':').pop()?.trim();
  if (last && KNOWN_ACTIONS.has(last)) {
    return last as PixelAccessAction;
  }
  return 'view';
}

/**
 * Expands subject roles (+ direct permissions) against a catalog.
 * Wildcards: longest-prefix `claims:*` matches `claims:export` but not `claims:export:csv`
 * unless the catalog defines that segment. Bare `*` is ignored in production catalogs.
 */
export function expandSubjectPermissions(
  roles: readonly string[] | undefined,
  directPermissions: readonly string[] | undefined,
  catalog: PixelPermissionCatalog | null,
): ReadonlySet<string> {
  const granted = new Set<string>();
  for (const permission of directPermissions ?? []) {
    const key = permission.trim();
    if (key) {
      granted.add(key);
    }
  }
  if (!catalog) {
    return granted;
  }
  for (const role of roles ?? []) {
    const list = catalog.roles[role];
    if (!list) {
      continue;
    }
    for (const permission of list) {
      const key = permission.trim();
      if (!key || key === '*') {
        continue;
      }
      granted.add(key);
    }
  }
  return granted;
}

/**
 * Returns true when `permission` is granted by exact match or longest-prefix wildcard.
 * Unknown permission keys are the caller's responsibility (catalogMode).
 */
export function permissionGranted(
  permission: string,
  granted: ReadonlySet<string>,
): boolean {
  const key = permission.trim();
  if (!key) {
    return false;
  }
  if (granted.has(key)) {
    return true;
  }
  let bestLen = -1;
  let matched = false;
  for (const candidate of granted) {
    if (!candidate.endsWith(':*')) {
      continue;
    }
    const prefix = candidate.slice(0, -1); // keep trailing ':'
    if (key.startsWith(prefix) && !key.slice(prefix.length).includes(':')) {
      if (candidate.length > bestLen) {
        bestLen = candidate.length;
        matched = true;
      }
    }
  }
  return matched;
}

/** True when the catalog lists the permission key (or any wildcard that could cover it). */
export function isKnownPermission(
  permission: string,
  catalog: PixelPermissionCatalog | null,
): boolean {
  const key = permission.trim();
  if (!key || !catalog) {
    return !catalog ? true : false;
  }
  if (catalog.permissions && key in catalog.permissions) {
    return true;
  }
  for (const rolePerms of Object.values(catalog.roles)) {
    for (const entry of rolePerms) {
      if (entry === key) {
        return true;
      }
      if (entry.endsWith(':*')) {
        const prefix = entry.slice(0, -1);
        if (key.startsWith(prefix) && !key.slice(prefix.length).includes(':')) {
          return true;
        }
      }
    }
  }
  return false;
}
