import type {
  PixelNotification,
  PixelNotificationAction,
} from '../../pixel-notification/pixel-notification.types';
import type { PixelNotificationService } from '../../pixel-notification/pixel-notification.service';
import type { PixelNavigateService } from './navigate.service';
import { coerceNavigateRequest } from './navigate-url';
import type { PixelNavigateRequest, PixelNavigateResult } from './navigate.types';

/**
 * Resolves a navigate request from `action.nav` → `notification.data.nav` → `action.href`.
 * Returns `null` when nothing navigable is present (callers should no-op).
 */
export function getNotificationNavigateRequest(
  notification: PixelNotification,
  action?: PixelNotificationAction,
): PixelNavigateRequest | null {
  if (action?.nav != null) {
    const fromAction = coerceNavigateRequest(action.nav);
    if (fromAction) {
      return { ...fromAction, source: 'notification' };
    }
  }

  const dataNav = notification.data?.['nav'];
  if (dataNav != null) {
    const fromData = coerceNavigateRequest(dataNav);
    if (fromData) {
      return { ...fromData, source: 'notification' };
    }
  }

  if (action?.href) {
    const href = action.href.trim();
    if (!href || /^https?:\/\//i.test(href)) {
      return null;
    }
    const path = href.replace(/^\//, '');
    const [pathPart, hashPart] = path.split('#');
    const [pathname, search = ''] = pathPart.split('?');
    const route = pathname.split('/').filter(Boolean);
    const queryParams: Record<string, string> = {};
    if (search) {
      new URLSearchParams(search).forEach((value, key) => {
        queryParams[key] = value;
      });
    }
    return {
      route: route.length ? route : undefined,
      queryParams: Object.keys(queryParams).length ? queryParams : undefined,
      fragment: hashPart || undefined,
      source: 'notification',
    };
  }

  return null;
}

export interface OpenNotificationTargetOptions {
  readonly action?: PixelNotificationAction;
  /** @default true */
  readonly markRead?: boolean;
  readonly notifications?: PixelNotificationService | null;
}

/**
 * Mark read (optional) then {@link PixelNavigateService.go} when a nav payload exists.
 * Pass the navigate service explicitly — safe from event handlers.
 */
export async function openNotificationTarget(
  navigate: PixelNavigateService,
  notification: PixelNotification,
  options: OpenNotificationTargetOptions = {},
): Promise<PixelNavigateResult | null> {
  if (options.markRead !== false && options.notifications) {
    options.notifications.markRead(notification.id);
  }

  const request = getNotificationNavigateRequest(notification, options.action);
  if (!request) {
    return null;
  }
  return navigate.go(request);
}
