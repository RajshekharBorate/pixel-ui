import type {
  PixelAccessDecision,
  PixelAuthorizationRequest,
  PixelAuthorizationSubject,
} from './authorization.types';
import type { PixelPolicyDecisionAdapter } from './authorization.tokens';

/**
 * Remote PDP contract (Phase 6b). Implementations must fail closed on timeout/5xx —
 * never map errors to allow. Local UX engine remains separate.
 */
export type { PixelPolicyDecisionAdapter };

/** In-memory mock for tests and docs — always returns the configured decision. */
export class PixelMockPolicyDecisionAdapter implements PixelPolicyDecisionAdapter {
  readonly id = 'mock-pdp';

  constructor(
    private readonly decide: (
      request: PixelAuthorizationRequest,
      subject: PixelAuthorizationSubject,
    ) => PixelAccessDecision | Promise<PixelAccessDecision>,
  ) {}

  evaluate(
    request: PixelAuthorizationRequest,
    subject: PixelAuthorizationSubject,
  ): Promise<PixelAccessDecision> {
    return Promise.resolve(this.decide(request, subject));
  }
}

/**
 * Wraps a remote evaluator with a timeout. On timeout/reject → deny
 * (`reason: 'remote-unavailable'`).
 */
export function withRemotePdpTimeout(
  adapter: PixelPolicyDecisionAdapter,
  timeoutMs: number,
): PixelPolicyDecisionAdapter {
  return {
    id: `${adapter.id}:timeout-${timeoutMs}`,
    async evaluate(request, subject) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const result = await Promise.race([
          adapter.evaluate(request, subject),
          new Promise<PixelAccessDecision>((resolve) => {
            timer = setTimeout(() => {
              resolve({
                status: 'deny',
                effect: 'deny',
                reason: 'remote-unavailable',
                source: 'remote',
              });
            }, timeoutMs);
          }),
        ]);
        return result;
      } catch {
        return {
          status: 'deny',
          effect: 'deny',
          reason: 'remote-unavailable',
          source: 'remote',
        };
      } finally {
        if (timer !== undefined) {
          clearTimeout(timer);
        }
      }
    },
  };
}
