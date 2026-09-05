import type { Provider } from '@angular/core';
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

/** Minimal providers for isolated authorization tests (service is root — usually unused). */
export function providePixelAuthorizationTesting(): Provider[] {
  return [PixelAuthorizationService];
}
