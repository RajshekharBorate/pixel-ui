import { Extension, type Editor, type Range } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import Suggestion, {
  type SuggestionKeyDownProps,
  type SuggestionOptions,
  type SuggestionProps,
} from '@tiptap/suggestion';
import type { PixelEditorPanelVariant } from './pixel-editor-panel';
import { insertTableWithDefaults } from './pixel-editor-table';
import {
  attachPixelEditorSuggestReposition,
  createPixelEditorSuggestRoot,
  placePixelEditorSuggestRoot,
  renderPixelEditorSuggestItems,
} from './pixel-editor-suggest-ui';
import {
  DEFAULT_PIXEL_EDITOR_LABELS,
  type PixelEditorLabels,
} from '../pixel-editor-labels';

export type PixelEditorSlashCommandId =
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'orderedList'
  | 'taskList'
  | 'panelInfo'
  | 'panelNote'
  | 'panelSuccess'
  | 'panelWarning'
  | 'panelError'
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
  readonly icon: string;
  /**
   * Apply the command. Must delete the `/query` range in the same chain as the
   * content change whenever possible — separate transactions drop selection and
   * break toggles (headings, lists, etc.).
   */
  readonly command: (opts: { editor: Editor; range: Range }) => void;
};

export const PixelEditorSlashPluginKey = new PluginKey('pixelEditorSlash');

const PANEL_SLASH_META: Record<
  PixelEditorPanelVariant,
  { id: PixelEditorSlashCommandId; label: string; icon: string; keywords: readonly string[] }
> = {
  info: {
    id: 'panelInfo',
    label: 'Info panel',
    icon: 'info',
    keywords: ['panel', 'callout', 'info'],
  },
  note: {
    id: 'panelNote',
    label: 'Note panel',
    icon: 'sticky_note_2',
    keywords: ['panel', 'callout', 'note'],
  },
  success: {
    id: 'panelSuccess',
    label: 'Success panel',
    icon: 'check_circle',
    keywords: ['panel', 'callout', 'success', 'ok'],
  },
  warning: {
    id: 'panelWarning',
    label: 'Warning panel',
    icon: 'warning',
    keywords: ['panel', 'callout', 'warning', 'caution'],
  },
  error: {
    id: 'panelError',
    label: 'Error panel',
    icon: 'error',
    keywords: ['panel', 'callout', 'error', 'danger'],
  },
};

function panelSlashItem(variant: PixelEditorPanelVariant): PixelEditorSlashItem {
  const meta = PANEL_SLASH_META[variant];
  return {
    id: meta.id,
    label: meta.label,
    icon: meta.icon,
    keywords: meta.keywords,
    subtitle: 'Callout',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setPanel(variant).run();
    },
  };
}

/** Catalog of slash palette commands (filterable). */
export const PIXEL_EDITOR_SLASH_COMMANDS: readonly PixelEditorSlashItem[] = [
  {
    id: 'heading1',
    label: 'Heading 1',
    icon: 'format_h1',
    keywords: ['h1', 'heading', 'title'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
    },
  },
  {
    id: 'heading2',
    label: 'Heading 2',
    icon: 'format_h2',
    keywords: ['h2', 'heading', 'subtitle'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
    },
  },
  {
    id: 'heading3',
    label: 'Heading 3',
    icon: 'format_h3',
    keywords: ['h3', 'heading'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
    },
  },
  {
    id: 'bulletList',
    label: 'Bullet list',
    icon: 'format_list_bulleted',
    keywords: ['ul', 'unordered', 'bullets', 'list'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    id: 'orderedList',
    label: 'Ordered list',
    icon: 'format_list_numbered',
    keywords: ['ol', 'numbered', 'list'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    id: 'taskList',
    label: 'Task list',
    icon: 'checklist',
    keywords: ['todo', 'checklist', 'task', 'checkbox'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  ...(['info', 'note', 'success', 'warning', 'error'] as const).map(
    (variant): PixelEditorSlashItem => panelSlashItem(variant),
  ),
  {
    id: 'codeBlock',
    label: 'Code block',
    icon: 'code',
    keywords: ['code', 'pre', 'snippet'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    id: 'table',
    label: 'Table',
    icon: 'table',
    keywords: ['table', 'grid'],
    subtitle: '2×2 with header',
    command: ({ editor, range }) => {
      // insertTable is its own command chain — clear `/query` first.
      editor.chain().focus().deleteRange(range).run();
      insertTableWithDefaults(editor, 2, 2, true);
    },
  },
  {
    id: 'horizontalRule',
    label: 'Horizontal rule',
    icon: 'horizontal_rule',
    keywords: ['hr', 'divider', 'line', 'separator'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    id: 'image',
    label: 'Image',
    icon: 'image',
    keywords: ['img', 'photo', 'picture', 'media'],
    subtitle: 'URL or upload',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      // After the suggestion closes, open the toolbar image popover.
      queueMicrotask(() => slashHooks(editor).openImagePopover?.());
    },
  },
  {
    id: 'mention',
    label: 'Mention',
    icon: 'alternate_email',
    keywords: ['@', 'person', 'user', 'people'],
    subtitle: 'Opens @ mention',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertContent('@').run();
    },
  },
  {
    id: 'emoji',
    label: 'Emoji',
    icon: 'sentiment_satisfied',
    keywords: ['emoji', 'smiley', 'reaction'],
    subtitle: 'Pick an emoji',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      queueMicrotask(() => slashHooks(editor).openEmojiPopover?.());
    },
  },
  {
    id: 'date',
    label: 'Date',
    icon: 'calendar_today',
    keywords: ['date', 'calendar', 'today'],
    subtitle: 'Pick a date',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      queueMicrotask(() => slashHooks(editor).openDatePopover?.());
    },
  },
];


const SLASH_LABEL_KEYS: Record<
  PixelEditorSlashCommandId,
  { label: keyof PixelEditorLabels; subtitle?: keyof PixelEditorLabels }
> = {
  heading1: { label: 'slashHeading1' },
  heading2: { label: 'slashHeading2' },
  heading3: { label: 'slashHeading3' },
  bulletList: { label: 'slashBulletList' },
  orderedList: { label: 'slashOrderedList' },
  taskList: { label: 'slashTaskList' },
  panelInfo: { label: 'slashInfoPanel', subtitle: 'slashCalloutSubtitle' },
  panelNote: { label: 'slashNotePanel', subtitle: 'slashCalloutSubtitle' },
  panelSuccess: { label: 'slashSuccessPanel', subtitle: 'slashCalloutSubtitle' },
  panelWarning: { label: 'slashWarningPanel', subtitle: 'slashCalloutSubtitle' },
  panelError: { label: 'slashErrorPanel', subtitle: 'slashCalloutSubtitle' },
  codeBlock: { label: 'slashCodeBlock' },
  table: { label: 'slashTable', subtitle: 'slashTableSubtitle' },
  horizontalRule: { label: 'slashHorizontalRule' },
  image: { label: 'slashImage', subtitle: 'slashImageSubtitle' },
  mention: { label: 'slashMention', subtitle: 'slashMentionSubtitle' },
  emoji: { label: 'slashEmoji', subtitle: 'slashEmojiSubtitle' },
  date: { label: 'slashDate', subtitle: 'slashDateSubtitle' },
};

/** Apply i18n labels onto the static slash catalog. */
export function resolveSlashCommands(
  labels: PixelEditorLabels = DEFAULT_PIXEL_EDITOR_LABELS,
): PixelEditorSlashItem[] {
  return PIXEL_EDITOR_SLASH_COMMANDS.map((item) => {
    const keys = SLASH_LABEL_KEYS[item.id];
    return {
      ...item,
      label: labels[keys.label],
      subtitle: keys.subtitle ? labels[keys.subtitle] : item.subtitle,
    };
  });
}

export function filterSlashCommandItems(
  query: string,
  labels: PixelEditorLabels = DEFAULT_PIXEL_EDITOR_LABELS,
): PixelEditorSlashItem[] {
  const q = query.trim().toLowerCase();
  return resolveSlashCommands(labels).filter((item) => {
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
 * Floating slash-command list (no tippy). Uses shared suggest chrome that
 * mirrors `pixel-select` options (icon + label + subtitle).
 */
export function createSlashSuggestionRender(
  getLabels: () => PixelEditorLabels = () => DEFAULT_PIXEL_EDITOR_LABELS,
) {
  let root: HTMLDivElement | null = null;
  let selectedIndex = 0;
  let currentProps: SuggestionProps<PixelEditorSlashItem, PixelEditorSlashItem> | null =
    null;
  let detachReposition: (() => void) | null = null;

  const pick = (index: number) => {
    const item = currentProps?.items[index];
    if (item) currentProps?.command(item);
  };

  const updateList = () => {
    if (!root || !currentProps) return;
    const labels = getLabels();
    renderPixelEditorSuggestItems(
      root,
      currentProps.items,
      selectedIndex,
      pick,
      labels.suggestNoMatches,
    );
    placePixelEditorSuggestRoot(root, currentProps.clientRect);
  };

  return {
    onStart: (props: SuggestionProps<PixelEditorSlashItem, PixelEditorSlashItem>) => {
      currentProps = props;
      selectedIndex = 0;
      const anchor =
        (props.editor?.view?.dom as HTMLElement | undefined) ?? document.body;
      root = createPixelEditorSuggestRoot(getLabels().slashCommands, anchor);
      updateList();
      detachReposition?.();
      detachReposition = attachPixelEditorSuggestReposition(root, () =>
        currentProps?.clientRect?.() ?? null,
      );
    },
    onUpdate: (props: SuggestionProps<PixelEditorSlashItem, PixelEditorSlashItem>) => {
      currentProps = props;
      selectedIndex = 0;
      updateList();
      // Refresh scroll listener with latest clientRect closure.
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
          currentProps.command(item);
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

export function isSlashAllowed(editor: Editor): boolean {
  return !editor.isActive('code') && !editor.isActive('codeBlock');
}

type SlashSuggestionConfig = Omit<
  SuggestionOptions<PixelEditorSlashItem, PixelEditorSlashItem>,
  'editor'
>;

export type PixelEditorSlashCommandsOptions = {
  /** Opens the toolbar Insert image popover (wired by `pixel-editor`). */
  openImagePopover: (() => void) | null;
  /** Opens the toolbar Emoji popover (wired by `pixel-editor`). */
  openEmojiPopover: (() => void) | null;
  /** Opens the toolbar Insert date popover (wired by `pixel-editor`). */
  openDatePopover: (() => void) | null;
  /** Resolves i18n labels for slash item copy and panel chrome. */
  getLabels: () => PixelEditorLabels;
  suggestion: SlashSuggestionConfig;
};

function slashHooks(editor: Editor): {
  openImagePopover?: (() => void) | null;
  openEmojiPopover?: (() => void) | null;
  openDatePopover?: (() => void) | null;
} {
  const ext = editor.extensionManager.extensions.find(
    (e) => e.name === 'pixelEditorSlashCommands',
  );
  return (ext?.options ?? {}) as PixelEditorSlashCommandsOptions;
}

/**
 * TipTap slash-command (`/`) palette via `@tiptap/suggestion`.
 * Disabled inside inline `code` and `codeBlock`.
 */
export const PixelEditorSlashCommands = Extension.create<PixelEditorSlashCommandsOptions>({
  name: 'pixelEditorSlashCommands',

  addOptions() {
    return {
      openImagePopover: null,
      openEmojiPopover: null,
      openDatePopover: null,
      getLabels: () => DEFAULT_PIXEL_EDITOR_LABELS,
      suggestion: {
        char: '/',
        pluginKey: PixelEditorSlashPluginKey,
        allow: ({ editor }: { editor: Editor; range: Range }) => isSlashAllowed(editor),
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
        items: ({ query }) => filterSlashCommandItems(query),
        render: () => createSlashSuggestionRender(),
      },
    };
  },

  addProseMirrorPlugins() {
    const getLabels = this.options.getLabels ?? (() => DEFAULT_PIXEL_EDITOR_LABELS);
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }) => filterSlashCommandItems(query, getLabels()),
        render: () => createSlashSuggestionRender(getLabels),
      }),
    ];
  },
});
