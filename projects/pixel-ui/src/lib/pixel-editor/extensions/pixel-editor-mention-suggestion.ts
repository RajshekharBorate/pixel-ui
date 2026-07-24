import type { Editor } from '@tiptap/core';
import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion';
import { copyPixelThemeContext } from '../../theme/pixel-theme';
import type { PixelEditorMentionItem } from '../pickers/pixel-editor-insert-data';

type MentionItem = PixelEditorMentionItem & { id: string };

const SUGGEST_STYLE_ID = 'pixel-editor-mention-suggest-styles';

function ensureMentionSuggestStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(SUGGEST_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = SUGGEST_STYLE_ID;
  style.textContent = `
.pixel-editor-mention-suggest {
  min-inline-size: 12rem;
  max-inline-size: 20rem;
  max-block-size: 16rem;
  overflow: auto;
  padding: 0.35rem;
  border: 1px solid var(--pixel-sys-outline-variant, #c4c6d0);
  border-radius: var(--pixel-sys-shape-corner-small, 0.5rem);
  background: var(--pixel-sys-surface-container, #f3f0f4);
  color: var(--pixel-sys-on-surface, #1a1b1f);
  box-shadow: var(--pixel-sys-elevation-2, 0 2px 8px rgb(0 0 0 / 16%));
  font-family: inherit;
  font-size: 0.875rem;
}
.pixel-editor-mention-suggest__empty {
  padding: 0.5rem 0.65rem;
  color: var(--pixel-sys-on-surface-variant, #44474f);
}
.pixel-editor-mention-suggest__item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
  inline-size: 100%;
  margin: 0;
  padding: 0.45rem 0.65rem;
  border: 0;
  border-radius: var(--pixel-sys-shape-corner-extra-small, 0.25rem);
  background: transparent;
  color: inherit;
  text-align: start;
  cursor: pointer;
}
.pixel-editor-mention-suggest__item:hover,
.pixel-editor-mention-suggest__item--active {
  background: color-mix(in srgb, var(--pixel-sys-primary, #2962ff) 12%, transparent);
}
.pixel-editor-mention-suggest__item:focus-visible {
  outline: 2px solid var(--pixel-sys-focus-ring, #2962ff);
  outline-offset: 1px;
}
.pixel-editor-mention-suggest__label {
  font-weight: 600;
}
.pixel-editor-mention-suggest__subtitle {
  font-size: 0.75rem;
  color: var(--pixel-sys-on-surface-variant, #44474f);
}
@media (prefers-reduced-motion: reduce) {
  .pixel-editor-mention-suggest {
    box-shadow: none;
  }
}
`;
  document.head.appendChild(style);
}

/**
 * Minimal floating suggestion list for @mentions (no tippy dependency).
 * Appended to document.body; styles injected once into document.head.
 */
export function createMentionSuggestionRender(onQuery?: (query: string) => void) {
  let root: HTMLDivElement | null = null;
  let selectedIndex = 0;
  let currentProps: SuggestionProps<MentionItem> | null = null;

  const updateList = () => {
    if (!root || !currentProps) return;
    const items = currentProps.items;
    root.innerHTML = '';
    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'pixel-editor-mention-suggest__empty';
      empty.textContent = 'No matches';
      root.appendChild(empty);
      return;
    }
    items.forEach((item, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pixel-editor-mention-suggest__item';
      if (index === selectedIndex) {
        btn.classList.add('pixel-editor-mention-suggest__item--active');
      }
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', String(index === selectedIndex));
      const label = document.createElement('span');
      label.className = 'pixel-editor-mention-suggest__label';
      label.textContent = item.label;
      btn.appendChild(label);
      if (item.subtitle) {
        const sub = document.createElement('span');
        sub.className = 'pixel-editor-mention-suggest__subtitle';
        sub.textContent = item.subtitle;
        btn.appendChild(sub);
      }
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        currentProps?.command({ id: item.id, label: item.label });
      });
      root!.appendChild(btn);
    });
  };

  const place = (props: SuggestionProps<MentionItem>) => {
    if (!root) return;
    const rect = props.clientRect?.();
    if (!rect) return;
    root.style.position = 'fixed';
    root.style.insetInlineStart = `${Math.round(rect.left)}px`;
    root.style.insetBlockStart = `${Math.round(rect.bottom + 6)}px`;
    root.style.zIndex = '1200';
  };

  return {
    onStart: (props: SuggestionProps<MentionItem>) => {
      currentProps = props;
      selectedIndex = 0;
      onQuery?.(props.query);
      ensureMentionSuggestStyles();
      root = document.createElement('div');
      root.className = 'pixel-editor-mention-suggest';
      root.setAttribute('role', 'listbox');
      root.setAttribute('aria-label', 'Mention suggestions');
      const anchor =
        (props.editor?.view?.dom as HTMLElement | undefined) ?? document.body;
      copyPixelThemeContext(root, anchor);
      document.body.appendChild(root);
      updateList();
      place(props);
    },
    onUpdate: (props: SuggestionProps<MentionItem>) => {
      currentProps = props;
      selectedIndex = 0;
      onQuery?.(props.query);
      updateList();
      place(props);
    },
    onKeyDown: (props: SuggestionKeyDownProps) => {
      if (!currentProps) return false;
      const items = currentProps.items;
      if (props.event.key === 'ArrowDown') {
        props.event.preventDefault();
        selectedIndex = (selectedIndex + 1) % Math.max(items.length, 1);
        updateList();
        return true;
      }
      if (props.event.key === 'ArrowUp') {
        props.event.preventDefault();
        selectedIndex = (selectedIndex - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1);
        updateList();
        return true;
      }
      if (props.event.key === 'Enter') {
        const item = items[selectedIndex];
        if (item) {
          props.event.preventDefault();
          currentProps.command({ id: item.id, label: item.label });
          return true;
        }
      }
      if (props.event.key === 'Escape') {
        props.event.preventDefault();
        root?.remove();
        root = null;
        return true;
      }
      return false;
    },
    onExit: () => {
      root?.remove();
      root = null;
      currentProps = null;
    },
  };
}

export function filterMentionItems(
  items: readonly PixelEditorMentionItem[],
  query: string,
): MentionItem[] {
  const q = query.trim().toLowerCase();
  return items
    .filter((item) => {
      if (!q) return true;
      return (
        item.label.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        (item.subtitle?.toLowerCase().includes(q) ?? false)
      );
    })
    .slice(0, 8)
    .map((item) => ({ ...item, id: item.id }));
}

/** No-op helper to keep Editor typed in suggestion factories. */
export type MentionSuggestionEditor = Editor;
