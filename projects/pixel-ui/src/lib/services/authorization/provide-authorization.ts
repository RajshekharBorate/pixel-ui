import type { EnvironmentProviders, Provider } from '@angular/core';
import { makeEnvironmentProviders } from '@angular/core';
import { PIXEL_AUTHORIZATION_EVALUATOR } from '../../shared/authorization-evaluator';
import {
  PIXEL_AUTHORIZATION_AUDIT,
  PIXEL_AUTHORIZATION_CONFIG,
  PIXEL_AUTHORIZATION_REMOTE_PDP,
  type PixelAuthorizationAudit,
  type PixelPolicyDecisionAdapter,
} from './authorization.tokens';
import type { PixelAuthorizationConfig } from './authorization.types';
import { PixelAuthorizationService } from './authorization.service';
import { withRemotePdpTimeout } from './policy.adapter';

export interface ProvidePixelAuthorizationOptions {
  readonly config?: PixelAuthorizationConfig;
  readonly audit?: PixelAuthorizationAudit;
  readonly remotePdp?: PixelPolicyDecisionAdapter;
  /**
   * Timeout for {@link remotePdp} in ms. Default `4000`. `0` skips wrapping.
   * Timeout / reject → deny (`remote-unavailable`). Does not change sync PEPs
   * (`[pixelAccess]`, `can()`, grid, guards) — those stay on the local engine.
   */
  readonly remotePdpTimeoutMs?: number;
}

/**
 * Optional DI overrides for authorization. {@link PixelAuthorizationService} is
 * `providedIn: 'root'` — call this to supply config / audit / remote PDP, or to
 * bind {@link PIXEL_AUTHORIZATION_EVALUATOR} in a non-root injector.
 */
export function providePixelAuthorization(
  options: ProvidePixelAuthorizationOptions = {},
): EnvironmentProviders {
  const providers: Provider[] = [
    { provide: PIXEL_AUTHORIZATION_EVALUATOR, useExisting: PixelAuthorizationService },
  ];
  if (options.config) {
    providers.push({ provide: PIXEL_AUTHORIZATION_CONFIG, useValue: options.config });
  }
  if (options.audit) {
    providers.push({ provide: PIXEL_AUTHORIZATION_AUDIT, useValue: options.audit });
  }
  if (options.remotePdp) {
    const timeoutMs = options.remotePdpTimeoutMs ?? 4000;
    const adapter =
      timeoutMs > 0 ? withRemotePdpTimeout(options.remotePdp, timeoutMs) : options.remotePdp;
    providers.push({ provide: PIXEL_AUTHORIZATION_REMOTE_PDP, useValue: adapter });
  }
  return makeEnvironmentProviders(providers);
}
