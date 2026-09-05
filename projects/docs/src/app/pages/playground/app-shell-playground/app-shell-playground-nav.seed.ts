import type { PixelNotificationService } from 'pixel-ui';

const CLAIMS = '/playground/app-shell/claims';
const BILLING = '/playground/app-shell/billing';
const SETTINGS = '/playground/app-shell/settings';

/** Seeds navigate deep-link notifications for the app-shell playground. */
export function seedAppShellNavigateNotifications(
  notifications: PixelNotificationService,
  force = false,
): void {
  if (!force && notifications.inbox().length > 0) {
    return;
  }
  if (force) {
    notifications.clear();
  }

  // Stable ids so BroadcastChannel markRead/archive fan-out matches across tabs.
  notifications.publishMany([
    {
      id: 'playground-nav-claim-tr-112',
      dedupeKey: 'playground-nav-claim-tr-112',
      title: 'Claim TR-112 needs review',
      message: 'Open the claims grid and jump to this row.',
      category: 'approvals',
      severity: 'warning',
      priority: 'high',
      source: 'Claims',
      icon: 'table_rows',
      createdAt: Date.now() - 1000 * 60 * 4,
      data: {
        nav: {
          route: [CLAIMS],
          target: { type: 'grid-row', gridId: 'claims', rowId: 'TR-112', select: true },
          syncUrl: true,
          behavior: 'smooth',
        },
      },
      actions: [
        {
          id: 'reveal',
          label: 'Reveal row',
          appearance: 'primary',
          nav: {
            route: [CLAIMS],
            target: { type: 'grid-row', gridId: 'claims', rowId: 'TR-112', select: true },
            syncUrl: true,
          },
        },
      ],
    },
    {
      id: 'playground-nav-billing-detail',
      dedupeKey: 'playground-nav-billing-detail',
      title: 'Invoice payment details updated',
      message: 'Review the Billing detail section under Invoices & payments.',
      category: 'finance',
      severity: 'info',
      source: 'Billing',
      icon: 'payments',
      createdAt: Date.now() - 1000 * 60 * 18,
      data: {
        nav: {
          route: [BILLING],
          target: [
            { type: 'tabs', id: 'settings', tab: 1 },
            { type: 'accordion', id: 'help', panelId: 'billing' },
            { type: 'section', id: 'billing-detail' },
          ],
          behavior: 'smooth',
        },
      },
      actions: [
        {
          id: 'open-billing',
          label: 'Open billing',
          appearance: 'primary',
          nav: {
            route: [BILLING],
            target: [
              { type: 'tabs', id: 'settings', tab: 1 },
              { type: 'accordion', id: 'help', panelId: 'billing' },
              { type: 'section', id: 'billing-detail' },
            ],
          },
        },
      ],
    },
    {
      id: 'playground-nav-claim-amendment',
      dedupeKey: 'playground-nav-claim-amendment',
      title: 'Continue claim amendment',
      message: 'Resume the filing wizard on the Documents step.',
      category: 'approvals',
      severity: 'info',
      source: 'Workflow',
      icon: 'view_timeline',
      createdAt: Date.now() - 1000 * 60 * 35,
      data: {
        nav: {
          route: [CLAIMS],
          target: { type: 'wizard', id: 'claim-amendment', step: 'documents' },
          syncUrl: true,
        },
      },
      actions: [
        {
          id: 'continue',
          label: 'Continue',
          appearance: 'primary',
          nav: {
            route: [CLAIMS],
            target: { type: 'wizard', id: 'claim-amendment', step: 'documents' },
            syncUrl: true,
          },
        },
      ],
    },
    {
      id: 'playground-nav-security-review',
      dedupeKey: 'playground-nav-security-review',
      title: 'Security review recommended',
      message: 'Review recent sign-in activity (Admin role / settings:view).',
      category: 'security',
      severity: 'warning',
      source: 'Security',
      icon: 'shield',
      createdAt: Date.now() - 1000 * 60 * 55,
      data: {
        nav: {
          route: [SETTINGS],
          target: { type: 'section', id: 'security-review' },
          behavior: 'smooth',
        },
      },
      actions: [
        {
          id: 'review',
          label: 'Review',
          appearance: 'primary',
          nav: {
            route: [SETTINGS],
            target: { type: 'section', id: 'security-review' },
          },
        },
      ],
    },
    {
      id: 'playground-nav-weekly-digest',
      dedupeKey: 'playground-nav-weekly-digest',
      title: 'Weekly digest delivered',
      message: 'Non-nav sample — activation only marks read.',
      category: 'reports',
      severity: 'info',
      source: 'Acme Reports',
      icon: 'mail',
      createdAt: Date.now() - 1000 * 60 * 60 * 26,
    },
  ]);
}
