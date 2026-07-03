import { DocComponentMeta } from '../types';
import { FOOTER_EXAMPLES } from '../../examples/pixel-footer';

export const FOOTER_META: DocComponentMeta = {
  id: 'pixel-footer',
  title: 'Footer',
  selector: 'pixel-footer',
  category: 'layout',
  status: 'stable',
  summary: 'App-level footer shell region, rendered as a real <footer> element.',
  overview: [
    'pixel-footer is deliberately minimal — no sticky behavior of its own.',
    'Pins to the bottom of the page via pixel-app-shell\'s grid row, not position: sticky.',
  ],
  useCases: [
    'The bottom bar of an application shell (copyright, links, version info)',
    "Composed inside pixel-app-shell as its footer region",
  ],
  themingNotes: [
    'Consumes --pixel-sys-surface-container-low, --pixel-sys-on-surface, --pixel-sys-outline, --pixel-sys-space-*, and --pixel-sys-label-sm-size directly.',
  ],
  accessibilityNotes: [
    'Renders a native <footer> — exposed as a contentinfo landmark automatically outside article/aside/main/nav/section.',
  ],
  imports: ['PixelFooterComponent'],
  inputs: [
    { name: 'bordered', type: 'boolean', defaultValue: 'true', description: 'Top divider separating the footer from page content.' },
  ],
  outputs: [],
  examples: FOOTER_EXAMPLES,
};
