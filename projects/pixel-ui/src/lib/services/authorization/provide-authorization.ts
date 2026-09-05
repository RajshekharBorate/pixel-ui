import type { EnvironmentProviders, Provider } from '@angular/core';
import { makeEnvironmentProviders } from '@angular/core';
import {
  PIXEL_AUTHORIZATION_AUDIT,
  PIXEL_AUTHORIZATION_CONFIG,
  PIXEL_AUTHORIZATION_REMOTE_PDP,
  type PixelAuthorizationAudit,
  type PixelPolicyDecisionAdapter,
} from './authorization.tokens';
import type { PixelAuthorizationConfig } from './authorization.types';

export interface ProvidePixelAuthorizationOptions {
  readonly config?: PixelAuthorizationConfig;
  readonly audit?: PixelAuthorizationAudit;
  readonly remotePdp?: PixelPolicyDecisionAdapter;
}

/**
 * Optional DI overrides for authorization. {@link PixelAuthorizationService} is
 * `providedIn: 'root'` — call this only to supply config, audit, or remote PDP.
 */
export function providePixelAuthorization(
  options: ProvidePixelAuthorizationOptions = {},
): EnvironmentProviders {
  const providers: Provider[] = [];
  if (options.config) {
    providers.push({ provide: PIXEL_AUTHORIZATION_CONFIG, useValue: options.config });
  }
  if (options.audit) {
    providers.push({ provide: PIXEL_AUTHORIZATION_AUDIT, useValue: options.audit });
  }
  if (options.remotePdp) {
    providers.push({ provide: PIXEL_AUTHORIZATION_REMOTE_PDP, useValue: options.remotePdp });
  }
  return makeEnvironmentProviders(providers);
}
