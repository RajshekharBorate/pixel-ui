import { DocComponentMeta } from '../types';
import { STEPPER_EXAMPLES } from '../../examples/pixel-stepper';

export const STEPPER_META: DocComponentMeta = {
  id: 'pixel-stepper',
  title: 'Stepper',
  selector: 'pixel-stepper',
  category: 'navigation',
  status: 'stable',
  summary:
    'Signals-driven stepper and wizard with eight visual presets, linear/non-linear navigation, and async validation guards.',
  overview: [
    'pixel-stepper orchestrates pixel-step children with state-aware indicators and optional wizard footer.',
    'Supports reactive-forms integration via stepControl and beforeNext async guards.',
    'Dynamic and branching workflows work because steps are projected content.',
  ],
  useCases: [
    'Checkout and onboarding wizards',
    'Vertical form flows',
    'Timeline and progress indicators',
  ],
  themingNotes: [
    'Connector gap is tunable via --pixel-stepper-connector-gap.',
    'All colors derive from --pixel-sys-* tokens for light and dark themes.',
  ],
  accessibilityNotes: [
    'Implements tablist / tab / tabpanel with roving focus.',
    'Status glyphs communicate completed, error, and loading states.',
    'Set ariaLabel on the stepper for screen readers.',
  ],
  imports: [
    'PixelStepperComponent',
    'PixelStepComponent',
    'PixelStepContentComponent',
    'PixelStepActionsComponent',
  ],
  inputs: [
    { name: 'type', type: 'PixelStepperType', defaultValue: "'horizontal'", description: 'Visual preset (wizard, vertical, progress, etc.).' },
    { name: 'navigationMode', type: "'linear' | 'non-linear' | 'free'", defaultValue: "'linear'", description: 'How freely users may navigate.' },
    { name: 'selectedIndex', type: 'number', defaultValue: '0', description: 'Active step index (two-way bindable).' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", defaultValue: "'md'", description: 'Density tier.' },
    { name: 'labelPosition', type: "'end' | 'bottom'", defaultValue: "'end'", description: 'Label placement relative to indicator.' },
    { name: 'beforeNext', type: 'PixelStepGuard', description: 'Sync or async guard before advancing.' },
    { name: 'ariaLabel', type: 'string', defaultValue: "'Progress'", description: 'Accessible label for the tablist.' },
  ],
  outputs: [
    { name: 'selectionChange', type: 'PixelStepChangeEvent', description: 'Emits when the active step changes.' },
    { name: 'finished', type: 'void', description: 'Emits when the wizard completes.' },
    { name: 'stepSkipped', type: 'number', description: 'Emits when an optional step is skipped.' },
  ],
  examples: STEPPER_EXAMPLES,
};
