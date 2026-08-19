import { DocComponentMeta } from '../types';
import { TITLE_EXAMPLES } from '../../examples/pixel-title';

export const TITLE_META: DocComponentMeta = {
  id: 'pixel-title',
  title: 'Title',
  selector: 'PixelTitleService',
  category: 'services',
  status: 'stable',
  summary:
    'Formats document.title through Angular Title: brand prefix/suffix, unread count, truncation, error titles, and an opt-in TitleStrategy. Not a Meta / Open Graph helper.',
  overview: [
    'Angular Title already writes the tab title. PixelTitleService adds shared product rules so apps do not copy-paste suffix, count, and truncate logic.',
    'providePixelTitle({ suffix, defaultTitle, syncRouterTitle }) is optional. The service is providedIn root.',
    'syncRouterTitle replaces TitleStrategy so route title values run through the same formatter (one writer). Nested routes use the leaf primary-outlet title.',
    'Count-only updates debounce (~1s). Dialogs and drawers must not change the title.',
    'SEO / og:title / Twitter cards are out of scope — apps that need share metadata own Meta themselves.',
  ],
  useCases: [
    'App-wide “Page · Brand” tab titles',
    'Inbox unread badge in the browser tab',
    '404 / 403 titles from setError()',
    'Compose Routes.title with a shared suffix',
  ],
  themingNotes: [
    'No UI — nothing to theme.',
  ],
  accessibilityNotes: [
    'Many assistive technologies announce document.title on route change. Avoid count flicker (debounce) and empty titles. Do not also shout the same string in an aria-live region.',
  ],
  imports: ['PixelTitleService', 'providePixelTitle', 'PixelTitleStrategy'],
  inputs: [],
  outputs: [],
  serviceName: 'PixelTitleService',
  serviceApi: [
    {
      name: 'set',
      signature: 'set(input: string | PixelTitleParts, options?: PixelTitleSetOptions): void',
      description:
        'Replace the document title (string = page). Count-only updates debounce; other writes are last-write-wins.',
    },
    {
      name: 'reset',
      signature: 'reset(options?: PixelTitleSetOptions): void',
      description: 'Restore defaultTitle plus prefix / suffix.',
    },
    {
      name: 'setError',
      signature: 'setError(kind: PixelTitleErrorKind, options?: PixelTitleSetOptions): void',
      description: 'Apply not-found / forbidden / error copy. Does not navigate.',
    },
    {
      name: 'fromTrail',
      signature: 'fromTrail(items, options?): void',
      description:
        'Use the last breadcrumb label as page. Skip when PixelTitleStrategy is already the writer.',
    },
    {
      name: 'value',
      signature: 'Signal<string>',
      description: 'Current resolved title (same string passed to Angular Title).',
    },
    {
      name: 'providePixelTitle',
      signature: 'providePixelTitle(config?: PixelTitleConfig): Provider[]',
      description:
        'Config token plus optional PixelTitleStrategy when syncRouterTitle is true.',
    },
  ],
  examples: TITLE_EXAMPLES,
};
