import {
  coerceNavigateRequest,
  navigateRequestToUrl,
} from '../services/navigate/navigate-url';
import type { PixelNavigateRequest } from '../services/navigate/navigate.types';
import type { PixelPushPayload } from './pixel-notification-push.types';

/** Query param stamped on cold-start `openUrl` so the app can markRead after boot. */
export const PIXEL_PUSH_COLD_START_ID_PARAM = 'pixelPushId';

/** Query param stamped when the OS action id is known at click / open time. */
export const PIXEL_PUSH_COLD_START_ACTION_PARAM = 'pixelPushAction';

/**
 * Resolves JSON `action.nav` → `data.nav` into a {@link PixelNavigateRequest}.
 */
export function resolvePixelPushNavigateRequest(
  payload: PixelPushPayload,
  actionId?: string,
): PixelNavigateRequest | null {
  const action = actionId
    ? payload.notification.actions?.find((candidate) => candidate.id === actionId)
    : undefined;
  if (action?.nav != null) {
    const fromAction = coerceNavigateRequest(action.nav);
    if (fromAction) {
      return { ...fromAction, source: fromAction.source ?? 'notification' };
    }
  }
  const dataNav = payload.notification.data?.['nav'];
  if (dataNav != null) {
    const fromData = coerceNavigateRequest(dataNav);
    if (fromData) {
      return { ...fromData, source: fromData.source ?? 'notification' };
    }
  }
  return null;
}

/**
 * Builds a relative deep-link URL for SW `openWindow` / notification `data.openUrl`.
 * Appends cold-start id (and action when provided) for post-boot markRead / invokeAction.
 */
export function buildPixelPushOpenUrl(
  payload: PixelPushPayload,
  options?: { readonly actionId?: string },
): string | undefined {
  const request = resolvePixelPushNavigateRequest(payload, options?.actionId);
  if (!request) {
    return undefined;
  }
  let url = navigateRequestToUrl(request);
  const id = payload.notification.id?.trim();
  if (id) {
    url = appendQueryParam(url, PIXEL_PUSH_COLD_START_ID_PARAM, id);
  }
  const actionId = options?.actionId?.trim();
  if (actionId) {
    url = appendQueryParam(url, PIXEL_PUSH_COLD_START_ACTION_PARAM, actionId);
  }
  return url;
}

function appendQueryParam(url: string, key: string, value: string): string {
  const hashIndex = url.indexOf('#');
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : '';
  const withoutHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const join = withoutHash.includes('?') ? '&' : '?';
  return `${withoutHash}${join}${encodeURIComponent(key)}=${encodeURIComponent(value)}${hash}`;
}

/** True when `clientUrl` pathname starts with the deep-link path (best-effort focus preference). */
export function pixelPushClientMatchesOpenUrl(
  clientUrl: string,
  openUrl: string | undefined,
): boolean {
  if (!openUrl?.trim()) {
    return false;
  }
  try {
    const clientPath = new URL(clientUrl, 'https://pixel.local').pathname.replace(/\/$/, '') || '/';
    const openPath =
      new URL(openUrl, 'https://pixel.local').pathname.replace(/\/$/, '') || '/';
    return clientPath === openPath || clientPath.startsWith(`${openPath}/`);
  } catch {
    return false;
  }
}
