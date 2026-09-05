import {
  expandSubjectPermissions,
  isKnownPermission,
  permissionGranted,
} from './rbac.evaluator';
import {
  evaluatePolicyConditionTriState,
  isActivePolicy,
  isPolicyApplicable,
} from './policy.engine';
import type {
  PixelAccessDecision,
  PixelAccessExplainResult,
  PixelAccessExplainStep,
  PixelAuthorizationConfig,
  PixelAuthorizationObligation,
  PixelAuthorizationRequest,
  PixelAuthorizationResource,
  PixelAuthorizationSubject,
  PixelPermissionCatalog,
  PixelPolicy,
} from './authorization.types';
import { PIXEL_AUTHORIZATION_DEFAULT_CONFIG } from './authorization.types';

export type EvaluateAuthorizationInput = {
  readonly request: PixelAuthorizationRequest;
  readonly subject: PixelAuthorizationSubject | null;
  readonly catalog: PixelPermissionCatalog | null;
  readonly policies: readonly PixelPolicy[];
  readonly config: Required<
    Pick<PixelAuthorizationConfig, 'defaultEffect' | 'catalogMode' | 'debug'>
  >;
  readonly contextStatus: 'unknown' | 'loading' | 'ready' | 'error' | 'unauthenticated';
  readonly requestId: string;
  readonly explain?: boolean;
};

function mergeObligations(
  lists: readonly (readonly PixelAuthorizationObligation[] | undefined)[],
): readonly PixelAuthorizationObligation[] | undefined {
  const seen = new Set<string>();
  const out: PixelAuthorizationObligation[] = [];
  for (const list of lists) {
    for (const item of list ?? []) {
      const key = `${item.type}:${JSON.stringify(item.value ?? null)}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      out.push(item);
    }
  }
  return out.length ? out : undefined;
}

function normalizeTenantId(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

function resourceTenantId(resource?: PixelAuthorizationResource): string | undefined {
  return normalizeTenantId(resource?.attributes?.['tenantId']);
}

function tenantsDisagree(
  subjectTenant: string | undefined,
  contextTenant: string | undefined,
  resourceTenant: string | undefined,
): boolean {
  const ids = [subjectTenant, contextTenant, resourceTenant].filter(
    (id): id is string => !!id,
  );
  if (ids.length < 2) {
    return false;
  }
  return ids.some((id) => id !== ids[0]);
}

/**
 * Pure PDP evaluation (local). Used by {@link PixelAuthorizationService} and tests.
 */
export function evaluateAuthorization(input: EvaluateAuthorizationInput): PixelAccessExplainResult {
  const steps: PixelAccessExplainStep[] = [];
  const {
    request,
    subject,
    catalog,
    policies,
    config,
    contextStatus,
    requestId,
  } = input;
  const base: Pick<PixelAccessDecision, 'requestId' | 'catalogVersion' | 'source'> = {
    requestId,
    catalogVersion: catalog?.version,
    source: 'local',
  };

  const finish = (
    decision: PixelAccessDecision,
    step?: PixelAccessExplainStep,
  ): PixelAccessExplainResult => {
    if (step) {
      steps.push(step);
    }
    return { decision: { ...base, ...decision }, steps };
  };

  if (contextStatus === 'unknown' || contextStatus === 'loading') {
    return finish(
      { status: 'pending', effect: 'deny', reason: 'not-ready' },
      { stage: 'default', outcome: 'skip', detail: `contextStatus=${contextStatus}` },
    );
  }

  if (contextStatus === 'unauthenticated' || !subject) {
    return finish(
      { status: 'deny', effect: 'deny', reason: 'unauthenticated' },
      { stage: 'default', outcome: 'deny', detail: 'unauthenticated' },
    );
  }

  // Effective identity is `subject` (id, roles, permissions). `actorId` / `impersonatorId`
  // are audit-only and must never be evaluated as the subject (D24).

  if (contextStatus === 'error') {
    return finish(
      { status: 'deny', effect: 'deny', reason: 'error' },
      { stage: 'default', outcome: 'deny', detail: 'context error — fail-closed' },
    );
  }

  // D20 — tenant isolation: any two defined tenants among subject / context / resource must agree
  const subjectTenant = normalizeTenantId(subject.tenantId);
  const ctxTenant = normalizeTenantId(request.context?.tenantId);
  const resTenant = resourceTenantId(request.resource);
  if (tenantsDisagree(subjectTenant, ctxTenant, resTenant)) {
    return finish(
      { status: 'deny', effect: 'deny', reason: 'tenant' },
      {
        stage: 'tenant',
        outcome: 'deny',
        detail: `tenant mismatch subject=${subjectTenant ?? ''} context=${ctxTenant ?? ''} resource=${resTenant ?? ''}`,
      },
    );
  }
  steps.push({ stage: 'tenant', outcome: 'skip', detail: 'tenant ok or unset' });

  const env = {
    subject,
    resource: request.resource,
    context: request.context,
    request,
  };

  const activePolicies = policies.filter(isActivePolicy);
  const applicable = activePolicies.filter((p) => isPolicyApplicable(p, request));

  // Deterministic: collect all deny / allow matches (D19) — deny wins regardless of array order
  const denyHits: PixelPolicy[] = [];
  const allowHits: PixelPolicy[] = [];
  const applicableAllows: PixelPolicy[] = [];
  for (const policy of applicable) {
    const tri = evaluatePolicyConditionTriState(policy.condition, env);
    if (policy.effect === 'allow') {
      applicableAllows.push(policy);
      if (tri === true) {
        allowHits.push(policy);
      }
      continue;
    }
    // Deny: true OR unknown (missing attribute) → fail-closed deny
    if (tri === true || tri === 'unknown') {
      denyHits.push(policy);
    }
  }

  if (denyHits.length) {
    const policy = denyHits[0]!;
    return finish(
      {
        status: 'deny',
        effect: 'deny',
        reason: 'abac',
        policyId: policy.id,
        policyVersion: policy.version,
      },
      {
        stage: 'policy',
        outcome: 'deny',
        detail: `explicit deny (${denyHits.length} matched)`,
        policyId: policy.id,
      },
    );
  }

  const permission = request.permission?.trim();
  let rbacOk = true;
  if (permission) {
    if (!isKnownPermission(permission, catalog)) {
      if (config.catalogMode === 'development' || config.debug) {
        console.error(`[pixel-authorization] unknown permission key: ${permission}`);
      }
      // D26 — never silent allow (strict / development / legacy-compatible)
      return finish(
        { status: 'deny', effect: 'deny', reason: 'unknown-permission' },
        {
          stage: 'rbac',
          outcome: 'deny',
          detail: `unknown permission ${permission}`,
        },
      );
    }
    const granted = expandSubjectPermissions(subject.roles, subject.permissions, catalog);
    rbacOk = permissionGranted(permission, granted);
    steps.push({
      stage: 'rbac',
      outcome: rbacOk ? 'allow' : 'deny',
      detail: rbacOk ? `granted ${permission}` : `missing ${permission}`,
    });
    if (!rbacOk) {
      return finish({ status: 'deny', effect: 'deny', reason: 'rbac' });
    }
  } else {
    steps.push({ stage: 'rbac', outcome: 'skip', detail: 'no permission on request' });
  }

  const abacMode = activePolicies.length > 0;
  if (abacMode) {
    if (allowHits.length) {
      // Permission present ⇒ RBAC already necessary; ABAC allow is sufficient when matched
      const obligations = mergeObligations(allowHits.map((p) => p.obligations));
      const policy = allowHits[0]!;
      return finish(
        {
          status: 'allow',
          effect: 'allow',
          reason: 'abac',
          obligations,
          policyId: policy.id,
          policyVersion: policy.version,
        },
        {
          stage: 'policy',
          outcome: 'allow',
          detail: `allow policy union (${allowHits.length})`,
          policyId: policy.id,
        },
      );
    }

    // Has permission + RBAC ok but no allow policy matched
    if (permission && rbacOk) {
      // Only require a matching allow when an *allow* policy applies to this request.
      // Resource-scoped policies are not applicable to chrome (no resource).
      // Deny-only overlays do not force allow-policies for unrelated requests.
      if (applicableAllows.length > 0) {
        return finish(
          { status: 'deny', effect: 'deny', reason: 'abac' },
          {
            stage: 'policy',
            outcome: 'deny',
            detail: 'RBAC ok but no matching allow policy',
          },
        );
      }
      return finish(
        { status: 'allow', effect: 'allow', reason: 'rbac' },
        { stage: 'rbac', outcome: 'allow', detail: 'no applicable allow policies — RBAC allow' },
      );
    }

    // ABAC-only (no permission): need allow hit — already handled; else default
    const defaultAllow = config.defaultEffect === 'allow';
    return finish(
      {
        status: defaultAllow ? 'allow' : 'deny',
        effect: config.defaultEffect,
        reason: defaultAllow ? 'default-allow' : 'default-deny',
      },
      { stage: 'default', outcome: config.defaultEffect, detail: 'no allow policy matched' },
    );
  }

  // RBAC-only mode
  if (permission && rbacOk) {
    return finish(
      { status: 'allow', effect: 'allow', reason: 'rbac' },
      { stage: 'rbac', outcome: 'allow', detail: 'RBAC-only grant' },
    );
  }

  const defaultAllow = config.defaultEffect === 'allow';
  return finish(
    {
      status: defaultAllow ? 'allow' : 'deny',
      effect: config.defaultEffect,
      reason: defaultAllow ? 'default-allow' : 'default-deny',
    },
    { stage: 'default', outcome: config.defaultEffect, detail: 'defaultEffect' },
  );
}

export function resolveConfig(
  partial?: PixelAuthorizationConfig | null,
): Required<
  Pick<PixelAuthorizationConfig, 'defaultEffect' | 'deniedActionMode' | 'catalogMode' | 'debug'>
> {
  return { ...PIXEL_AUTHORIZATION_DEFAULT_CONFIG, ...partial };
}
