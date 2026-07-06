import { DocComponentMeta } from '../types';
import { CARD_EXAMPLES } from '../../examples/pixel-card';

export const CARD_META: DocComponentMeta = {
  id: 'pixel-card',
  title: 'Card',
  selector: 'pixel-card',
  category: 'data-display',
  status: 'stable',
  summary:
    'Content surface with elevated, outlined, and filled appearances, built-in header, media and actions slots, interactive card-picker mode, and a skeleton state.',
  overview: [
    'pixel-card groups related content behind one themed surface; the default slot is the body.',
    'Use cardTitle/cardSubtitle for the built-in header, or project [pixelCardHeader] for custom chrome; [pixelCardMedia] renders edge-to-edge and [pixelCardActions] forms the footer row.',
    'interactive turns the whole card into a single keyboard-accessible button-pattern target (activate output); combine with selectable + selected for card pickers.',
  ],
  useCases: [
    'Dashboard tiles and content summaries',
    'Card pickers (plans, templates, options) with keyboard-accessible selection',
    'Media cards with actions (reports, articles, previews)',
  ],
  themingNotes: [
    'Component tokens: --pixel-card-background, --pixel-card-color, --pixel-card-border-color, --pixel-card-radius, --pixel-card-elevation, --pixel-card-elevation-raised, --pixel-card-padding, --pixel-card-title-size, --pixel-card-subtitle-color.',
    'padding presets none/sm/md/lg map to the spacing scale; media always spans edge-to-edge.',
  ],
  accessibilityNotes: [
    'Non-interactive cards are plain surfaces with no role.',
    'interactive adds role="button", tabindex, Enter/Space activation (Space on keyup, matching native buttons), aria-disabled, and focus-visible styling.',
    'selectable + interactive exposes aria-pressed for the selected state.',
    'Never nest interactive elements inside an interactive card — use [pixelCardActions] on a non-interactive card instead.',
  ],
  imports: ['PixelCardComponent'],
  inputs: [
    { name: 'appearance', type: "'elevated' | 'outlined' | 'filled'", defaultValue: "'elevated'", description: 'Visual appearance style.' },
    { name: 'padding', type: "'none' | 'sm' | 'md' | 'lg'", defaultValue: "'md'", description: 'Inner padding density (media stays edge-to-edge).' },
    { name: 'cardTitle', type: 'string', defaultValue: "''", description: 'Title for the built-in header.' },
    { name: 'cardSubtitle', type: 'string', defaultValue: "''", description: 'Subtitle under the title.' },
    { name: 'interactive', type: 'boolean', defaultValue: 'false', description: 'Makes the whole card one clickable button-pattern target.' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', description: 'Disables an interactive card.' },
    { name: 'selectable', type: 'boolean', defaultValue: 'false', description: 'Card-picker semantics: exposes aria-pressed when interactive.' },
    { name: 'selected', type: 'boolean', defaultValue: 'false', description: 'Controlled selected state.' },
    { name: 'ariaLabel', type: 'string', defaultValue: "''", description: 'Accessible name for interactive cards.' },
    { name: 'id', type: 'string', defaultValue: "''", description: 'Stable element id.' },
    { name: 'showSkeleton', type: 'boolean', defaultValue: 'false', description: 'Replaces the card with a skeleton placeholder.' },
    { name: 'skeletonHeight', type: 'string', defaultValue: "'10rem'", description: 'Skeleton height (any CSS size).' },
  ],
  outputs: [
    { name: 'activate', type: 'PixelCardActivateEvent', description: 'Interactive card activated by mouse or keyboard ({ source, originalEvent }).' },
  ],
  examples: CARD_EXAMPLES,
};
