/** Curated emoji set for the editor picker (no emoji-mart). */
export const PIXEL_EDITOR_EMOJI: readonly { readonly glyph: string; readonly label: string }[] = [
  { glyph: '😀', label: 'Grinning' },
  { glyph: '😁', label: 'Beaming' },
  { glyph: '😂', label: 'Joy' },
  { glyph: '🤣', label: 'ROFL' },
  { glyph: '😊', label: 'Smile' },
  { glyph: '😍', label: 'Heart eyes' },
  { glyph: '🤔', label: 'Thinking' },
  { glyph: '😎', label: 'Cool' },
  { glyph: '🙌', label: 'Raising hands' },
  { glyph: '👍', label: 'Thumbs up' },
  { glyph: '👎', label: 'Thumbs down' },
  { glyph: '👏', label: 'Clap' },
  { glyph: '🔥', label: 'Fire' },
  { glyph: '✨', label: 'Sparkles' },
  { glyph: '🎉', label: 'Party' },
  { glyph: '💯', label: 'Hundred' },
  { glyph: '✅', label: 'Check' },
  { glyph: '❌', label: 'Cross' },
  { glyph: '⚠️', label: 'Warning' },
  { glyph: '💡', label: 'Idea' },
  { glyph: '📌', label: 'Pin' },
  { glyph: '🔗', label: 'Link' },
  { glyph: '📅', label: 'Calendar' },
  { glyph: '🚀', label: 'Rocket' },
];

/** Common special characters / symbols. */
export const PIXEL_EDITOR_SPECIAL_CHARS: readonly { readonly glyph: string; readonly label: string }[] = [
  { glyph: '—', label: 'Em dash' },
  { glyph: '–', label: 'En dash' },
  { glyph: '…', label: 'Ellipsis' },
  { glyph: '•', label: 'Bullet' },
  { glyph: '·', label: 'Middle dot' },
  { glyph: '©', label: 'Copyright' },
  { glyph: '®', label: 'Registered' },
  { glyph: '™', label: 'Trademark' },
  { glyph: '°', label: 'Degree' },
  { glyph: '±', label: 'Plus-minus' },
  { glyph: '×', label: 'Multiply' },
  { glyph: '÷', label: 'Divide' },
  { glyph: '≠', label: 'Not equal' },
  { glyph: '≤', label: 'Less or equal' },
  { glyph: '≥', label: 'Greater or equal' },
  { glyph: '→', label: 'Arrow right' },
  { glyph: '←', label: 'Arrow left' },
  { glyph: '↔', label: 'Arrow both' },
  { glyph: '€', label: 'Euro' },
  { glyph: '£', label: 'Pound' },
  { glyph: '¥', label: 'Yen' },
  { glyph: '§', label: 'Section' },
  { glyph: '¶', label: 'Pilcrow' },
  { glyph: '★', label: 'Star' },
];

export type PixelEditorMentionItem = {
  readonly id: string;
  readonly label: string;
  readonly subtitle?: string;
};

export type PixelEditorMentionQuery = {
  readonly query: string;
};
