import { DocComponentMeta } from '../types';
import { CHIP_EXAMPLES } from '../../examples/pixel-chip';

export const DOC_CHIP_META: DocComponentMeta = {
  id: 'pixel-chip',
  title: 'Chip',
  selector: 'pixel-chip',
  category: 'data-display',
  status: 'stable',
  summary: 'Chip and chip-set system for display tags, filters, multi-select, input-driven tags, and semantic status pills.',
  overview: [
    'pixel-chip renders a single tag with removable, editable, draggable, and loading states.',
    'pixel-chip-set manages selection, overflow collapsing, keyboard navigation, and chip input.',
    'Semantic colors align with toast tokens across soft, solid, and outline variants.',
  ],
  useCases: [
    'Filter and faceted search chips',
    'Removable input tags from autocomplete',
    'Status and health indicators',
    'Reorderable workflow stage chips',
  ],
  themingNotes: [
    'Set semantic for success, error, warning, and info color meaning.',
    'Size xs through lg controls height, font, and padding.',
    'compact reduces gap independently of size.',
  ],
  accessibilityNotes: [
    'Selectable chips expose listbox/option roles in chip sets.',
    'Keyboard navigation supports arrow keys and Home/End.',
    'Loading and disabled states suppress interaction.',
  ],
  imports: ['PixelChipComponent', 'PixelChipSetComponent'],
  inputs: [
    { name: 'label', type: 'string', defaultValue: '\'\'', description: 'Visible chip text.' },
    { name: 'type', type: 'PixelChipType', defaultValue: '\'default\'', description: 'Role and use-case label.' },
    { name: 'semantic', type: 'PixelChipSemantic', defaultValue: '\'default\'', description: 'Color meaning.' },
    { name: 'variant', type: 'PixelChipVariant', defaultValue: '\'soft\'', description: 'Visual style.' },
    { name: 'selected', type: 'boolean', defaultValue: 'false', description: 'Selected appearance in sets.' },
    { name: 'removable', type: 'boolean', defaultValue: 'false', description: 'Shows remove affordance.' },
    { name: 'loading', type: 'boolean', defaultValue: 'false', description: 'Spinner; disables interaction.' },
  ],
  outputs: [
    { name: 'chipClick', type: 'PixelChipClickEvent', description: 'Chip activated.' },
    { name: 'chipRemove', type: 'PixelChipRemoveEvent', description: 'Remove triggered.' },
    { name: 'selectionChange', type: 'PixelChipSetSelectionChange', description: 'Set selection changed.' },
    { name: 'valueChange', type: 'readonly PixelChipItem[]', description: 'Chip list updated.' },
  ],
  examples: CHIP_EXAMPLES,
};
