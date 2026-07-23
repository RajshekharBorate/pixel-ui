import { createDocExample } from '../../shared/example-source.util';
import { NavigateAdaptersExample } from './navigate-adapters.example';
import { NavigateBasicExample } from './navigate-basic.example';
import { NavigateContextExample } from './navigate-context.example';
import { NavigateGridExample } from './navigate-grid.example';
import { NavigateNotificationExample } from './navigate-notification.example';
import { NavigateWizardExample } from './navigate-wizard.example';

export const NAVIGATE_EXAMPLES = [
  createDocExample({
    id: 'navigate-basic',
    title: 'Section deep link',
    category: 'Basics',
    description:
      'Scroll, focus, and highlight a pixelNavAnchor target. Optional ?nav= sync and copy-link.',
    component: NavigateBasicExample,
    imports: ['PixelNavigateService', 'PixelNavAnchorDirective', 'PixelButtonComponent'],
    html: `<pixel-button (click)="goPayments()">Go to payments</pixel-button>
<section pixelNavAnchor="payments">…</section>`,
    typescript: `await this.navigate.go({
  target: { type: 'section', id: 'payments' },
  syncUrl: true,
});`,
  }),
  createDocExample({
    id: 'navigate-adapters',
    title: 'Tabs + accordion chain',
    category: 'Adapters',
    description:
      'Register tabs and accordion adapters, then chain targets so navigation activates each layer before scrolling to the section.',
    component: NavigateAdaptersExample,
    imports: [
      'PixelNavigateService',
      'PixelTabsComponent',
      'PixelExpansionPanelComponent',
      'PixelNavAnchorDirective',
    ],
    html: `<pixel-button (click)="goChain()">Open Billing (chain)</pixel-button>`,
    typescript: `navigate.registerAdapter({ id: 'settings', kind: 'tabs', activate: … });
await navigate.go({
  target: [
    { type: 'tabs', id: 'settings', tab: 1 },
    { type: 'accordion', id: 'help', panelId: 'billing' },
    { type: 'section', id: 'billing-detail' },
  ],
});`,
  }),
  createDocExample({
    id: 'navigate-grid',
    title: 'Grid row reveal',
    category: 'Data grid',
    description:
      'registerGrid + revealRow pages a client-paged grid to the row, selects it, and applies a highlight. Copy link includes first-class ?grid=&row=.',
    component: NavigateGridExample,
    imports: ['PixelNavigateService', 'PixelDataGridComponent', 'PixelButtonComponent'],
    html: `<pixel-button (click)="revealClaim()">Reveal TR-112</pixel-button>
<pixel-data-grid … />`,
    typescript: `navigate.registerGrid('claims', {
  revealRow: (rowId, opts) => this.grid().revealRow(rowId, opts),
});
await navigate.go({
  target: { type: 'grid-row', gridId: 'claims', rowId: 'TR-112' },
});`,
  }),
  createDocExample({
    id: 'navigate-notification',
    title: 'Notification → navigate',
    category: 'Notifications',
    description:
      'Publish with data.nav / action.nav, then openFromNotification on activate or action click. Mark read is optional; no auto-navigate by default.',
    component: NavigateNotificationExample,
    imports: [
      'PixelNavigateService',
      'PixelNotificationService',
      'PixelNotificationItemComponent',
      'PixelNavAnchorDirective',
    ],
    html: `<pixel-notification-item
  [notification]="item()"
  (activated)="onActivated(item()!)"
/>`,
    typescript: `notifications.publish({
  title: 'Documents ready',
  data: { nav: { target: { type: 'section', id: 'claim-docs' } } },
  actions: [{ id: 'review', label: 'Review', nav: { … } }],
});
await navigate.openFromNotification(n, { notifications });`,
  }),
  createDocExample({
    id: 'navigate-wizard',
    title: 'Opt-in wizard resume',
    category: 'Wizards',
    description:
      'Unregistered wizard: targets soft-fail. After registerWizard, go opens the surface and sets the step (Documents). Form field drafts stay application-owned.',
    component: NavigateWizardExample,
    imports: [
      'PixelNavigateService',
      'PixelStepperComponent',
      'PixelNavAnchorDirective',
      'PixelButtonComponent',
    ],
    html: `<pixel-button (click)="tryUnregistered()">Try without registration</pixel-button>
<pixel-button (click)="openDocuments()">Open Documents step</pixel-button>`,
    typescript: `navigate.registerWizard({
  id: 'claim-filing',
  syncUrl: true,
  open: async () => this.wizardOpen.set(true),
  setStep: async (step) => this.stepper()?.jumpTo(…),
});
await navigate.go({
  target: { type: 'wizard', id: 'claim-filing', step: 'documents' },
});`,
  }),
  createDocExample({
    id: 'navigate-context',
    title: 'Context stack & permission',
    category: 'Advanced',
    description:
      'pushContext on go, back() to restore the previous target, and setPermissionGuard for soft forbidden when navigation is disallowed.',
    component: NavigateContextExample,
    imports: ['PixelNavigateService', 'PixelNavAnchorDirective', 'PixelToggleComponent'],
    html: `<pixel-toggle [checked]="allowNav()" (checkedChange)="allowNav.set($event)" />
<pixel-button (click)="goAlpha()">Go to Alpha</pixel-button>
<pixel-button (click)="goBack()">Context back</pixel-button>`,
    typescript: `navigate.setPermissionGuard(() => this.allowNav());
await navigate.go({ target: { type: 'section', id: 'alpha' }, pushContext: true });
await navigate.back();`,
  }),
];
