import { DocComponentMeta } from '../types';
import { ACCORDION_EXAMPLES } from '../../examples/pixel-accordion';

export const ACCORDION_META: DocComponentMeta = {
  id: 'pixel-accordion',
  title: 'Accordion',
  selector: 'pixel-accordion',
  category: 'layout',
  status: 'stable',
  summary:
    'Collapsible panels with smooth animation, three visual variants, lazy rendering, and expandAll / collapseAll coordination.',
  overview: [
    'pixel-accordion coordinates pixel-expansion-panel children with single- or multi-open modes.',
    'Panels support icons, descriptions, badges, disabled state, and lazy content rendering.',
    'A standalone expansion panel works without a coordinator for controlled toggles.',
  ],
  useCases: [
    'FAQ and help sections',
    'Settings groups with multiple sections',
    'Progressive disclosure in forms',
  ],
  themingNotes: [
    'Variants default, flush, and elevated map to surface and elevation tokens.',
    'Size sm / md / lg scales trigger padding uniformly across child panels.',
  ],
  accessibilityNotes: [
    'Triggers use button semantics with aria-expanded and aria-controls.',
    'Disabled panels are non-interactive with correct aria attributes.',
    'Keyboard: Enter/Space toggles; coordinator manages focus on open.',
  ],
  imports: ['PixelAccordionComponent', 'PixelExpansionPanelComponent'],
  inputs: [
    { name: 'multi', type: 'boolean', defaultValue: 'false', description: 'Allow multiple panels open simultaneously.' },
    { name: 'variant', type: "'default' | 'flush' | 'elevated'", defaultValue: "'default'", description: 'Visual style for child panels.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", defaultValue: "'md'", description: 'Density scale for child panels.' },
    { name: 'expanded', type: 'boolean', defaultValue: 'false', description: 'Panel open state (two-way on expansion-panel).' },
    { name: 'lazy', type: 'boolean', defaultValue: 'false', description: 'Defer content creation until first open.' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', description: 'Prevent toggling a panel.' },
  ],
  outputs: [
    { name: 'expandedChange', type: 'boolean', description: 'Emits when a panel opens or closes.' },
  ],
  examples: ACCORDION_EXAMPLES,
};
