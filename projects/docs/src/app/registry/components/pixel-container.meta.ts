import { DocComponentMeta } from '../types';
import { CONTAINER_EXAMPLES } from '../../examples/pixel-container';

export const CONTAINER_META: DocComponentMeta = {
  id: 'pixel-container',
  title: 'Container',
  selector: 'pixel-container',
  category: 'layout',
  status: 'stable',
  summary:
    'Centers content and caps its width per breakpoint, with consistent responsive inline padding.',
  overview: [
    'pixel-container is the base layout primitive for page-level content.',
    'Width presets are fixed steps (sm/md/lg/xl/full); fluid bypasses the cap for full-width sections.',
    'Padding uses the shared spacing scale and widens at larger breakpoints.',
  ],
  useCases: [
    'Wrapping a page or section so its line length stays readable on wide screens',
    'Consistent page gutters that widen at larger breakpoints',
    'A fluid escape hatch for full-width sections that still need shared padding',
  ],
  themingNotes: [
    'Padding uses --pixel-sys-space-md / --pixel-sys-space-xl directly — override those tokens at a [data-theme] ancestor to adjust every container consistently.',
  ],
  accessibilityNotes: ['Purely presentational — no ARIA role.'],
  imports: ['PixelContainerComponent'],
  inputs: [
    { name: 'maxWidth', type: "'sm' | 'md' | 'lg' | 'xl' | 'full'", defaultValue: "'lg'", description: 'Width cap preset.' },
    { name: 'fluid', type: 'boolean', defaultValue: 'false', description: 'Bypasses maxWidth entirely (100% width).' },
    { name: 'padded', type: 'boolean', defaultValue: 'true', description: 'Responsive inline padding using the shared spacing scale.' },
  ],
  outputs: [],
  examples: CONTAINER_EXAMPLES,
};
