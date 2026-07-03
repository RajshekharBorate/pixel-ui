import { DocComponentMeta } from '../types';
import { HEADER_EXAMPLES } from '../../examples/pixel-header';

export const HEADER_META: DocComponentMeta = {
  id: 'pixel-header',
  title: 'Header',
  selector: 'pixel-header',
  category: 'layout',
  status: 'stable',
  summary: 'App-level top bar with a leading/title area and an auto-pushed trailing actions slot.',
  overview: [
    'pixel-header renders a real <header> element for correct landmark semantics.',
    'Default projected content forms the leading/title area; content marked pixelHeaderActions is pushed to the end of the row.',
    'Optionally sticks to the top of its nearest scrolling ancestor.',
    'sticky and bordered are automatically suppressed when composed inside pixel-app-shell, which provides its own wrapper-level sticky and shared toolbar-divider instead — no manual coordination needed.',
  ],
  useCases: [
    'The top bar of an application shell (title/logo + trailing action icons)',
    'A sticky page header that stays visible while content scrolls',
    "Composed inside pixel-app-shell as its header region",
  ],
  themingNotes: [
    'Consumes --pixel-sys-surface-container-low, --pixel-sys-on-surface, --pixel-sys-outline, and --pixel-sys-space-* directly.',
  ],
  accessibilityNotes: [
    'Renders a native <header> — exposed as a banner landmark automatically outside article/aside/main/nav/section.',
  ],
  imports: ['PixelHeaderComponent'],
  inputs: [
    { name: 'sticky', type: 'boolean', defaultValue: 'false', description: 'Pins the header to the top of its nearest scrolling ancestor.' },
    { name: 'bordered', type: 'boolean', defaultValue: 'true', description: 'Bottom divider separating the header from page content.' },
  ],
  outputs: [],
  examples: HEADER_EXAMPLES,
};
