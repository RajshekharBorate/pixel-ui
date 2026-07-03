import { DocComponentMeta } from '../types';
import { APP_SHELL_EXAMPLES } from '../../examples/pixel-app-shell';

export const APP_SHELL_META: DocComponentMeta = {
  id: 'pixel-app-shell',
  title: 'App shell',
  selector: 'pixel-app-shell',
  category: 'layout',
  status: 'stable',
  summary:
    'Composing root that arranges a header, sidenav, main content, and footer into a full responsive CSS Grid application layout.',
  overview: [
    'The sidenav spans the full block-size of the shell (header, content, and footer rows) rather than just the middle row — header and footer only occupy the remaining column, starting to the right of the sidenav. It uses position: sticky (capped to 100vh) to stay pinned to the viewport as the page scrolls, rather than stretching to match long content. Put a brand mark and any collapse/expand control inside pixel-sidenav\'s own pixelSidenavBrand slot, since it is the one region always visible.',
    'Reads the projected pixel-sidenav instance directly and reactively sizes its grid column to match its docked/open state — no imperative wiring.',
    'Only pixel-header, pixel-sidenav, and pixel-footer are matched by tag name into their grid regions; every other projected child falls into the main content region, rendered as a real <main> element.',
    'Uses the classic CSS Grid "sticky footer" pattern: give the shell (and its ancestor chain) a min-block-size, not a fixed block-size. Short content: the 1fr content row expands to push the footer to the viewport bottom. Long content: the grid grows past the floor and the whole page scrolls, with pixel-header\'s sticky input and the sidenav\'s own position: sticky keeping both pinned through that scroll — nothing scrolls internally inside the shell.',
    'When a pixel-header is present, draws a single full-width divider at the toolbar-height boundary spanning both the header and the sidenav\'s brand region — avoids a hairline visual mismatch that two independently-painted borders can show at non-integer devicePixelRatio (e.g. 125% display scaling) even when logically identical.',
    'Provides a PixelAppShellContext (the same InjectionToken parent/child pattern pixel-radio-group and pixel-tab-nav use) so a composed pixel-header/pixel-sidenav automatically suppress their own now-redundant bordered/brandBordered/sticky behavior — no manual [bordered]="false" coordination needed.',
  ],
  useCases: [
    'The top-level layout of an admin dashboard / back-office application',
    'Any page that needs a persistent header + collapsible side navigation + footer arrangement',
  ],
  themingNotes: ['Grid column width tracks pixel-sidenav\'s size input directly. The toolbar divider reads --pixel-sys-toolbar-block-size and the shared color-mix(--pixel-sys-outline) formula.'],
  accessibilityNotes: [
    'Renders the content region as a native <main> element automatically.',
    'Other landmark roles come from the projected components themselves.',
    'Respects prefers-reduced-motion for the grid-column collapse transition.',
  ],
  imports: ['PixelAppShellComponent'],
  inputs: [],
  outputs: [],
  examples: APP_SHELL_EXAMPLES,
};
