import type { Provider } from '@angular/core';
import {
  PIXEL_PUSH_PROMPT_SCHEDULER_OPTIONS,
  type ProvidePixelPushPromptSchedulerOptions,
} from './pixel-notification-push-prompt.scheduler.types';
import { PixelPushPromptScheduler } from './pixel-notification-push-prompt.scheduler';

export type { ProvidePixelPushPromptSchedulerOptions } from './pixel-notification-push-prompt.scheduler.types';

/**
 * Registers {@link PixelPushPromptScheduler} for enterprise soft-ask timing / dialog
 * presentation. Requires {@link providePixelPushNotifications} in a parent (or same) injector.
 *
 * Default `mode: 'manual'` — does not auto-open. Use `mode: 'delayed'` for a post-load soft-ask
 * dialog, or call `showAfterValueMoment()` after a product action.
 *
 * Never requests native notification permission by itself.
 */
export function providePixelPushPromptScheduler(
  options: ProvidePixelPushPromptSchedulerOptions = {},
): Provider[] {
  return [
    { provide: PIXEL_PUSH_PROMPT_SCHEDULER_OPTIONS, useValue: options },
    PixelPushPromptScheduler,
  ];
}
