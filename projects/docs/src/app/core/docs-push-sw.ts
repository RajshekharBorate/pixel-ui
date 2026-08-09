/**
 * Docs Service Worker paths must honor Angular `baseHref` (GitHub Pages: `/pixel-ui/`).
 * Root-absolute `/pixel-push-sw.js` 404s in production and breaks OS notifications.
 */

function docsBaseHref(): string {
  if (typeof document === 'undefined') {
    return '/';
  }
  const fromDom = document.querySelector('base')?.getAttribute('href')?.trim();
  const raw = fromDom && fromDom.length > 0 ? fromDom : '/';
  return raw.endsWith('/') ? raw : `${raw}/`;
}

/** e.g. `/pixel-ui/pixel-push-sw.js` or `/pixel-push-sw.js` */
export function docsPixelPushServiceWorkerUrl(): string {
  return `${docsBaseHref()}pixel-push-sw.js`;
}

/** Scope covering the docs app, e.g. `/pixel-ui/` or `/`. */
export function docsPixelPushServiceWorkerScope(): string {
  return docsBaseHref();
}

/** Prefix an app-absolute path with docs `baseHref` when hosted under a subpath. */
export function withDocsBaseHref(path: string): string {
  if (!path.startsWith('/')) {
    return path;
  }
  const base = docsBaseHref().replace(/\/$/, '');
  if (!base) {
    return path;
  }
  if (path === base || path.startsWith(`${base}/`)) {
    return path;
  }
  return `${base}${path}`;
}

/**
 * Registers (or reuses) the docs push SW. Throws on failure so callers can surface
 * a clear error instead of falling back to page `Notification` (unsupported on Android).
 */
export async function ensureDocsPixelPushServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    throw new Error('Service Worker API unavailable in this browser.');
  }
  const scriptUrl = docsPixelPushServiceWorkerUrl();
  const scope = docsPixelPushServiceWorkerScope();
  const existing = await navigator.serviceWorker.getRegistration(scope);
  if (existing?.active || existing?.waiting || existing?.installing) {
    return existing;
  }
  try {
    return await navigator.serviceWorker.register(scriptUrl, { scope });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to register ${scriptUrl} (scope ${scope}): ${detail}`);
  }
}
