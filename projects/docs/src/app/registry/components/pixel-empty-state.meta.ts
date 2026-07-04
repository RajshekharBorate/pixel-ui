import { DocComponentMeta } from '../types';
import { EMPTY_STATE_EXAMPLES } from '../../examples/pixel-empty-state';

export const EMPTY_STATE_META: DocComponentMeta = {
  id: 'pixel-empty-state',
  title: 'Empty state',
  selector: 'pixel-empty-state',
  category: 'feedback',
  status: 'beta',
  summary:
    'Designed placeholder for no-data, no-results, and first-use states: icon or illustration, heading, description, and an actions row.',
  overview: [
    'Never leave an emptied region blank — pixel-empty-state standardizes the icon + heading + description + actions anatomy.',
    'Use the icon input for Material Symbols, or project [pixelEmptyStateMedia] for custom illustrations; [pixelEmptyStateActions] hosts recovery actions.',
    'announce opts into role="status" + aria-live="polite" for empty outcomes that appear after async searches or filtering.',
  ],
  useCases: [
    'No search/filter results with a reset action',
    'First-use onboarding states for empty workspaces',
    'Table, list, and card bodies with no data',
  ],
  themingNotes: [
    'Component tokens: --pixel-empty-state-color, --pixel-empty-state-muted-color, --pixel-empty-state-icon-color, --pixel-empty-state-icon-size, --pixel-empty-state-heading-size, --pixel-empty-state-gap, --pixel-empty-state-padding.',
    'Sizes sm/md/lg scale icon, heading, and padding from the shared scales.',
  ],
  accessibilityNotes: [
    'The icon is decorative (aria-hidden); the heading carries the meaning.',
    'Static empty states are plain content; set announce for post-filter outcomes so screen readers hear the change.',
    'Actions are regular projected buttons/links and keep their own semantics.',
  ],
  imports: ['PixelEmptyStateComponent'],
  inputs: [
    { name: 'icon', type: 'string', defaultValue: "''", description: 'Material Symbols ligature for the visual.' },
    { name: 'heading', type: 'string', defaultValue: "''", description: 'Short headline stating what is empty.' },
    { name: 'description', type: 'string', defaultValue: "''", description: 'Supporting copy: why, and what to do next.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", defaultValue: "'md'", description: 'Density preset.' },
    { name: 'align', type: "'start' | 'center'", defaultValue: "'center'", description: 'Content stack alignment.' },
    { name: 'announce', type: 'boolean', defaultValue: 'false', description: 'Adds role="status" + aria-live="polite".' },
    { name: 'id', type: 'string', defaultValue: "''", description: 'Stable element id.' },
  ],
  outputs: [],
  examples: EMPTY_STATE_EXAMPLES,
};
