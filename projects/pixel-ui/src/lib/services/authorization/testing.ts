import type { Provider } from '@angular/core';
import { PIXEL_AUTHORIZATION_EVALUATOR } from '../../shared/authorization-evaluator';
import { PixelAuthorizationService } from './authorization.service';
import type {
  PixelAuthorizationSubject,
  PixelPermissionCatalog,
  PixelPolicy,
} from './authorization.types';

/**
 * Test helper — seed subject/catalog/policies without bootstrapping a full app.
 *
 * ```ts
 * const auth = TestBed.inject(PixelAuthorizationService);
 * seedPixelAuthorization(auth, { subject: { roles: ['admin'] }, catalog });
 * ```
 */
export function seedPixelAuthorization(
  auth: PixelAuthorizationService,
  options: {
    readonly subject?: PixelAuthorizationSubject | null;
    readonly catalog?: PixelPermissionCatalog | null;
    readonly policies?: readonly PixelPolicy[];
    readonly contextStatus?: 'unknown' | 'loading' | 'ready' | 'error' | 'unauthenticated';
  },
): void {
  if (options.catalog !== undefined) {
    auth.setPermissionCatalog(options.catalog);
  }
  if (options.policies !== undefined) {
    auth.setPolicies(options.policies);
  }
  if (options.subject !== undefined) {
    auth.setSubject(options.subject);
  }
  if (options.contextStatus) {
    auth.setContextStatus(options.contextStatus);
  }
}

/**
 * Providers for isolated authorization tests (overrides root with a fresh service + evaluator bind).
 */
export function providePixelAuthorizationTesting(): Provider[] {
  return [
    PixelAuthorizationService,
    { provide: PIXEL_AUTHORIZATION_EVALUATOR, useExisting: PixelAuthorizationService },
  ];
}
