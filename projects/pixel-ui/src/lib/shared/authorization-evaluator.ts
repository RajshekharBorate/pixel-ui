import { InjectionToken, type Signal } from '@angular/core';
import type {
  PixelAccessDecision,
  PixelAuthorizationRequest,
} from '../services/authorization/authorization.types';

/**
 * Minimal PDP surface for presentational PEPs (grid, dialog, tabs, stepper).
 * Import this token — never {@link PixelAuthorizationService} — so unbound hosts
 * stay free of the policy engine (D9).
 *
 * Bind via {@link providePixelAuthorization} / {@link providePixelAuthorizationTesting}.
 * This file must not import the authorization service.
 */
export interface PixelAuthorizationEvaluator {
  /** Bumps when subject / catalog / policies / status change — read in `computed()`. */
  readonly snapshotVersion: Signal<number>;
  evaluate(request: PixelAuthorizationRequest): PixelAccessDecision;
  shouldShowWhilePending(decision?: PixelAccessDecision): boolean;
}

/**
 * Optional authorization evaluator. Prefer this over injecting the service by name
 * in presentational components. Unbound → fail-closed when `access` / `requires` /
 * `exportAccess` is set.
 */
export const PIXEL_AUTHORIZATION_EVALUATOR = new InjectionToken<PixelAuthorizationEvaluator>(
  'PIXEL_AUTHORIZATION_EVALUATOR',
);
