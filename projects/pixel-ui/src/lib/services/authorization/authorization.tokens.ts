import { InjectionToken } from '@angular/core';
import type {
  PixelAccessDecision,
  PixelAuthorizationConfig,
  PixelAuthorizationRequest,
  PixelAuthorizationSubject,
} from './authorization.types';
import { PIXEL_AUTHORIZATION_DEFAULT_CONFIG } from './authorization.types';

export const PIXEL_AUTHORIZATION_CONFIG = new InjectionToken<PixelAuthorizationConfig>(
  'PIXEL_AUTHORIZATION_CONFIG',
  { providedIn: 'root', factory: () => ({ ...PIXEL_AUTHORIZATION_DEFAULT_CONFIG }) },
);

/**
 * Optional audit sink (SIEM / analytics). Metadata only — never policy conditions or PII.
 */
export interface PixelAuthorizationAuditEvent {
  readonly name: 'access.denied' | 'access.allowed' | 'access.pending' | 'access.error';
  readonly requestId?: string;
  readonly permission?: string;
  readonly action?: string;
  readonly resourceType?: string;
  readonly resourceId?: string;
  readonly reason?: string;
  readonly source?: 'local' | 'remote';
}

export interface PixelAuthorizationAudit {
  track(event: PixelAuthorizationAuditEvent): void;
}

export const PIXEL_AUTHORIZATION_AUDIT = new InjectionToken<PixelAuthorizationAudit>(
  'PIXEL_AUTHORIZATION_AUDIT',
);

/**
 * Remote Policy Decision Point adapter. Local engine remains for UX / offline.
 */
export interface PixelPolicyDecisionAdapter {
  readonly id: string;
  evaluate(
    request: PixelAuthorizationRequest,
    subject: PixelAuthorizationSubject,
  ): Promise<PixelAccessDecision>;
}

export const PIXEL_AUTHORIZATION_REMOTE_PDP = new InjectionToken<PixelPolicyDecisionAdapter>(
  'PIXEL_AUTHORIZATION_REMOTE_PDP',
);
