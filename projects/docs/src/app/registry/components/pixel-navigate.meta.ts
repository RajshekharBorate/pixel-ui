import { DocComponentMeta } from '../types';
import { NAVIGATE_EXAMPLES } from '../../examples/pixel-navigate';

export const NAVIGATE_META: DocComponentMeta = {
  id: 'pixel-navigate',
  title: 'Navigate',
  selector: 'PixelNavigateService',
  category: 'services',
  status: 'stable',
  summary:
    'Contextual navigation / deep links inside routes: sections, adapters (accordion, stepper, tabs), grid rows, and opt-in wizards — with scroll, focus, highlight, and shareable ?nav= URLs.',
  overview: [
    'Angular Router owns pages; PixelNavigateService owns targets inside those pages.',
    'Prefer [pixelNavAnchor] and registerAdapter / registerGrid / registerWizard over CSS selectors.',
    'Canonical shareable contract is ?nav= plus first-class ?row= / ?grid= / ?step= / ?wizard=. Soft-fails by default.',
    'Notifications: inbox item clicks use openFromNotification explicitly. OS Web Push clicks auto-navigate when the push bridge is started and action/data.nav is set.',
    'Phase 7: context stack (back), permission forbidden, opt-in multi-tab BroadcastChannel.',
    'Not a product tour — use pixel-tour for guided walkthroughs.',
    'End-to-end recipe: App shell full-page playground (`/playground/app-shell`) — notification → route → grid / billing chain / dialog wizard / gated settings.',
  ],
  useCases: [
    'Notification or search → entity page → section or grid row',
    'Same-page jump links with sticky-header offset',
    'Tabs / accordion / stepper activation chains',
    'Opt-in wizard resume after refresh (registered adapters only)',
    'Return to previous navigate context; gate deep links by permission',
  ],
  themingNotes: [
    'Highlight uses --pixel-nav-highlight-* with system token fallbacks; grid rows use --pixel-sys-primary.',
  ],
  accessibilityNotes: [
    'Optional focus move and polite announce; highlight is supplementary, not the only cue.',
  ],
  imports: ['PixelNavigateService', 'PixelNavAnchorDirective'],
  inputs: [],
  outputs: [],
  serviceName: 'PixelNavigateService',
  serviceApi: [
    {
      name: 'go',
      signature: 'go(request?: PixelNavigateRequest): Promise<PixelNavigateResult>',
      description: 'Route (optional) then resolve/activate targets with scroll, focus, highlight.',
    },
    {
      name: 'goFromUrl / parseUrl / toUrl / copyLink',
      signature: '(url | request) => …',
      description: 'Shareable ?nav= cold-open, serialize, and clipboard helpers.',
    },
    {
      name: 'registerAdapter / registerGrid / registerWizard',
      signature: '(adapter | id, api) => () => void',
      description: 'Unregister functions returned. Wizards are opt-in only.',
    },
    {
      name: 'openFromNotification',
      signature: 'openFromNotification(notification, options?): Promise<PixelNavigateResult | null>',
      description: 'Mark read (optional) then go() from data.nav / action.nav / href.',
    },
    {
      name: 'setPermissionGuard / back / peekContext / enableMultiTab',
      signature: '…',
      description:
        'Permission soft-fail (forbidden), return-context stack, and opt-in BroadcastChannel multi-tab focus.',
    },
  ],
  examples: NAVIGATE_EXAMPLES,
};
