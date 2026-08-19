import type { Provider } from '@angular/core';
import { TitleStrategy } from '@angular/router';
import { PIXEL_TITLE_CONFIG, type PixelTitleConfig } from './title.config';
import { PixelTitleStrategy } from './title.strategy';

/**
 * Supplies {@link PIXEL_TITLE_CONFIG}. When `syncRouterTitle` is true, also replaces
 * Angular's {@link TitleStrategy} with {@link PixelTitleStrategy} so there is one writer.
 *
 * {@link PixelTitleService} is `providedIn: 'root'` — this helper is only required to
 * override defaults or opt into router sync.
 *
 * @example
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [
 *     provideRouter(routes),
 *     providePixelTitle({ suffix: 'Acme', syncRouterTitle: true }),
 *   ],
 * });
 * ```
 */
export function providePixelTitle(config: PixelTitleConfig = {}): Provider[] {
  const providers: Provider[] = [{ provide: PIXEL_TITLE_CONFIG, useValue: config }];
  if (config.syncRouterTitle) {
    providers.push({ provide: TitleStrategy, useClass: PixelTitleStrategy });
  }
  return providers;
}
