import { Injectable, computed, inject, signal, type Signal } from '@angular/core';
import { evaluateAuthorization, resolveConfig } from './authorization.evaluate';
import {
  PIXEL_AUTHORIZATION_AUDIT,
  PIXEL_AUTHORIZATION_CONFIG,
  PIXEL_AUTHORIZATION_REMOTE_PDP,
  type PixelAuthorizationAuditEvent,
} from './authorization.tokens';
import type {
  PixelAccessDecision,
  PixelAccessExplainResult,
  PixelAuthorizationConfig,
  PixelAuthorizationContextStatus,
  PixelAuthorizationRequest,
  PixelAuthorizationResource,
  PixelAuthorizationSubject,
  PixelDeniedActionMode,
  PixelPermissionCatalog,
  PixelPolicy,
} from './authorization.types';

let nextRequestId = 0;

function newRequestId(): string {
  return `pixel-auth-${++nextRequestId}-${Date.now().toString(36)}`;
}

/**
 * Local authorization data plane (PDP) + signal helpers for PEP.
 * Server / remote PDP remains the security authority — local allow is UX only.
 */
@Injectable({ providedIn: 'root' })
export class PixelAuthorizationService {
  private readonly injectedConfig = inject(PIXEL_AUTHORIZATION_CONFIG, { optional: true });
  private readonly audit = inject(PIXEL_AUTHORIZATION_AUDIT, { optional: true });
  private readonly remotePdp = inject(PIXEL_AUTHORIZATION_REMOTE_PDP, { optional: true });

  private readonly configSignal = signal(resolveConfig(this.injectedConfig));
  private readonly subjectSignal = signal<PixelAuthorizationSubject | null>(null);
  private readonly catalogSignal = signal<PixelPermissionCatalog | null>(null);
  private readonly policiesSignal = signal<readonly PixelPolicy[]>([]);
  private readonly policyMetaVersion = signal<string | undefined>(undefined);
  private readonly statusSignal = signal<PixelAuthorizationContextStatus>('unknown');
  /** Bumps when subject/catalog/policies/config/status change — drives can()/access(). */
  private readonly revision = signal(0);

  readonly contextStatus: Signal<PixelAuthorizationContextStatus> = this.statusSignal.asReadonly();

  /**
   * Monotonic snapshot id. Use in an `effect` to re-run work when identity, catalog, or
   * policies change (e.g. route eviction). Templates should use {@link can} / {@link access}.
   */
  readonly snapshotVersion: Signal<number> = this.revision.asReadonly();

  readonly deniedActionMode: Signal<PixelDeniedActionMode> = computed(
    () => this.configSignal().deniedActionMode,
  );

  setConfig(config: PixelAuthorizationConfig): void {
    this.configSignal.set(resolveConfig({ ...this.configSignal(), ...config }));
    this.bump();
  }

  setSubject(subject: PixelAuthorizationSubject | null): void {
    this.subjectSignal.set(subject);
    this.statusSignal.set(subject ? 'ready' : 'unauthenticated');
    this.bump();
  }

  /**
   * Hydration / fetch lifecycle. Prefer `setSubject` for ready/unauthenticated;
   * use this for `loading` / `error` / explicit `unknown`.
   */
  setContextStatus(status: PixelAuthorizationContextStatus): void {
    this.statusSignal.set(status);
    this.bump();
  }

  setPermissionCatalog(catalog: PixelPermissionCatalog | null): void {
    this.catalogSignal.set(catalog);
    this.bump();
  }

  setPolicies(
    policies: readonly PixelPolicy[],
    meta?: { readonly version?: string },
  ): void {
    this.policiesSignal.set(policies);
    this.policyMetaVersion.set(meta?.version);
    this.bump();
  }

  /** Sync local PDP. */
  authorize(request: PixelAuthorizationRequest): PixelAccessDecision {
    const result = this.evaluateLocal(request, false);
    this.emitAudit(request, result.decision);
    return result.decision;
  }

  /**
   * Remote PDP when {@link PIXEL_AUTHORIZATION_REMOTE_PDP} is provided; otherwise local.
   * Failures / timeouts → deny (`remote-unavailable`). Pending emitted via audit while waiting.
   */
  async authorizeAsync(request: PixelAuthorizationRequest): Promise<PixelAccessDecision> {
    const requestId = newRequestId();
    const subject = this.subjectSignal();
    const status = this.statusSignal();

    if (status === 'unknown' || status === 'loading') {
      const pending: PixelAccessDecision = {
        status: 'pending',
        effect: 'deny',
        reason: 'not-ready',
        requestId,
        source: 'local',
      };
      this.emitAudit(request, pending);
      return pending;
    }

    if (!this.remotePdp || !subject || status !== 'ready') {
      const decision = this.authorize({ ...request });
      return { ...decision, requestId: decision.requestId ?? requestId };
    }

    this.emitAudit(request, {
      status: 'pending',
      effect: 'deny',
      reason: 'pending',
      requestId,
      source: 'remote',
    });

    try {
      const remote = await this.remotePdp.evaluate(request, subject);
      const decision: PixelAccessDecision = {
        ...remote,
        requestId: remote.requestId ?? requestId,
        source: remote.source ?? 'remote',
      };
      this.emitAudit(request, decision);
      return decision;
    } catch {
      const decision: PixelAccessDecision = {
        status: 'deny',
        effect: 'deny',
        reason: 'remote-unavailable',
        requestId,
        source: 'remote',
      };
      this.emitAudit(request, decision);
      return decision;
    }
  }

  /**
   * Reactive allow signal for templates. Create **once** per permission
   * (`readonly canExport = auth.can('claims:export')`) — do not call `can()` inside
   * another `computed` or repeatedly in the template.
   */
  can(
    permission: string,
    resource?: PixelAuthorizationResource,
  ): Signal<boolean> {
    return computed(() => {
      this.revision();
      return (
        this.evaluateLocal({ permission, resource, action: 'view' }, false).decision.status ===
        'allow'
      );
    });
  }

  /** Reactive full decision for a request. */
  access(request: PixelAuthorizationRequest): Signal<PixelAccessDecision> {
    return computed(() => {
      this.revision();
      return this.evaluateLocal(request, false).decision;
    });
  }

  /** Dev/QA decision trace — do not surface policy ids in end-user UI. */
  explain(request: PixelAuthorizationRequest): PixelAccessExplainResult {
    return this.evaluateLocal(request, true);
  }

  /**
   * Filters items by permission / request. Items without access metadata are kept.
   * Optional parent/children: hide parents when all children are denied.
   */
  filterAllowed<T>(
    items: readonly T[],
    getAccess: (item: T) => string | PixelAuthorizationRequest | undefined | null,
    options?: {
      readonly getChildren?: (item: T) => readonly T[] | undefined | null;
      /** Rebuild a parent with filtered children (required for nested nav trees). */
      readonly attachChildren?: (item: T, children: readonly T[]) => T;
      readonly hideEmptyParents?: boolean;
    },
  ): readonly T[] {
    const hideEmpty = options?.hideEmptyParents !== false;
    const getChildren = options?.getChildren;
    const attachChildren = options?.attachChildren;

    const visit = (list: readonly T[]): T[] => {
      const out: T[] = [];
      for (const item of list) {
        const children = getChildren?.(item);
        let nextChildren: T[] | undefined;
        if (children?.length) {
          nextChildren = visit(children);
        }

        const access = getAccess(item);
        let allowed = true;
        if (typeof access === 'string' && access.trim()) {
          allowed =
            this.authorize({ permission: access.trim(), action: 'navigate' }).status === 'allow';
        } else if (access && typeof access === 'object') {
          allowed = this.authorize(access).status === 'allow';
        }

        if (nextChildren) {
          if (!allowed) {
            continue;
          }
          if (hideEmpty && nextChildren.length === 0 && children!.length > 0) {
            continue;
          }
          out.push(attachChildren ? attachChildren(item, nextChildren) : item);
          continue;
        }

        if (allowed) {
          out.push(item);
        }
      }
      return out;
    };

    return visit(items);
  }

  /**
   * Whether PEP should keep chrome visible (skeleton / busy) instead of hiding.
   * True for `unknown` / `loading` context, or when decision is `pending`.
   */
  shouldShowWhilePending(decision?: PixelAccessDecision): boolean {
    const status = this.statusSignal();
    if (status === 'unknown' || status === 'loading') {
      return true;
    }
    return decision?.status === 'pending';
  }

  /** True when the decision is an actionable allow. */
  isAllowed(decision: PixelAccessDecision): boolean {
    return decision.status === 'allow';
  }

  private evaluateLocal(
    request: PixelAuthorizationRequest,
    explain: boolean,
  ): PixelAccessExplainResult {
    return evaluateAuthorization({
      request,
      subject: this.subjectSignal(),
      catalog: this.catalogSignal(),
      policies: this.policiesSignal(),
      config: this.configSignal(),
      contextStatus: this.statusSignal(),
      requestId: newRequestId(),
      explain,
    });
  }

  private bump(): void {
    this.revision.update((n) => n + 1);
  }

  private emitAudit(
    request: PixelAuthorizationRequest,
    decision: PixelAccessDecision,
  ): void {
    if (!this.audit) {
      return;
    }
    const name: PixelAuthorizationAuditEvent['name'] =
      decision.status === 'allow'
        ? 'access.allowed'
        : decision.status === 'pending'
          ? 'access.pending'
          : decision.reason === 'error' || decision.reason === 'remote-unavailable'
            ? 'access.error'
            : 'access.denied';
    this.audit.track({
      name,
      requestId: decision.requestId,
      permission: request.permission,
      action: request.action,
      resourceType: request.resource?.type,
      resourceId: request.resource?.id,
      reason: decision.reason,
      source: decision.source,
    });
  }
}
