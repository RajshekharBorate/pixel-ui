import type { PixelNotificationSeverity } from './pixel-notification.types';
import type {
  PixelPushLeadingVisual,
  PixelPushPayload,
  PixelPushVisualConfig,
} from './pixel-notification-push.types';

/** Default Google-hosted Material Symbols Outlined SVG base (no trailing slash). */
export const PIXEL_PUSH_MATERIAL_ICON_BASE_URL =
  'https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined';

export const DEFAULT_PIXEL_PUSH_VISUAL_CONFIG: PixelPushVisualConfig = {
  materialIconBaseUrl: PIXEL_PUSH_MATERIAL_ICON_BASE_URL,
  materialIconSize: 48,
  useMaterialSeverityIcons: true,
};

/** Same ligature map as in-app `pixel-notification-item` severity fallbacks. */
export const PIXEL_PUSH_SEVERITY_MATERIAL_ICONS: Readonly<
  Record<PixelNotificationSeverity, string>
> = {
  neutral: 'notifications',
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
};

export interface PixelOsNotificationVisuals {
  readonly icon?: string;
  readonly image?: string;
  readonly badge?: string;
}

/** True when the string looks like an absolute http(s) image URL. */
export function isPixelPushHttpUrl(value: string | null | undefined): boolean {
  if (!value?.trim()) {
    return false;
  }
  return /^https?:\/\//i.test(value.trim());
}

/**
 * Builds a Material Symbols Outlined SVG URL for a ligature name
 * (e.g. `warning` → gstatic `.../warning/default/48px.svg`).
 */
export function materialSymbolsOutlinedUrl(
  name: string,
  options?: {
    readonly baseUrl?: string;
    readonly sizePx?: number;
  },
): string {
  const icon = name.trim().replace(/\s+/g, '_').toLowerCase();
  const base = (options?.baseUrl ?? PIXEL_PUSH_MATERIAL_ICON_BASE_URL).replace(/\/$/, '');
  const size = options?.sizePx ?? 48;
  return `${base}/${encodeURIComponent(icon)}/default/${size}px.svg`;
}

export function severityToMaterialIconName(
  severity: PixelNotificationSeverity | string | undefined,
): string {
  const key = (severity ?? 'neutral') as PixelNotificationSeverity;
  return PIXEL_PUSH_SEVERITY_MATERIAL_ICONS[key] ?? PIXEL_PUSH_SEVERITY_MATERIAL_ICONS.neutral;
}

function materialUrlForName(
  name: string,
  config: PixelPushVisualConfig,
  sizePx?: number,
): string {
  return materialSymbolsOutlinedUrl(name, {
    baseUrl: config.materialIconBaseUrl ?? PIXEL_PUSH_MATERIAL_ICON_BASE_URL,
    sizePx: sizePx ?? config.materialIconSize ?? 48,
  });
}

function materialFromLigatureOrSeverity(
  payload: PixelPushPayload,
  config: PixelPushVisualConfig,
): string | undefined {
  if (config.useMaterialSeverityIcons === false) {
    return config.defaultIconUrl?.trim() || undefined;
  }
  const ligature = payload.notification.icon?.trim() ?? '';
  if (ligature && !isPixelPushHttpUrl(ligature)) {
    return materialUrlForName(ligature, config);
  }
  return materialUrlForName(
    severityToMaterialIconName(payload.notification.severity),
    config,
  );
}

/**
 * Resolves OS Notification `icon` / `image` / `badge` URLs.
 *
 * Precedence for `icon` when `leading` is `auto` (default):
 * 1. `push.icon`
 * 2. Avatar: `notification.imageSrc` → OS `icon` (not hero `image`)
 * 3. `notification.icon` when it is an http(s) URL
 * 4. Material SVG from ligature `notification.icon` or `severity`
 * 5. `config.defaultIconUrl`
 *
 * Hero `image` comes only from `push.image`.
 */
export function resolveOsNotificationVisuals(
  payload: PixelPushPayload,
  config: PixelPushVisualConfig = DEFAULT_PIXEL_PUSH_VISUAL_CONFIG,
): PixelOsNotificationVisuals {
  const leading: PixelPushLeadingVisual = payload.push?.leading ?? 'auto';
  const imageSrc = payload.notification.imageSrc?.trim() || '';
  const pushIcon = payload.push?.icon?.trim() || '';
  const pushImage = payload.push?.image?.trim() || '';
  const pushBadge = payload.push?.badge?.trim() || '';
  const notificationIcon = payload.notification.icon?.trim() || '';
  const heroImage = pushImage || undefined;
  const defaultIcon = config.defaultIconUrl?.trim() || undefined;

  if (leading === 'none') {
    return { image: heroImage, badge: pushBadge || undefined };
  }

  let icon: string | undefined;
  let usedAvatar = false;

  // 1. Explicit OS icon URL always wins (except leading === 'none').
  if (pushIcon) {
    icon = pushIcon;
  } else if (leading === 'avatar') {
    icon = imageSrc || materialFromLigatureOrSeverity(payload, config) || defaultIcon;
    usedAvatar = !!imageSrc;
  } else if (leading === 'severity') {
    icon = materialFromLigatureOrSeverity(payload, config) || defaultIcon;
  } else if (leading === 'icon') {
    if (isPixelPushHttpUrl(notificationIcon)) {
      icon = notificationIcon;
    } else if (notificationIcon) {
      icon =
        config.useMaterialSeverityIcons === false
          ? defaultIcon
          : materialUrlForName(notificationIcon, config);
    } else {
      icon = materialFromLigatureOrSeverity(payload, config) || defaultIcon;
    }
  } else {
    // auto
    if (imageSrc) {
      icon = imageSrc;
      usedAvatar = true;
    } else if (isPixelPushHttpUrl(notificationIcon)) {
      icon = notificationIcon;
    } else {
      icon = materialFromLigatureOrSeverity(payload, config) || defaultIcon;
    }
  }

  let badge = pushBadge || undefined;
  if (!badge && usedAvatar && config.useMaterialSeverityIcons !== false) {
    badge = materialUrlForName(
      severityToMaterialIconName(payload.notification.severity),
      config,
      24,
    );
  }

  return {
    icon: icon || undefined,
    image: heroImage,
    badge,
  };
}
