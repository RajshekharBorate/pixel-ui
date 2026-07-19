import { Injectable, DestroyRef, inject, signal } from '@angular/core';
import {
  fromPersistedNotification,
  toPersistedNotification,
  type PixelNotificationClientMutation,
  type PixelNotificationTransportEvent,
} from './pixel-notification.adapters';
import {
  PIXEL_NOTIFICATION_ANALYTICS,
  PIXEL_NOTIFICATION_PERSISTENCE,
  PIXEL_NOTIFICATION_TRANSPORT,
} from './pixel-notification.config';
import { PixelNotificationService } from './pixel-notification.service';

const MULTI_TAB_CHANNEL = 'pixel-notification-sync';

type MultiTabMessage =
  | { readonly kind: 'persist'; readonly clientId: string }
  | {
      readonly kind: 'mutation';
      readonly clientId: string;
      readonly mutation: PixelNotificationClientMutation;
    };

let nextMutationId = 0;
let nextClientId = 0;

/**
 * Optional sync coordinator. Hydrates from persistence, applies transport events with
 * sequence/replay semantics, forwards optimistic local mutations, and mirrors changes across
 * tabs when `BroadcastChannel` is available. SSR-safe: browser APIs are guarded.
 */
@Injectable({ providedIn: 'root' })
export class PixelNotificationSyncService {
  private readonly notifications = inject(PixelNotificationService);
  private readonly persistence = inject(PIXEL_NOTIFICATION_PERSISTENCE, { optional: true });
  private readonly transport = inject(PIXEL_NOTIFICATION_TRANSPORT, { optional: true });
  private readonly analytics = inject(PIXEL_NOTIFICATION_ANALYTICS, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  private readonly clientId = `pixel-notification-client-${++nextClientId}`;
  private disconnectTransport: (() => void) | null = null;
  private broadcast: BroadcastChannel | null = null;
  private applyingRemote = false;
  private started = false;

  readonly connected = signal(false);
  readonly lastSequence = signal(0);
  readonly pendingMutationIds = signal<readonly string[]>([]);

  constructor() {
    this.destroyRef.onDestroy(() => this.stop());
  }

  /** Start hydration, transport, and multi-tab listeners. Idempotent. */
  async start(): Promise<void> {
    if (this.started || typeof document === 'undefined') {
      return;
    }
    this.started = true;
    await this.hydrateFromPersistence();
    this.connectTransport();
    this.connectMultiTab();
  }

  /** Tear down transport and multi-tab listeners. Persistence snapshot remains. */
  stop(): void {
    this.disconnectTransport?.();
    this.disconnectTransport = null;
    this.broadcast?.close();
    this.broadcast = null;
    if (this.connected()) {
      this.connected.set(false);
      this.analytics?.track({ name: 'sync_disconnected' });
    }
    this.started = false;
  }

  /** Apply a normalized transport event (also used by unit tests). */
  applyTransportEvent(event: PixelNotificationTransportEvent): void {
    if (
      event.sequence !== undefined &&
      event.type !== 'snapshot' &&
      event.type !== 'ack' &&
      event.type !== 'conflict' &&
      event.sequence <= this.lastSequence()
    ) {
      return;
    }

    if (event.sequence !== undefined && event.sequence > this.lastSequence()) {
      this.lastSequence.set(event.sequence);
    }

    this.applyingRemote = true;
    try {
      switch (event.type) {
        case 'snapshot':
          this.notifications.hydrate(event.notifications ?? []);
          break;
        case 'upsert':
          if (event.notification) {
            this.notifications.publish(event.notification, { source: 'remote' });
          }
          break;
        case 'update':
          if (event.id && event.patch) {
            this.notifications.update(event.id, event.patch, { source: 'remote' });
          }
          break;
        case 'remove':
          if (event.id) {
            this.notifications.remove(event.id, { source: 'remote' });
          }
          break;
        case 'read':
          if (event.id) {
            this.notifications.markRead(event.id, { source: 'remote' });
          }
          break;
        case 'unread':
          if (event.id) {
            this.notifications.markUnread(event.id, { source: 'remote' });
          }
          break;
        case 'archive':
          if (event.id) {
            this.notifications.archive(event.id, { source: 'remote' });
          }
          break;
        case 'restore':
          if (event.id) {
            this.notifications.restore(event.id, { source: 'remote' });
          }
          break;
        case 'mark-all-read':
          this.notifications.markAllRead({ source: 'remote' });
          break;
        case 'ack':
          this.clearPending(event.clientMutationId);
          break;
        case 'conflict':
          this.clearPending(event.clientMutationId);
          if (event.notification) {
            this.notifications.publish(event.notification, { source: 'remote' });
          }
          this.analytics?.track({
            name: 'sync_conflict',
            data: { clientMutationId: event.clientMutationId ?? null },
          });
          break;
        default:
          break;
      }
    } finally {
      this.applyingRemote = false;
    }

    void this.persistSnapshot();
  }

  /** Record a local mutation for optimistic transport + multi-tab fan-out. */
  notifyLocalMutation(mutation: Omit<PixelNotificationClientMutation, 'clientMutationId'>): void {
    if (this.applyingRemote || typeof document === 'undefined') {
      return;
    }

    const full: PixelNotificationClientMutation = {
      ...mutation,
      clientMutationId: `pixel-notification-mutation-${++nextMutationId}`,
    };
    this.pendingMutationIds.update((ids) => [...ids, full.clientMutationId]);
    void this.persistSnapshot();
    void this.transport?.send?.(full);
    this.postMultiTab({ kind: 'mutation', clientId: this.clientId, mutation: full });
  }

  private async hydrateFromPersistence(): Promise<void> {
    if (!this.persistence) {
      return;
    }
    const records = await this.persistence.load();
    this.notifications.hydrate(records.map(fromPersistedNotification));
  }

  private async persistSnapshot(): Promise<void> {
    if (!this.persistence) {
      return;
    }
    await this.persistence.save(
      this.notifications.notifications().map(toPersistedNotification),
    );
    this.postMultiTab({ kind: 'persist', clientId: this.clientId });
  }

  private connectTransport(): void {
    if (!this.transport) {
      return;
    }
    this.disconnectTransport?.();
    this.disconnectTransport = this.transport.connect((event) => this.applyTransportEvent(event));
    this.connected.set(true);
    this.analytics?.track({ name: 'sync_connected' });
    void this.transport.requestReplay?.(this.lastSequence());
    this.analytics?.track({
      name: 'sync_replay',
      data: { afterSequence: this.lastSequence() },
    });
  }

  private connectMultiTab(): void {
    if (typeof BroadcastChannel === 'undefined') {
      return;
    }
    this.broadcast?.close();
    this.broadcast = new BroadcastChannel(MULTI_TAB_CHANNEL);
    this.broadcast.onmessage = (message: MessageEvent<MultiTabMessage>) => {
      const data = message.data;
      if (!data || data.clientId === this.clientId) {
        return;
      }
      if (data.kind === 'persist') {
        void this.hydrateFromPersistence();
        return;
      }
      if (data.kind === 'mutation') {
        this.applyLocalMutationMirror(data.mutation);
      }
    };
  }

  private applyLocalMutationMirror(mutation: PixelNotificationClientMutation): void {
    this.applyingRemote = true;
    try {
      switch (mutation.type) {
        case 'publish':
          if (mutation.notification) {
            this.notifications.publish(mutation.notification, { source: 'remote' });
          }
          break;
        case 'update':
          if (mutation.id && mutation.patch) {
            this.notifications.update(mutation.id, mutation.patch, { source: 'remote' });
          }
          break;
        case 'read':
          if (mutation.id) {
            this.notifications.markRead(mutation.id, { source: 'remote' });
          }
          break;
        case 'unread':
          if (mutation.id) {
            this.notifications.markUnread(mutation.id, { source: 'remote' });
          }
          break;
        case 'archive':
          if (mutation.id) {
            this.notifications.archive(mutation.id, { source: 'remote' });
          }
          break;
        case 'restore':
          if (mutation.id) {
            this.notifications.restore(mutation.id, { source: 'remote' });
          }
          break;
        case 'remove':
          if (mutation.id) {
            this.notifications.remove(mutation.id, { source: 'remote' });
          }
          break;
        case 'mark-all-read':
          this.notifications.markAllRead({ source: 'remote' });
          break;
        case 'clear':
          this.notifications.clear({ source: 'remote' });
          break;
        default:
          break;
      }
    } finally {
      this.applyingRemote = false;
    }
  }

  private postMultiTab(message: MultiTabMessage): void {
    try {
      this.broadcast?.postMessage(message);
    } catch {
      // BroadcastChannel may throw in restricted contexts; sync remains single-tab.
    }
  }

  private clearPending(clientMutationId: string | undefined): void {
    if (!clientMutationId) {
      return;
    }
    this.pendingMutationIds.update((ids) =>
      ids.filter((candidate) => candidate !== clientMutationId),
    );
  }
}
