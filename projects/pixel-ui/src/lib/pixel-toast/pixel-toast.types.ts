export type PixelToastType =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'default'
  | 'loading'
  | 'offline'
  | 'online'
  | 'system'
  | 'promise'
  | 'custom';

export type PixelToastSize = 'xs' | 'sm' | 'md' | 'lg';

export type PixelToastVariant = 'solid' | 'soft' | 'outlined';

/** `overlay` = fixed corner stack; `inline` = in-page flow via `pixel-toast-inline`. */
export type PixelToastPlacement = 'overlay' | 'inline';

export type PixelToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type PixelToastAnimation = 'fade' | 'slide' | 'scale' | 'stack' | 'collapse';

export type PixelToastRole = 'alert' | 'status';

export interface PixelToastAction {
  readonly id: string;
  readonly label: string;
  readonly ariaLabel?: string;
  readonly primary?: boolean;
}

export interface PixelToastClassValue {
  readonly [key: string]: boolean | string | number | null | undefined;
}

export interface PixelToastConfig {
  readonly type?: PixelToastType;
  readonly title?: string;
  readonly message?: string;
  readonly details?: string;
  readonly size?: PixelToastSize;
  readonly variant?: PixelToastVariant;
  readonly placement?: PixelToastPlacement;
  /** Target for `placement: 'inline'` — matches `pixel-toast-inline` `anchor` input. */
  readonly inlineAnchor?: string;
  readonly position?: PixelToastPosition;
  readonly animation?: PixelToastAnimation;
  readonly role?: PixelToastRole;
  readonly icon?: string;
  readonly avatarText?: string;
  readonly imageSrc?: string;
  readonly category?: string;
  readonly timestamp?: string | number | Date;
  readonly timeOut?: number;
  readonly extendedTimeOut?: number;
  readonly disableTimeOut?: boolean;
  readonly tapToDismiss?: boolean;
  readonly closeButton?: boolean;
  readonly progressBar?: boolean;
  readonly pauseOnHover?: boolean;
  readonly pauseOnFocus?: boolean;
  readonly newestOnTop?: boolean;
  readonly duplicatePrevention?: boolean;
  readonly duplicateKey?: string;
  readonly maxVisible?: number;
  readonly enableQueue?: boolean;
  readonly compact?: boolean;
  readonly expandable?: boolean;
  readonly expanded?: boolean;
  /** Max height of title/message/details (CSS length, e.g. `12rem`, `40vh`). Scrolls when exceeded. */
  readonly contentMaxHeight?: string;
  readonly swipeDismiss?: boolean;
  readonly className?: string | string[] | Record<string, boolean>;
  readonly ariaLabel?: string;
  readonly actions?: readonly PixelToastAction[];
  readonly undoAction?: PixelToastAction;
  readonly retryAction?: PixelToastAction;
  readonly onTap?: () => void;
  readonly onAction?: (actionId: string) => void;
  readonly onUndo?: () => void;
  readonly onRetry?: () => void;
  readonly onClose?: () => void;
}

export interface PixelToastGlobalConfig extends PixelToastConfig {
  readonly position?: PixelToastPosition;
  readonly maxVisible?: number;
  readonly enableQueue?: boolean;
  readonly newestOnTop?: boolean;
  readonly duplicatePrevention?: boolean;
  readonly pauseOnHover?: boolean;
  readonly pauseOnFocus?: boolean;
  readonly progressBar?: boolean;
  readonly closeButton?: boolean;
  readonly tapToDismiss?: boolean;
  readonly swipeDismiss?: boolean;
  readonly timeOut?: number;
  readonly variant?: PixelToastVariant;
  readonly size?: PixelToastSize;
  readonly animation?: PixelToastAnimation;
}

export interface PixelToastRecord {
  readonly id: string;
  readonly config: Required<
    Pick<
      PixelToastConfig,
      | 'type'
      | 'title'
      | 'message'
      | 'size'
      | 'variant'
      | 'placement'
      | 'inlineAnchor'
      | 'position'
      | 'animation'
      | 'role'
      | 'timeOut'
      | 'disableTimeOut'
      | 'tapToDismiss'
      | 'closeButton'
      | 'progressBar'
      | 'pauseOnHover'
      | 'pauseOnFocus'
      | 'compact'
      | 'expandable'
      | 'swipeDismiss'
    >
  > &
    PixelToastConfig;
  readonly createdAt: number;
  readonly progressPercent: number;
  readonly paused: boolean;
  readonly exiting: boolean;
  readonly expanded: boolean;
  readonly hovered: boolean;
  readonly focused: boolean;
}

export interface PixelToastDismissEvent {
  readonly id: string;
  readonly reason: 'timeout' | 'manual' | 'tap' | 'swipe' | 'escape' | 'action' | 'clear';
}

export interface PixelToastActionEvent {
  readonly id: string;
  readonly actionId: string;
}

export interface PixelToastPromiseMessages<T = unknown> {
  readonly loading: string | PixelToastConfig;
  readonly success: string | ((value: T) => string | PixelToastConfig);
  readonly error: string | ((error: unknown) => string | PixelToastConfig);
}
