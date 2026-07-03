import { DocApiRow } from '../../registry/types';

export type DocA11yCategoryId =
  | 'keyboard'
  | 'aria'
  | 'focus'
  | 'screen-reader'
  | 'semantic'
  | 'general';

export interface DocA11yCategory {
  readonly id: DocA11yCategoryId;
  readonly label: string;
  readonly icon: string;
}

export interface DocA11yNote {
  readonly text: string;
  readonly category: DocA11yCategory;
}

const CATEGORIES: Record<DocA11yCategoryId, DocA11yCategory> = {
  keyboard: { id: 'keyboard', label: 'Keyboard', icon: 'keyboard' },
  aria: { id: 'aria', label: 'ARIA', icon: 'accessibility_new' },
  focus: { id: 'focus', label: 'Focus', icon: 'center_focus_strong' },
  'screen-reader': { id: 'screen-reader', label: 'Screen readers', icon: 'record_voice_over' },
  semantic: { id: 'semantic', label: 'Semantics', icon: 'code' },
  general: { id: 'general', label: 'Guidance', icon: 'verified_user' },
};

export function categorizeAccessibilityNote(note: string): DocA11yCategory {
  const lower = note.toLowerCase();

  if (/keyboard|enter|escape|tab\b|arrow|spacebar|space key|activation/.test(lower)) {
    return CATEGORIES.keyboard;
  }
  if (/aria-|role=|role "/.test(lower)) {
    return CATEGORIES.aria;
  }
  if (/focus|trap|restore/.test(lower)) {
    return CATEGORIES.focus;
  }
  if (/screen reader|announced|live region|sr-only|assistive/.test(lower)) {
    return CATEGORIES['screen-reader'];
  }
  if (/semantic|native|label for|labelled|labeled/.test(lower)) {
    return CATEGORIES.semantic;
  }

  return CATEGORIES.general;
}

export function buildAccessibilityNotes(notes: readonly string[]): readonly DocA11yNote[] {
  return notes.map((text) => ({
    text,
    category: categorizeAccessibilityNote(text),
  }));
}

export function relatedAriaInputs(inputs: readonly DocApiRow[]): readonly DocApiRow[] {
  return inputs.filter(
    (row) =>
      /^aria/i.test(row.name) ||
      row.name === 'role' ||
      /aria-|screen reader|accessible|focus|label/i.test(row.description),
  );
}

export const DOC_A11Y_TESTING_TIPS: readonly string[] = [
  'Navigate the component with Tab, Shift+Tab, Enter, Space, and arrow keys where applicable.',
  'Verify visible focus indicators and logical reading order in both light and dark themes.',
  'Test with a screen reader to confirm names, roles, states, and status updates are announced.',
];
