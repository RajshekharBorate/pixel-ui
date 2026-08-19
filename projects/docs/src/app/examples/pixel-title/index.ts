import { createDocExample } from '../../shared/example-source.util';
import { TitleBasicExample } from './title-basic.example';

export const TITLE_EXAMPLES = [
  createDocExample({
    id: 'title-basic',
    title: 'Set the tab title',
    category: 'Basics',
    description:
      'PixelTitleService writes document.title through Angular Title: page, unread count, error copy, and reset. Opt-in providePixelTitle({ syncRouterTitle: true }) to format route titles with the same rules.',
    component: TitleBasicExample,
    imports: ['PixelTitleService', 'PixelButtonComponent', 'providePixelTitle'],
    html: `<pixel-button (click)="titles.set('Policies')">Policies</pixel-button>
<pixel-button (click)="titles.set({ page: 'Inbox', count: 3 })">Inbox (3)</pixel-button>`,
    typescript: `providePixelTitle({ suffix: 'Pixel UI', defaultTitle: 'Docs', syncRouterTitle: true });

this.titles.set('Policies');
// document.title → "Policies · Pixel UI"

this.titles.set({ page: 'Inbox', count: 3 });
// "(3) Inbox · Pixel UI"`,
  }),
];
