import { Extension, type Editor, type Range } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import Suggestion, {
  type SuggestionKeyDownProps,
  type SuggestionOptions,
  type SuggestionProps,
} from '@tiptap/suggestion';
import { copyPixelThemeContext } from '../../theme/pixel-theme';
import { toLocalIsoDate } from '../pixel-editor-date.util';

export type PixelEditorSlashCommandId =
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'orderedList'
  | 'taskList'
  | 'panel'
  | 'codeBlock'
  | 'table'
  | 'horizontalRule'
  | 'image'
  | 'mention'
  | 'emoji'
  | 'date';

export type PixelEditorSlashItem = {
  readonly id: PixelEditorSlashCommandId;
  readonly label: string;
  readonly keywords: readonly string[];
  readonly subtitle?: string;
  /** Runs after `/query` is deleted from the document. */
  readonly run: (editor: Editor) => void;
};

export const PixelEditorSlashPluginKey = new PluginKey('pixelEditorSlash');

const SUGGEST_STYLE_ID = 'pixel-editor-slash-suggest-styles';

function ensureSlashSuggestStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(SUGGEST_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = SUGGEST_STYLE_ID;
  style.textContent = `
.pixel-editor-slash-suggest {
  min-inline-size: 14rem;
  max-inline-size: 22rem;
  max-block-size: 18rem;
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
.pixel-editor-slash-suggest__empty {
  padding: 0.5rem 0.65rem;
  color: var(--pixel-sys-on-surface-variant, #44474f);
}
.pixel-editor-slash-suggest__item {
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
.pixel-editor-slash-suggest__item:hover,
.pixel-editor-slash-suggest__item--active {
  background: color-mix(in srgb, var(--pixel-sys-primary, #2962ff) 12%, transparent);
}
.pixel-editor-slash-suggest__item:focus-visible {
  outline: 2px solid var(--pixel-sys-focus-ring, #2962ff);
  outline-offset: 1px;
}
.pixel-editor-slash-suggest__label {
  font-weight: 600;
}
.pixel-editor-slash-suggest__subtitle {
  font-size: 0.75rem;
  color: var(--pixel-sys-on-surface-variant, #44474f);
}
@media (prefers-reduced-motion: reduce) {
  .pixel-editor-slash-suggest {
    box-shadow: none;
  }
}
`;
  document.head.appendChild(style);
}

/** Catalog of slash palette commands (filterable). */
export const PIXEL_EDITOR_SLASH_COMMANDS: readonly PixelEditorSlashItem[] = [
  {
    id: 'heading1',
    label: 'Heading 1',
    keywords: ['h1', 'heading', 'title'],
    run: (editor) => {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    },
  },
  {
    id: 'heading2',
    label: 'Heading 2',
    keywords: ['h2', 'heading', 'subtitle'],
    run: (editor) => {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    },
  },
  {
    id: 'heading3',
    label: 'Heading 3',
    keywords: ['h3', 'heading'],
    run: (editor) => {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    },
  },
  {
    id: 'bulletList',
    label: 'Bullet list',
    keywords: ['ul', 'unordered', 'bullets', 'list'],
    run: (editor) => {
      editor.chain().focus().toggleBulletList().run();
    },
  },
  {
    id: 'orderedList',
    label: 'Ordered list',
    keywords: ['ol', 'numbered', 'list'],
    run: (editor) => {
      editor.chain().focus().toggleOrderedList().run();
    },
  },
  {
    id: 'taskList',
    label: 'Task list',
    keywords: ['todo', 'checklist', 'task', 'checkbox'],
    run: (editor) => {
      editor.chain().focus().toggleTaskList().run();
    },
  },
  {
    id: 'panel',
    label: 'Info panel',
    keywords: ['panel', 'callout', 'info', 'note'],
    subtitle: 'Info callout',
    run: (editor) => {
      editor.chain().focus().setPanel('info').run();
    },
  },
  {
    id: 'codeBlock',
    label: 'Code block',
    keywords: ['code', 'pre', 'snippet'],
    run: (editor) => {
      editor.chain().focus().toggleCodeBlock().run();
    },
  },
  {
    id: 'table',
    label: 'Table',
    keywords: ['table', 'grid'],
    subtitle: '3×3 with header',
    run: (editor) => {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    },
  },
  {
    id: 'horizontalRule',
    label: 'Horizontal rule',
    keywords: ['hr', 'divider', 'line', 'separator'],
    run: (editor) => {
      editor.chain().focus().setHorizontalRule().run();
    },
  },
  {
    id: 'image',
    label: 'Image',
    keywords: ['img', 'photo', 'picture', 'media'],
    subtitle: 'Use the toolbar to upload or paste a URL',
    run: (editor) => {
      editor.chain().focus().insertContent('[Image]').run();
    },
  },
  {
    id: 'mention',
    label: 'Mention',
    keywords: ['@', 'person', 'user', 'people'],
    subtitle: 'Opens @ mention',
    run: (editor) => {
      editor.chain().focus().insertContent('@').run();
    },
  },
  {
    id: 'emoji',
    label: 'Emoji',
    keywords: ['emoji', 'smiley', 'reaction'],
    subtitle: 'Use the toolbar emoji picker',
    run: (editor) => {
      editor.chain().focus().insertContent('🙂').run();
    },
  },
  {
    id: 'date',
    label: 'Date',
    keywords: ['date', 'calendar', 'today'],
    subtitle: 'Inserts today’s date chip',
    run: (editor) => {
      editor.chain().focus().insertDateChip(toLocalIsoDate(new Date())).run();
    },
  },
];

export function filterSlashCommandItems(query: string): PixelEditorSlashItem[] {
  const q = query.trim().toLowerCase();
  return PIXEL_EDITOR_SLASH_COMMANDS.filter((item) => {
    if (!q) return true;
    return (
      item.label.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.toLowerCase().includes(q)) ||
      (item.subtitle?.toLowerCase().includes(q) ?? false)
    );
  });
}

/**
 * Minimal floating slash-command list (no tippy). Appended to document.body;
 * styles injected once into document.head — mirrors mention suggestion UI.
 */
export function createSlashSuggestionRender() {
  let root: HTMLDivElement | null = null;
  let selectedIndex = 0;
  let currentProps: SuggestionProps<PixelEditorSlashItem, PixelEditorSlashItem> | null = null;

  const updateList = () => {
    if (!root || !currentProps) return;
    const items = currentProps.items;
    root.innerHTML = '';
    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'pixel-editor-slash-suggest__empty';
      empty.textContent = 'No matches';
      root.appendChild(empty);
      return;
    }
    items.forEach((item, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pixel-editor-slash-suggest__item';
      if (index === selectedIndex) {
        btn.classList.add('pixel-editor-slash-suggest__item--active');
      }
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', String(index === selectedIndex));
      const label = document.createElement('span');
      label.className = 'pixel-editor-slash-suggest__label';
      label.textContent = item.label;
      btn.appendChild(label);
      if (item.subtitle) {
        const sub = document.createElement('span');
        sub.className = 'pixel-editor-slash-suggest__subtitle';
        sub.textContent = item.subtitle;
        btn.appendChild(sub);
      }
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        currentProps?.command(item);
      });
      root!.appendChild(btn);
    });
  };

  const place = (props: SuggestionProps<PixelEditorSlashItem, PixelEditorSlashItem>) => {
    if (!root) return;
    const rect = props.clientRect?.();
    if (!rect) return;
    root.style.position = 'fixed';
    root.style.insetInlineStart = `${Math.round(rect.left)}px`;
    root.style.insetBlockStart = `${Math.round(rect.bottom + 6)}px`;
    root.style.zIndex = '1200';
  };

  return {
    onStart: (props: SuggestionProps<PixelEditorSlashItem, PixelEditorSlashItem>) => {
      currentProps = props;
      selectedIndex = 0;
      ensureSlashSuggestStyles();
      root = document.createElement('div');
      root.className = 'pixel-editor-slash-suggest';
      root.setAttribute('role', 'listbox');
      root.setAttribute('aria-label', 'Slash commands');
      const anchor =
        (props.editor?.view?.dom as HTMLElement | undefined) ?? document.body;
      copyPixelThemeContext(root, anchor);
      document.body.appendChild(root);
      updateList();
      place(props);
    },
    onUpdate: (props: SuggestionProps<PixelEditorSlashItem, PixelEditorSlashItem>) => {
      currentProps = props;
      selectedIndex = 0;
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
        selectedIndex =
          (selectedIndex - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1);
        updateList();
        return true;
      }
      if (props.event.key === 'Enter') {
        const item = items[selectedIndex];
        if (item) {
          props.event.preventDefault();
          currentProps.command(item);
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

export function isSlashAllowed(editor: Editor): boolean {
  return !editor.isActive('code') && !editor.isActive('codeBlock');
}

type SlashSuggestionConfig = Omit<
  SuggestionOptions<PixelEditorSlashItem, PixelEditorSlashItem>,
  'editor'
>;

export type PixelEditorSlashCommandsOptions = {
  suggestion: SlashSuggestionConfig;
};

/**
 * TipTap slash-command (`/`) palette via `@tiptap/suggestion`.
 * Disabled inside inline `code` and `codeBlock`.
 */
export const PixelEditorSlashCommands = Extension.create<PixelEditorSlashCommandsOptions>({
  name: 'pixelEditorSlashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        pluginKey: PixelEditorSlashPluginKey,
        allow: ({ editor }: { editor: Editor; range: Range }) => isSlashAllowed(editor),
        command: ({ editor, range, props }) => {
          editor.chain().focus().deleteRange(range).run();
          props.run(editor);
        },
        items: ({ query }) => filterSlashCommandItems(query),
        render: () => createSlashSuggestionRender(),
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
