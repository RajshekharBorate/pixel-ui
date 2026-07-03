import type { PixelToastGlobalConfig, PixelToastType } from './pixel-toast.types';

export const PIXEL_TOAST_DEFAULT_TIMEOUT = 5000;
export const PIXEL_TOAST_DEFAULT_MAX_VISIBLE = 5;

export const PIXEL_TOAST_DEFAULT_GLOBAL_CONFIG: PixelToastGlobalConfig = {
  position: 'top-right',
  maxVisible: PIXEL_TOAST_DEFAULT_MAX_VISIBLE,
  enableQueue: true,
  newestOnTop: true,
  duplicatePrevention: true,
  pauseOnHover: true,
  pauseOnFocus: true,
  progressBar: true,
  closeButton: true,
  tapToDismiss: false,
  swipeDismiss: true,
  timeOut: PIXEL_TOAST_DEFAULT_TIMEOUT,
  variant: 'soft',
  size: 'sm',
  animation: 'slide',
};

/** Material Symbols Outlined ligature names (see `_material-symbols.scss`). */
export const PIXEL_TOAST_TYPE_ICONS: Record<PixelToastType, string> = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
  default: 'notifications',
  loading: 'progress_activity',
  offline: 'cloud_off',
  online: 'cloud_done',
  system: 'settings',
  promise: 'hourglass_top',
  custom: 'notifications',
};

export const PIXEL_TOAST_SEMANTIC_TYPES: readonly PixelToastType[] = [
  'success',
  'error',
  'warning',
  'info',
] as const;
