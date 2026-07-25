import type { Editor } from '@tiptap/core';
import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion';
import type { PixelEditorMentionItem } from '../pickers/pixel-editor-insert-data';
import {
  attachPixelEditorSuggestReposition,
  createPixelEditorSuggestRoot,
  placePixelEditorSuggestRoot,
  renderPixelEditorSuggestItems,
} from './pixel-editor-suggest-ui';

type MentionItem = PixelEditorMentionItem & { id: string };

/**
 * Floating @mention list (no tippy). Shares `pixel-select`-like panel chrome
 * with the slash palette and repositions on scroll.
 */
export function createMentionSuggestionRender(onQuery?: (query: string) => void) {
  let root: HTMLDivElement | null = null;
  let selectedIndex = 0;
  let currentProps: SuggestionProps<MentionItem> | null = null;
  let detachReposition: (() => void) | null = null;

  const pick = (index: number) => {
    const item = currentProps?.items[index];
    if (item) {
      currentProps?.command({ id: item.id, label: item.label });
    }
  };

  const updateList = () => {
    if (!root || !currentProps) return;
    renderPixelEditorSuggestItems(
      root,
      currentProps.items.map((item) => ({
        id: item.id,
        label: item.label,
        subtitle: item.subtitle,
        icon: 'person',
      })),
      selectedIndex,
      pick,
    );
    placePixelEditorSuggestRoot(root, currentProps.clientRect);
  };

  return {
    onStart: (props: SuggestionProps<MentionItem>) => {
      currentProps = props;
      selectedIndex = 0;
      onQuery?.(props.query);
      const anchor =
        (props.editor?.view?.dom as HTMLElement | undefined) ?? document.body;
      root = createPixelEditorSuggestRoot('Mention suggestions', anchor);
      updateList();
      detachReposition?.();
      detachReposition = attachPixelEditorSuggestReposition(root, () =>
        currentProps?.clientRect?.() ?? null,
      );
    },
    onUpdate: (props: SuggestionProps<MentionItem>) => {
      currentProps = props;
      selectedIndex = 0;
      onQuery?.(props.query);
      updateList();
      if (root) {
        detachReposition?.();
        detachReposition = attachPixelEditorSuggestReposition(root, () =>
          currentProps?.clientRect?.() ?? null,
        );
      }
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
        selectedIndex =
          (selectedIndex - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1);
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
        detachReposition?.();
        detachReposition = null;
        root?.remove();
        root = null;
        return true;
      }
      return false;
    },
    onExit: () => {
      detachReposition?.();
      detachReposition = null;
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
