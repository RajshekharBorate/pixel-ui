/* eslint-disable no-restricted-globals */
/**
 * Reference Service Worker for pixel-ui Web Push.
 * Serve from the app origin (docs: `/pixel-push-sw.js`) and register explicitly.
 *
 * Prefs: the page posts `{ type: 'pixel-push-prefs', preferences }` after login /
 * preference changes. SW keeps an in-memory copy (localStorage is not available here).
 */
let prefsCache = null;

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
  await self.registration.showNotification(title, {
    body: payload.notification.message || '',
    tag,
    renotify: payload.push?.renotify ?? !!tag,
    requireInteraction:
      payload.push?.requireInteraction ?? payload.notification.priority === 'critical',
    silent: payload.push?.silent,
    image: payload.push?.image || payload.notification.imageSrc || undefined,
    badge: payload.push?.badge,
    timestamp: payload.push?.timestamp,
    data: {
      pixelPush: payload,
      notificationId: payload.notification.id,
      nav: payload.notification.data?.nav,
    },
    actions: actions.length ? actions : undefined,
  });
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
      return;
    }
  }
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
