import { DocComponentMeta } from '../types';
import { AVATAR_EXAMPLES } from '../../examples/pixel-avatar';

export const DOC_AVATAR_META: DocComponentMeta = {
  id: 'pixel-avatar',
  title: 'Avatar',
  selector: 'pixel-avatar',
  category: 'data-display',
  status: 'stable',
  summary: 'User avatars with image → initials → icon fallback, presence status, notification badges, and overlapping groups.',
  overview: [
    'pixel-avatar resolves content through a robust fallback chain with deterministic initials colors.',
    'pixel-avatar-group stacks or grids multiple avatars with overflow, pagination, and expandable hover.',
    'Integrates with pixel-badge for notification counts and supports clickable profile actions.',
  ],
  useCases: [
    'User profile thumbnails in headers and lists',
    'Presence indicators in chat and collaboration UIs',
    'Team member stacks with +N overflow',
    'Clickable avatars opening profile menus',
  ],
  themingNotes: [
    'Variants soft, solid, and outline control fill treatment.',
    'Initials colors are deterministic from the display name unless color is overridden.',
    'Group rings and overlap spacing use component tokens.',
  ],
  accessibilityNotes: [
    'Clickable avatars are semantic buttons with Enter/Space activation.',
    'Images expose alt text derived from name; loading shows a skeleton.',
    'Set ariaLabel when the visible label is insufficient.',
  ],
  imports: ['PixelAvatarComponent', 'PixelAvatarGroupComponent'],
  inputs: [
    { name: 'name', type: 'string', defaultValue: '\'\'', description: 'Display name; drives label and initials.' },
    { name: 'imageUrl', type: 'string', defaultValue: '\'\'', description: 'Profile image URL.' },
    { name: 'status', type: 'PixelAvatarStatus', defaultValue: '\'none\'', description: 'Presence indicator.' },
    { name: 'badgeCount', type: 'number | null', defaultValue: 'null', description: 'Notification count.' },
    { name: 'size', type: '\'xs\' | \'sm\' | \'md\' | \'lg\'', defaultValue: '\'md\'', description: 'Density scale.' },
    { name: 'clickable', type: 'boolean', defaultValue: 'false', description: 'Render as a button.' },
    { name: 'loading', type: 'boolean', defaultValue: 'false', description: 'Show skeleton placeholder.' },
  ],
  outputs: [
    { name: 'avatarClick', type: 'PixelAvatarClickEvent', description: 'Interactive avatar activated.' },
    { name: 'imageError', type: 'Event', description: 'Image failed before fallback.' },
  ],
  examples: AVATAR_EXAMPLES,
};
