import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  model,
  output,
} from '@angular/core';
import PixelButtonComponent from '../pixel-button/pixel-button';
import PixelCheckboxComponent from '../pixel-checkbox/pixel-checkbox';
import PixelInputComponent from '../pixel-input/pixel-input';
import {
  PIXEL_NOTIFICATION_DEFAULT_PREFERENCES,
  type PixelNotificationPreferences,
} from './pixel-notification.adapters';
import {
  DEFAULT_NOTIFICATION_PREFERENCES_LABELS,
  formatPixelLabel,
  type PixelNotificationPreferencesLabels,
} from './pixel-notification-labels';
import type { PixelNotificationChannel } from './pixel-notification.types';

export type { PixelNotificationPreferencesLabels } from './pixel-notification-labels';
export {
  DEFAULT_NOTIFICATION_PREFERENCES_LABELS,
} from './pixel-notification-labels';

const INTERRUPT_CHANNELS: readonly PixelNotificationChannel[] = [
  'toast',
  'banner',
  'dialog',
];

/**
 * Controlled preferences surface for muting categories, disabling interruptive channels, and
 * configuring quiet hours. Emits preference snapshots; the application (or sync layer) persists.
 */
@Component({
  selector: 'pixel-notification-preferences',
  imports: [PixelButtonComponent, PixelCheckboxComponent, PixelInputComponent],
  templateUrl: './pixel-notification-preferences.html',
  styleUrl: './pixel-notification-preferences.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-notification-preferences',
    '[attr.data-compact]': 'compact() || null',
  },
})
export default class PixelNotificationPreferencesComponent {
  /**
   * @type {PixelNotificationPreferences}
   * @default PIXEL_NOTIFICATION_DEFAULT_PREFERENCES
   * @description Two-way preferences snapshot.
   */
  readonly preferences = model<PixelNotificationPreferences>({
    ...PIXEL_NOTIFICATION_DEFAULT_PREFERENCES,
  });

  /**
   * @type {readonly string[]}
   * @default []
   * @description Category chips offered for muting.
   */
  readonly categories = input<readonly string[]>([]);

  /**
   * @type {boolean}
   * @default false
   * @description Compact density for settings drawers.
   */
  readonly compact = input(false, { transform: booleanAttribute });

  /**
   * @type {string}
   * @default 'Notification preferences'
   * @description Accessible heading.
   */
  readonly heading = input('Notification preferences');

  /**
   * @type {Partial<PixelNotificationPreferencesLabels>}
   * @default {}
   * @description Partial override map for section headings, reset, quiet hours, and checkbox
   * labels. Merged with {@link DEFAULT_NOTIFICATION_PREFERENCES_LABELS}.
   */
  readonly labels = input<Partial<PixelNotificationPreferencesLabels>>({});

  readonly preferencesChange = output<PixelNotificationPreferences>();

  protected readonly mutedSet = computed(() => new Set(this.preferences().mutedCategories));
  protected readonly disabledChannelSet = computed(
    () => new Set(this.preferences().disabledChannels),
  );
  protected readonly interruptChannels = INTERRUPT_CHANNELS;
  /** Resolved preference chrome labels (defaults + `labels` overrides). */
  protected readonly l = computed(
    (): PixelNotificationPreferencesLabels => ({
      ...DEFAULT_NOTIFICATION_PREFERENCES_LABELS,
      ...this.labels(),
    }),
  );

  protected muteCategoryLabel(category: string): string {
    return formatPixelLabel(this.l().muteCategory, { category });
  }

  protected disableChannelLabel(channel: PixelNotificationChannel): string {
    return formatPixelLabel(this.l().disableChannel, { channel });
  }

  protected toggleCategory(category: string, muted: boolean): void {
    const mutedCategories = muted
      ? [...new Set([...this.preferences().mutedCategories, category])]
      : this.preferences().mutedCategories.filter((value) => value !== category);
    this.commit({ ...this.preferences(), mutedCategories });
  }

  protected toggleChannel(channel: PixelNotificationChannel, disabled: boolean): void {
    const disabledChannels = disabled
      ? [...new Set([...this.preferences().disabledChannels, channel])]
      : this.preferences().disabledChannels.filter((value) => value !== channel);
    this.commit({ ...this.preferences(), disabledChannels });
  }

  protected setQuietHoursEnabled(enabled: boolean): void {
    this.commit({ ...this.preferences(), quietHoursEnabled: enabled });
  }

  protected setQuietHoursStart(value: string): void {
    this.commit({ ...this.preferences(), quietHoursStart: value });
  }

  protected setQuietHoursEnd(value: string): void {
    this.commit({ ...this.preferences(), quietHoursEnd: value });
  }

  protected reset(): void {
    this.commit({ ...PIXEL_NOTIFICATION_DEFAULT_PREFERENCES });
  }

  private commit(next: PixelNotificationPreferences): void {
    this.preferences.set(next);
    this.preferencesChange.emit(next);
  }
}
