import { DocComponentMeta } from '../types';
import { AUTHORIZATION_EXAMPLES } from '../../examples/pixel-authorization';

export const AUTHORIZATION_META: DocComponentMeta = {
  id: 'pixel-authorization',
  title: 'Authorization',
  selector: 'PixelAuthorizationService',
  category: 'services',
  status: 'stable',
  summary:
    'Decide whether the current person may export, approve, or open admin UI — then hide, disable, or lock fields. Local checks are UX only; APIs still enforce.',
  overview: [
    'You are not building a login system here. The app still owns identity. Pixel evaluates “may this person do this?” and applies it to buttons, grids, routes, and menus.',
    'Start with a role (Viewer cannot export; Exporter can). Add extra rules for this claim, right now: amount, owner, company.',
    'While roles are still loading, do not hide every gated control — that flashes empty. After load, Viewer hides or disables; Exporter keeps the action.',
    'Use the same permission on the button, the route, and the grid export so they cannot drift. When the person is already on that route and their role changes, leave the page — the router will not do it by itself. Server enforcement remains mandatory.',
    'Full walkthrough: App shell playground (role switcher → nav → claims export). Recipes: AUTHORIZATION-GUIDELINES.md.',
  ],
  useCases: [
    'Hide Export for Viewer; disable it when you still want the button visible',
    'Lock a field to readonly instead of removing the form',
    'Extra rules on this claim: own-claim, amount cap, other company',
    'Don’t hide chrome while login is still loading roles',
    'Drop sidenav links and leave a gated page when the role no longer allows it',
    'Same export permission on grid toolbar, SSN column, and export-from-code',
    'Keep wizard steps and dialogs closed when the person cannot use them',
    'End-to-end: App shell playground role switcher',
  ],
  themingNotes: ['Headless — no component tokens.'],
  accessibilityNotes: [
    'Hidden actions are removed from the accessibility tree. While roles are loading, keep the control and mark it busy. Disabled actions stay visible with aria-disabled.',
    'Never show permission keys or policy ids to end users.',
  ],
  imports: [
    'PixelAuthorizationService',
    'PixelAccessDirective',
    'providePixelAuthorization',
    'pixelAuthorizationCanMatch',
    'providePixelAuthorizationRouteWatcher',
  ],
  inputs: [],
  outputs: [],
  serviceName: 'PixelAuthorizationService',
  serviceApi: [
    {
      name: 'authorize / authorizeAsync',
      signature: '(request) => PixelAccessDecision | Promise<…>',
      description: 'Sync local PDP; async uses remote adapter when provided (fail-closed).',
    },
    {
      name: 'can / access',
      signature: '(permission | request) => Signal<…>',
      description: 'Reactive allow boolean or full decision for OnPush templates.',
    },
    {
      name: 'setSubject / setPermissionCatalog / setPolicies',
      signature: '…',
      description: 'Hydrate identity, catalog, and ABAC policy snapshot.',
    },
    {
      name: 'explain / filterAllowed',
      signature: '…',
      description: 'Dev decision trace; filter nav/menu models by access.',
    },
  ],
  examples: AUTHORIZATION_EXAMPLES,
};
