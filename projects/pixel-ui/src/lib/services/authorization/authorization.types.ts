/**
 * Pixel authorization — types for RBAC + ABAC data plane (UX PEP).
 * Server / remote PDP remains the security authority.
 */

export type PixelAccessAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'export'
  | 'approve'
  | 'navigate'
  | 'execute'
  | (string & {});

export type PixelAuthorizationContextStatus =
  | 'unknown'
  | 'loading'
  | 'ready'
  | 'error'
  | 'unauthenticated';

export type PixelAccessDecisionStatus = 'allow' | 'deny' | 'pending';

export type PixelAuthorizationReason =
  | 'rbac'
  | 'abac'
  | 'tenant'
  | 'default-deny'
  | 'default-allow'
  | 'error'
  | 'pending'
  | 'remote-unavailable'
  | 'unknown-permission'
  | 'unauthenticated'
  | 'not-ready';

/**
 * Catalog unknown-key behavior. `legacy-compatible` is a reserved alias of `strict` —
 * unknown keys always deny (D26); it never silent-allows.
 */
export type PixelAuthorizationCatalogMode = 'strict' | 'development' | 'legacy-compatible';

export type PixelDeniedActionMode = 'hide' | 'disable' | 'readonly';

export type PixelAuthorizationObligationType =
  | 'filter'
  | 'mask'
  | 'column-allow-list'
  | 'watermark'
  | 'approval-required';

export interface PixelAuthorizationObligation {
  readonly type: PixelAuthorizationObligationType;
  readonly value?: unknown;
}

export interface PixelAuthorizationSubject {
  readonly id?: string;
  /** Real user when impersonating — never used as effective subject. */
  readonly actorId?: string;
  readonly tenantId?: string;
  readonly impersonatorId?: string;
  readonly roles?: readonly string[];
  /** Direct / JIT grants — cannot override explicit deny policies. */
  readonly permissions?: readonly string[];
  readonly attributes?: Readonly<
    Record<string, string | number | boolean | readonly string[]>
  >;
}

/** Future-compatible role shape; v1 catalog uses flat role→permission map only. */
export interface PixelRole {
  readonly id: string;
  readonly permissions: readonly string[];
  readonly inherits?: readonly string[];
}

export interface PixelPermissionDefinition {
  readonly key: string;
  readonly description: string;
  readonly resourceType?: string;
  readonly actions?: readonly string[];
  readonly introducedIn?: string;
  readonly deprecated?: boolean;
  readonly replacement?: string;
  readonly removedIn?: string;
}

export interface PixelPermissionCatalog {
  readonly version: string;
  readonly roles: Readonly<Record<string, readonly string[]>>;
  readonly permissions?: Readonly<Record<string, PixelPermissionDefinition | { description: string }>>;
}

export interface PixelAuthorizationResource {
  readonly type: string;
  readonly id?: string;
  readonly parent?: { readonly type: string; readonly id: string };
  readonly attributes?: Readonly<Record<string, unknown>>;
}

export interface PixelAuthorizationRequestContext {
  readonly tenantId?: string;
  readonly organizationId?: string;
  readonly environment?: string;
  readonly region?: string;
  /** ISO timestamp from PIP — never client clock for ABAC time rules. */
  readonly now?: string;
  readonly [key: string]: unknown;
}

export interface PixelAuthorizationRequest {
  readonly action?: PixelAccessAction;
  readonly permission?: string;
  readonly resource?: PixelAuthorizationResource;
  readonly context?: PixelAuthorizationRequestContext;
}

export interface PixelAccessDecision {
  readonly status: PixelAccessDecisionStatus;
  readonly effect: 'allow' | 'deny';
  readonly reason?: PixelAuthorizationReason;
  readonly obligations?: readonly PixelAuthorizationObligation[];
  readonly requestId?: string;
  readonly policyId?: string;
  readonly policyVersion?: string;
  readonly catalogVersion?: string;
  readonly source?: 'local' | 'remote';
}

export type PixelPolicyStatus = 'proposed' | 'active' | 'deprecated';

export type PixelPolicyCondition =
  | { readonly and: readonly PixelPolicyCondition[] }
  | { readonly or: readonly PixelPolicyCondition[] }
  | { readonly not: PixelPolicyCondition }
  | { readonly eq: readonly [string, unknown] }
  | { readonly neq: readonly [string, unknown] }
  | { readonly lt: readonly [string, unknown] }
  | { readonly lte: readonly [string, unknown] }
  | { readonly gt: readonly [string, unknown] }
  | { readonly gte: readonly [string, unknown] }
  | { readonly in: readonly [string, readonly unknown[]] }
  | { readonly contains: readonly [string, unknown] };

export interface PixelPolicy {
  readonly id: string;
  readonly description?: string;
  readonly version?: string;
  readonly status?: PixelPolicyStatus;
  readonly effect: 'allow' | 'deny';
  readonly target: {
    readonly actions?: readonly string[];
    readonly resourceTypes?: readonly string[];
    readonly permissions?: readonly string[];
  };
  readonly condition?: PixelPolicyCondition;
  readonly obligations?: readonly PixelAuthorizationObligation[];
}

export interface PixelAuthorizationConfig {
  readonly defaultEffect?: 'allow' | 'deny';
  readonly deniedActionMode?: PixelDeniedActionMode;
  readonly catalogMode?: PixelAuthorizationCatalogMode;
  readonly debug?: boolean;
}

export interface PixelAccessExplainStep {
  readonly stage: 'tenant' | 'rbac' | 'policy' | 'default';
  readonly outcome: 'allow' | 'deny' | 'skip';
  readonly detail: string;
  readonly policyId?: string;
}

export interface PixelAccessExplainResult {
  readonly decision: PixelAccessDecision;
  readonly steps: readonly PixelAccessExplainStep[];
}

export const PIXEL_AUTHORIZATION_DEFAULT_CONFIG: Required<
  Pick<PixelAuthorizationConfig, 'defaultEffect' | 'deniedActionMode' | 'catalogMode' | 'debug'>
> = {
  defaultEffect: 'deny',
  deniedActionMode: 'hide',
  catalogMode: 'strict',
  debug: false,
};
