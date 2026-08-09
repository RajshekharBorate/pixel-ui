/* eslint-disable no-restricted-globals */
/**
 * Reference Service Worker for pixel-ui Web Push.
 * Serve from the app origin (docs: `/pixel-push-sw.js`) and register explicitly.
 *
 * Prefs: the page posts `{ type: 'pixel-push-prefs', preferences }` after login /
 * preference changes. SW keeps an in-memory copy (localStorage is not available here).
 *
 * OS visuals: mirrors `resolveOsNotificationVisuals` — avatar `imageSrc` → `icon`,
 * hero from `push.image` only, severity/ligature → Material Symbols gstatic SVG URLs.
 */
let prefsCache = null;

const MATERIAL_ICON_BASE =
  'https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined';

const SEVERITY_ICONS = {
  neutral: 'notifications',
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
};

self.addEventListener('message', (event) => {
  if (event.data?.type === 'pixel-push-prefs') {
    prefsCache = event.data.preferences || null;
  }
});

self.addEventListener('push', (event) => {
  event.waitUntil(handlePush(event));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(handleClick(event));
});

self.addEventListener('notificationclose', (event) => {
  event.waitUntil(
    broadcast({
      type: 'pixel-push-close',
      notificationId: event.notification.data?.notificationId,
      tag: event.notification.tag || undefined,
    }),
  );
});

async function handlePush(event) {
  const payload = parsePayload(event.data);
  if (!payload) {
    return;
  }
  await broadcast({ type: 'pixel-push-received', payload });
  if (!shouldShow(payload)) {
    return;
  }
  const title = payload.notification.title || 'Notification';
  const tag =
    payload.push?.tag ||
    payload.notification.dedupeKey ||
    payload.notification.id ||
    undefined;
  const actions = (payload.notification.actions || []).slice(0, 2).map((action) => ({
    action: action.id,
    title: action.label,
  }));
  const visuals = resolveVisuals(payload);
  await self.registration.showNotification(title, {
    body: payload.notification.message || '',
    tag,
    renotify: payload.push?.renotify ?? !!tag,
    requireInteraction:
      payload.push?.requireInteraction ?? payload.notification.priority === 'critical',
    silent: payload.push?.silent,
    icon: visuals.icon,
    image: visuals.image,
    badge: visuals.badge,
    timestamp: payload.push?.timestamp,
    data: {
      pixelPush: payload,
      notificationId: payload.notification.id,
      nav: payload.notification.data?.nav,
    },
    actions: actions.length ? actions : undefined,
  });
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

function materialUrl(name, sizePx) {
  const icon = String(name || 'notifications')
    .trim()
    .replace(/\s+/g, '_')
    .toLowerCase();
  return `${MATERIAL_ICON_BASE}/${encodeURIComponent(icon)}/default/${sizePx || 48}px.svg`;
}

function materialFromPayload(payload) {
  const ligature = (payload.notification.icon || '').trim();
  if (ligature && !isHttpUrl(ligature)) {
    return materialUrl(ligature, 48);
  }
  const severity = payload.notification.severity || 'neutral';
  return materialUrl(SEVERITY_ICONS[severity] || SEVERITY_ICONS.neutral, 48);
}

/** Keep in sync with `resolveOsNotificationVisuals` in pixel-notification-push.visuals.ts */
function resolveVisuals(payload) {
  const leading = payload.push?.leading || 'auto';
  const imageSrc = (payload.notification.imageSrc || '').trim();
  const pushIcon = (payload.push?.icon || '').trim();
  const pushImage = (payload.push?.image || '').trim();
  const pushBadge = (payload.push?.badge || '').trim();
  const notificationIcon = (payload.notification.icon || '').trim();
  const heroImage = pushImage || undefined;

  if (leading === 'none') {
    return { image: heroImage, badge: pushBadge || undefined };
  }

  let icon;
  let usedAvatar = false;

  if (pushIcon) {
    icon = pushIcon;
  } else if (leading === 'avatar') {
    icon = imageSrc || materialFromPayload(payload);
    usedAvatar = !!imageSrc;
  } else if (leading === 'severity') {
    icon = materialFromPayload(payload);
  } else if (leading === 'icon') {
    if (isHttpUrl(notificationIcon)) {
      icon = notificationIcon;
    } else if (notificationIcon) {
      icon = materialUrl(notificationIcon, 48);
    } else {
      icon = materialFromPayload(payload);
    }
  } else if (imageSrc) {
    icon = imageSrc;
    usedAvatar = true;
  } else if (isHttpUrl(notificationIcon)) {
    icon = notificationIcon;
  } else {
    icon = materialFromPayload(payload);
  }

  let badge = pushBadge || undefined;
  if (!badge && usedAvatar) {
    const severity = payload.notification.severity || 'neutral';
    badge = materialUrl(SEVERITY_ICONS[severity] || SEVERITY_ICONS.neutral, 24);
  }

  return { icon, image: heroImage, badge };
}

async function handleClick(event) {
  const payload = event.notification.data?.pixelPush;
  const actionId = event.action || undefined;
  const action = payload?.notification?.actions?.find((item) => item.id === actionId);
  const nav = action?.nav || event.notification.data?.nav;
  await broadcast({
    type: 'pixel-push-click',
    notificationId: event.notification.data?.notificationId || payload?.notification?.id,
    actionId,
    nav,
    payload,
  });
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clients) {
    if ('focus' in client) {
      await client.focus();
      // In-app navigate / invokeAction run in the focused page via the bridge.
      return;
    }
  }
  // Cold start only: open a window when no controlled client exists.
  if (typeof nav === 'string' && nav.startsWith('/')) {
    await self.clients.openWindow(nav);
  } else {
    await self.clients.openWindow('/');
  }
}

function parsePayload(data) {
  if (!data) {
    return null;
  }
  try {
    const value = typeof data.json === 'function' ? data.json() : JSON.parse(data.text());
    if (value?.notification?.title) {
      return value;
    }
    if (value?.title) {
      return { notification: value, push: value.push };
    }
  } catch {
    return null;
  }
  return null;
}

function shouldShow(payload) {
  const prefs = prefsCache;
  if (!prefs) {
    return true;
  }
  if ((prefs.disabledChannels || []).includes('push')) {
    return false;
  }
  const category = (payload.notification.category || '').trim();
  if (category && (prefs.mutedCategories || []).includes(category)) {
    return false;
  }
  return !isQuiet(prefs);
}

function isQuiet(prefs) {
  if (!prefs.quietHoursEnabled) {
    return false;
  }
  const start = parseHm(prefs.quietHoursStart);
  const end = parseHm(prefs.quietHoursEnd);
  if (start == null || end == null) {
    return false;
  }
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  if (start === end) {
    return true;
  }
  return start < end ? current >= start && current < end : current >= start || current < end;
}

function parseHm(value) {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(String(value || '').trim());
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

async function broadcast(message) {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of windows) {
    client.postMessage(message);
  }
}
