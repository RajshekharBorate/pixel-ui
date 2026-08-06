import { DocComponentMeta } from '../types';
import { BUTTON_EXAMPLES } from '../../examples/pixel-button';

const GROUP_EXAMPLES = BUTTON_EXAMPLES.filter((example) => example.id === 'button-group');

export const BUTTON_GROUP_META: DocComponentMeta = {
  id: 'pixel-button-group',
  title: 'Button group',
  selector: 'pixel-button-group',
  category: 'form-controls',
  status: 'stable',
  summary:
    'Joined layout wrapper for sibling pixel-button actions with shared size and appearance chrome.',
  overview: [
    'pixel-button-group projects pixel-button children and collapses adjoining borders.',
    'It does not manage exclusive selection — use pixel-toggle segmented mode for that.',
    'Supports horizontal and vertical orientation plus fullWidth stretch.',
  ],
  useCases: [
    'Day / week / month range switchers',
    'Toolbar action clusters',
    'Compact filter chips as buttons',
  ],
  themingNotes: [
    'Group chrome inherits button tokens; override via host data-size / data-appearance.',
  ],
  accessibilityNotes: [
    'Host uses role="group" with optional aria-label.',
    'Disabled state sets aria-disabled on the group; children remain semantic buttons.',
  ],
  imports: ['PixelButtonGroupComponent', 'PixelButtonComponent'],
  inputs: [
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", defaultValue: "'md'", description: 'Density for joined border geometry.' },
    { name: 'appearance', type: 'PixelButtonAppearance', defaultValue: "'outline'", description: 'Chrome hint for outline/solid joining.' },
    { name: 'orientation', type: "'horizontal' | 'vertical'", defaultValue: "'horizontal'", description: 'Layout direction.' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', description: 'Marks the group disabled.' },
    { name: 'fullWidth', type: 'boolean', defaultValue: 'false', description: 'Stretch to container width.' },
    { name: 'ariaLabel', type: 'string', defaultValue: "''", description: 'Accessible name for the group.' },
  ],
  outputs: [],
  examples: GROUP_EXAMPLES,
};
