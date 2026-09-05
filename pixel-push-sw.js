/* eslint-disable no-restricted-globals */
/**
 * Reference Service Worker for pixel-ui Web Push.
 * Serve next to the docs app (local: `/pixel-push-sw.js`, GitHub Pages: `/pixel-ui/pixel-push-sw.js`)
 * and register with a matching scope (see `docs-push-sw.ts`).
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
  const nav = action?.nav || event.notification.data?.nav || payload?.notification?.data?.nav;
  const notificationId =
    event.notification.data?.notificationId || payload?.notification?.id || undefined;
  const openUrl = resolveOpenUrl(event.notification.data, nav, notificationId, actionId);

  await broadcast({
    type: 'pixel-push-click',
    notificationId,
    actionId,
    nav,
    payload,
    openUrl,
  });

  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  let fallback = null;
  for (const client of clients) {
    if (!fallback) {
      fallback = client;
    }
    if (client.url && openUrl && clientMatchesOpenUrl(client.url, openUrl)) {
      await focusAndNavigate(client, openUrl);
      return;
    }
  }
  if (fallback) {
    await focusAndNavigate(fallback, openUrl);
    return;
  }
  // Cold start only: open a deep link when no controlled client exists.
  await self.clients.openWindow(
    openUrl || withAppBase('/components/pixel-notification/examples'),
  );
}

async function focusAndNavigate(client, openUrl) {
  await client.focus();
  if (!openUrl || typeof client.navigate !== 'function') {
    return;
  }
  try {
    await client.navigate(new URL(openUrl, self.location.origin).href);
  } catch {
    /* navigate() unsupported / blocked — page bridge still has openUrl via postMessage */
  }
}

/** Directory of this SW script (`/` or `/pixel-ui/`). */
function appBasePath() {
  const pathname = self.location.pathname;
  const slash = pathname.lastIndexOf('/');
  return slash >= 0 ? pathname.slice(0, slash + 1) : '/';
}

/** Prefix app-absolute paths with the docs baseHref when hosted under a subpath. */
function withAppBase(path) {
  if (typeof path !== 'string' || !path.startsWith('/')) {
    return path;
  }
  const base = appBasePath();
  if (base === '/') {
    return path;
  }
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base;
  if (path === prefix || path.startsWith(prefix + '/')) {
    return path;
  }
  return prefix + path;
}

function appRelativePath(pathname) {
  const base = appBasePath();
  if (base === '/') {
    return pathname.replace(/\/$/, '') || '/';
  }
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base;
  if (pathname === prefix || pathname === base) {
    return '/';
  }
  if (pathname.startsWith(prefix + '/')) {
    return pathname.slice(prefix.length).replace(/\/$/, '') || '/';
  }
  return pathname.replace(/\/$/, '') || '/';
}

function clientMatchesOpenUrl(clientUrl, openUrl) {
  try {
    const clientRel = appRelativePath(new URL(clientUrl).pathname);
    const openRel = appRelativePath(new URL(openUrl, self.location.origin).pathname);
    return clientRel === openRel || (openRel !== '/' && clientRel.startsWith(openRel + '/'));
  } catch {
    return false;
  }
}

function resolveOpenUrl(data, nav, notificationId, actionId) {
  let url =
    typeof data?.openUrl === 'string' && data.openUrl.startsWith('/')
      ? data.openUrl
      : null;

  if (!url && typeof nav === 'string' && nav.startsWith('/')) {
    url = nav;
  }

  if (!url && nav && typeof nav === 'object' && Array.isArray(nav.route) && nav.route.length) {
    const path = '/' + nav.route.map((part) => encodeURIComponent(String(part))).join('/');
    const targets = Array.isArray(nav.target) ? nav.target : nav.target ? [nav.target] : [];
    const navParts = targets
      .filter((t) => t && t.type && (t.id || t.selector || t.gridId || t.panelId))
      .map((t) => {
        if (t.type === 'section' && t.id) {
          return 'section:' + encodeURIComponent(t.id);
        }
        if (t.type === 'tabs' && t.id != null) {
          return (
            'tabs:' +
            encodeURIComponent(String(t.id)) +
            ';tab:' +
            encodeURIComponent(String(t.tab))
          );
        }
        if (t.type === 'grid-row' && t.gridId != null) {
          return (
            'grid:' +
            encodeURIComponent(String(t.gridId)) +
            ';row:' +
            encodeURIComponent(String(t.rowId))
          );
        }
        if (t.type === 'accordion' && t.id) {
          return (
            'accordion:' +
            encodeURIComponent(String(t.id)) +
            ';panel:' +
            encodeURIComponent(String(t.panelId))
          );
        }
        if (t.type === 'stepper' && t.id != null) {
          return (
            'stepper:' +
            encodeURIComponent(String(t.id)) +
            ';step:' +
            encodeURIComponent(String(t.step))
          );
        }
        return '';
      })
      .filter(Boolean);
    if (navParts.length) {
      url = path + '?nav=' + encodeURIComponent(navParts.join('|'));
      const lastSection = [...targets].reverse().find((t) => t && t.type === 'section' && t.id);
      if (lastSection?.id) {
        url += '#' + encodeURIComponent(lastSection.id);
      }
    } else {
      url = path;
    }
  }

  if (!url) {
    url = '/components/pixel-notification/examples';
  }

  if (notificationId) {
    url = appendQuery(url, 'pixelPushId', String(notificationId));
  }
  if (actionId) {
    url = appendQuery(url, 'pixelPushAction', String(actionId));
  }
  return withAppBase(url);
}

function appendQuery(url, key, value) {
  const hashIndex = url.indexOf('#');
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : '';
  const base = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const join = base.includes('?') ? '&' : '?';
  return base + join + encodeURIComponent(key) + '=' + encodeURIComponent(value) + hash;
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
