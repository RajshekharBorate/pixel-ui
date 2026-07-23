export type PixelNotificationSeverity = 'neutral' | 'info' | 'success' | 'warning' | 'error';

export type PixelNotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export type PixelNotificationState = 'default' | 'loading' | 'completed' | 'failed';

export type PixelNotificationChannel = 'inbox' | 'toast' | 'banner' | 'dialog';

export type PixelNotificationActionAppearance = 'primary' | 'secondary' | 'danger';

export type PixelNotificationActionResult = void | Promise<void>;

export interface PixelNotificationActionContext {
  readonly notification: PixelNotification;
  readonly action: PixelNotificationAction;
}

export interface PixelNotificationAction {
  readonly id: string;
  readonly label: string;
  readonly ariaLabel?: string;
  readonly appearance?: PixelNotificationActionAppearance;
  readonly href?: string;
  readonly markRead?: boolean;
  /**
   * Optional deep-link for {@link PixelNavigateService} (`PixelNavigateRequest` shape or
   * `?nav=` string). Wins over `notification.data.nav` when the action is clicked.
   * Must be JSON-serializable (no handlers / Element refs).
   */
  readonly nav?: string | Readonly<Record<string, unknown>>;
  /**
   * Optional local action callback. Persistence adapters must omit functions and retain the
   * action id so applications can re-bind behavior after hydration.
   */
  readonly handler?: (context: PixelNotificationActionContext) => PixelNotificationActionResult;
}

export interface PixelNotificationCreate {
  readonly id?: string;
  readonly title: string;
  readonly message?: string;
  readonly severity?: PixelNotificationSeverity;
  readonly priority?: PixelNotificationPriority;
  readonly state?: PixelNotificationState;
  readonly category?: string;
  readonly source?: string;
  readonly icon?: string;
  readonly imageSrc?: string;
  readonly createdAt?: number | string | Date;
  readonly expiresAt?: number | string | Date | null;
  readonly progress?: number | null;
  readonly actions?: readonly PixelNotificationAction[];
  readonly channels?: readonly PixelNotificationChannel[];
  readonly dedupeKey?: string;
  readonly data?: Readonly<Record<string, unknown>>;
}

export interface PixelNotificationUpdate {
  readonly title?: string;
  readonly message?: string;
  readonly severity?: PixelNotificationSeverity;
  readonly priority?: PixelNotificationPriority;
  readonly state?: PixelNotificationState;
  readonly category?: string;
  readonly source?: string;
  readonly icon?: string;
  readonly imageSrc?: string;
  readonly expiresAt?: number | string | Date | null;
  readonly progress?: number | null;
  readonly actions?: readonly PixelNotificationAction[];
  readonly channels?: readonly PixelNotificationChannel[];
  readonly dedupeKey?: string;
  readonly data?: Readonly<Record<string, unknown>>;
}

export interface PixelNotification {
  readonly id: string;
  readonly title: string;
  readonly message: string;
  readonly severity: PixelNotificationSeverity;
  readonly priority: PixelNotificationPriority;
  readonly state: PixelNotificationState;
  readonly category: string;
  readonly source: string;
  readonly icon: string;
  readonly imageSrc: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly expiresAt: number | null;
  readonly readAt: number | null;
  readonly archivedAt: number | null;
  readonly progress: number | null;
  readonly occurrences: number;
  readonly actions: readonly PixelNotificationAction[];
  readonly channels: readonly PixelNotificationChannel[];
  readonly dedupeKey: string;
  readonly data: Readonly<Record<string, unknown>>;
}

export interface PixelNotificationRoute {
  readonly channels: readonly PixelNotificationChannel[];
}

export type PixelNotificationChannelPolicy = (
  notification: PixelNotification,
) => PixelNotificationRoute;

export interface PixelNotificationConfig {
  /** Maximum canonical records retained by the in-memory store. */
  readonly maxItems: number;
  readonly defaultSeverity: PixelNotificationSeverity;
  readonly defaultPriority: PixelNotificationPriority;
  /** Toast timeout for high-priority notifications. */
  readonly highPriorityToastTimeout: number;
  /** Keep critical toasts visible until the user dismisses them. */
  readonly criticalToastPersistent: boolean;
}

export interface PixelNotificationActionEvent {
  readonly notification: PixelNotification;
  readonly action: PixelNotificationAction;
}

export interface PixelNotificationChangeEvent {
  readonly type:
    | 'published'
    | 'updated'
    | 'read'
    | 'unread'
    | 'archived'
    | 'restored'
    | 'removed'
    | 'cleared';
  readonly notification: PixelNotification | null;
}
