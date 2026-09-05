import { createDocExample } from '../../shared/example-source.util';
import { AuthorizationAbacExample } from './authorization-abac.example';
import { AuthorizationBasicExample } from './authorization-basic.example';
import { AuthorizationExplainRemoteExample } from './authorization-explain-remote.example';
import { AuthorizationGridExample } from './authorization-grid.example';
import { AuthorizationHydrationExample } from './authorization-hydration.example';
import { AuthorizationNavExample } from './authorization-nav.example';
import { AuthorizationNavigateExample } from './authorization-navigate.example';
import { AuthorizationOverlaysExample } from './authorization-overlays.example';
import { AuthorizationPepModesExample } from './authorization-pep-modes.example';
import { AuthorizationRoutesExample } from './authorization-routes.example';
import { AuthorizationTabsStepperExample } from './authorization-tabs-stepper.example';

export const AUTHORIZATION_EXAMPLES = [
  createDocExample({
    id: 'authorization-basic',
    title: 'Hide vs disable the same action',
    category: 'Basics',
    description:
      'Act as Viewer or Exporter. Download export disappears when you cannot export; Approve export stays visible but disabled.',
    component: AuthorizationBasicExample,
    imports: ['PixelAuthorizationService', 'PixelAccessDirective', 'PixelButtonComponent'],
    html: `@if (canExport()) { <pixel-button>Download export</pixel-button> }
<pixel-button pixelAccess="claims:export" pixelAccessMode="disable">Approve export</pixel-button>`,
    typescript: `auth.setPermissionCatalog(catalog);
auth.setSubject({ id: 'u1', roles: ['viewer'] });`,
  }),
  createDocExample({
    id: 'authorization-pep-modes',
    title: 'What denied looks like: hide, disable, readonly',
    category: 'Buttons & fields',
    description:
      'Same “cannot export” decision, three UI outcomes. Switch to Exporter to see the allowed state.',
    component: AuthorizationPepModesExample,
    imports: ['PixelAccessDirective', 'PixelButtonComponent', 'PixelInputComponent'],
    html: `<pixel-button pixelAccess="claims:export" pixelAccessMode="hide">Export claims</pixel-button>
<pixel-input pixelAccess="claims:export" pixelAccessMode="readonly" />`,
    typescript: `auth.setSubject({ id: 'demo', roles: ['viewer'] });`,
  }),
  createDocExample({
    id: 'authorization-hydration',
    title: 'While we still don’t know who you are',
    category: 'Buttons & fields',
    description:
      'Do not hide Export during login. Buttons stay visible until roles load, then Viewer hides and Exporter keeps them.',
    component: AuthorizationHydrationExample,
    imports: ['PixelAuthorizationService', 'PixelAccessDirective'],
    html: `<pixel-button pixelAccess="claims:export" pixelAccessMode="hide">Export</pixel-button>`,
    typescript: `auth.setContextStatus('loading');
auth.setSubject({ id, roles });`,
  }),
  createDocExample({
    id: 'authorization-abac',
    title: 'This claim, right now (not just the job title)',
    category: 'This claim',
    description:
      'Adjuster can export and approve — except own claims, amounts over 10k, or another company’s claim.',
    component: AuthorizationAbacExample,
    imports: ['PixelAuthorizationService'],
    html: `<pixel-button [disabled]="!canApprove()">Approve</pixel-button>`,
    typescript: `auth.setPolicies(policies);
auth.authorize({ permission: 'claims:approve', action: 'approve', resource });`,
  }),
  createDocExample({
    id: 'authorization-nav',
    title: 'Menu links the person cannot open',
    category: 'Navigation',
    description:
      'Filter the sidenav so Viewer sees Claims only. Admin sees Exports and Settings. Empty Admin groups disappear.',
    component: AuthorizationNavExample,
    imports: ['PixelAuthorizationService'],
    html: `<ul>@for (item of visibleNav(); track item.id) { <li>{{ item.label }}</li> }</ul>`,
    typescript: `auth.filterAllowed(tree, (n) => n.access, {
  getChildren: (n) => n.children,
  attachChildren: (n, children) => ({ ...n, children }),
});`,
  }),
  createDocExample({
    id: 'authorization-navigate',
    title: 'Jumping to a section they cannot see',
    category: 'Navigation',
    description:
      'Workspace scroll works for anyone who can read claims. Settings jump is refused for Viewer, allowed for Admin.',
    component: AuthorizationNavigateExample,
    imports: [
      'PixelNavigateService',
      'createAuthorizationNavigateGuard',
      'PixelNavAnchorDirective',
    ],
    html: `<pixel-button (click)="goSettings()">Go to settings</pixel-button>
<section pixelNavAnchor="auth-settings">…</section>`,
    typescript: `navigate.setPermissionGuard(createAuthorizationNavigateGuard(auth));
await navigate.go({ target: { type: 'section', id: 'settings' }, access: 'settings:view' });`,
  }),
  createDocExample({
    id: 'authorization-routes',
    title: 'Don’t even download the admin page',
    category: 'Navigation',
    description:
      'A Viewer should not even download the admin page. Snippet only — try App shell playground for a live router.',
    component: AuthorizationRoutesExample,
    imports: [
      'pixelAuthorizationCanMatch',
      'pixelAuthorizationCanActivate',
      'providePixelAuthorizationRouteWatcher',
    ],
    html: `<!-- App routes config — see TypeScript tab -->`,
    typescript: `canMatch: [pixelAuthorizationCanMatch({ forbiddenUrl: '/home' })],
data: { access: 'admin:panel' },
providePixelAuthorizationRouteWatcher({ forbiddenUrl: '/home' }),`,
  }),
  createDocExample({
    id: 'authorization-grid',
    title: 'Grid export, SSN column, and row actions',
    category: 'Components',
    description:
      'One export permission drives the toolbar, the SSN column, row export, and export-from-code so nothing leaks as CSV.',
    component: AuthorizationGridExample,
    imports: ['PixelDataGridComponent', 'PixelAuthorizationService'],
    html: `<pixel-data-grid exportable exportAccess="claims:export" [columns]="columns" />`,
    typescript: `{ field: 'ssnLast4', access: 'claims:export' }`,
  }),
  createDocExample({
    id: 'authorization-tabs-stepper',
    title: 'Tabs and wizard steps they cannot use',
    category: 'Components',
    description:
      'Viewer can open Overview; Exports and Admin stay disabled. Review in the stepper needs Adjuster or Admin.',
    component: AuthorizationTabsStepperExample,
    imports: ['PixelTabsComponent', 'PixelTabComponent', 'PixelStepperComponent', 'PixelStepComponent'],
    html: `<pixel-tab label="Admin" access="admin:panel">…</pixel-tab>
<pixel-step label="Review" access="claims:approve">…</pixel-step>`,
    typescript: `auth.setSubject({ id: 'demo', roles: ['admin'] });`,
  }),
  createDocExample({
    id: 'authorization-overlays',
    title: 'Dialog that must not open',
    category: 'Components',
    description:
      'Amend-claim dialog/drawer stays closed for Viewer (no body). Admin can open it.',
    component: AuthorizationOverlaysExample,
    imports: ['PixelDialogService', 'PixelDrawerService'],
    html: `<pixel-button (click)="openDialog()">Open dialog</pixel-button>`,
    typescript: `dialog.open(Cmp, { requires: 'claims:amend' });`,
  }),
  createDocExample({
    id: 'authorization-explain-remote',
    title: 'Why was this allowed? (and remote timeout)',
    category: 'Advanced',
    description:
      'QA: print the local decision trace. If the remote policy service hangs, deny instead of leaving the UI open.',
    component: AuthorizationExplainRemoteExample,
    imports: ['PixelAuthorizationService', 'withRemotePdpTimeout', 'PixelMockPolicyDecisionAdapter'],
    html: `<pixel-button (click)="runExplain()">Why is export allowed?</pixel-button>
<pixel-button (click)="runRemote()">Ask remote (times out)</pixel-button>`,
    typescript: `auth.explain({ permission: 'claims:export' });
await auth.authorizeAsync({ permission: 'claims:export' });`,
  }),
];
