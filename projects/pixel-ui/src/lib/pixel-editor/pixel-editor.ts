import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  NgControl,
  type AbstractControl,
  type ValidationErrors,
  type Validator,
} from '@angular/forms';
import { merge } from 'rxjs';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { TextStyle, FontSize } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { Mention } from '@tiptap/extension-mention';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { PixelEditorPanel } from './extensions/pixel-editor-panel';
import { PixelEditorDateChip } from './extensions/pixel-editor-date-chip';
import { PixelEditorImage } from './extensions/pixel-editor-image';
import { PixelEditorCaption, PixelEditorFigure } from './extensions/pixel-editor-figure';
import { pixelEditorLowlight } from './extensions/pixel-editor-lowlight';
import { PixelEditorPasteSanitize } from './extensions/pixel-editor-paste-sanitize';
import { PixelEditorFindHighlight } from './extensions/pixel-editor-find';
import type { PixelEditorFindMatch } from './extensions/pixel-editor-find';
import { cropImageToBlob } from './pixel-editor-image-crop.util';
import {
  createMentionSuggestionRender,
  filterMentionItems,
} from './extensions/pixel-editor-mention-suggestion';
import { PixelEditorSlashCommands } from './extensions/pixel-editor-slash-suggestion';
import { collectEditorText, isEditorDocEmpty } from './pixel-editor-doc.util';
import { editorDocToMarkdown } from './pixel-editor-markdown.util';
import PixelEditorStatusBarComponent from './pixel-editor-status-bar';
import PixelEditorToolbarComponent from './pixel-editor-toolbar';
import PixelEditorImageToolbarComponent from './pixel-editor-image-toolbar';
import PixelEditorTableToolbarComponent from './pixel-editor-table-toolbar';
import { ensurePixelEditorContentStyles } from './pixel-editor-content-styles';
import { PixelEditorEngine } from './pixel-editor.service';
import type { PixelEditorImageRequest } from './pickers/pixel-editor-picker.types';
import type {
  PixelEditorMentionItem,
  PixelEditorMentionQuery,
} from './pickers/pixel-editor-insert-data';
import type {
  PixelEditorBlockKind,
  PixelEditorCountMode,
  PixelEditorDoc,
  PixelEditorSaveState,
  PixelEditorSize,
  PixelEditorToolbarConfig,
  PixelEditorToolbarPosition,
  PixelEditorValidationMessages,
} from './pixel-editor.types';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';
import PixelLoaderComponent from '../pixel-loader/pixel-loader';
import PixelEmptyStateComponent from '../pixel-empty-state/pixel-empty-state';

let nextEditorId = 0;

const EMPTY_DOC: PixelEditorDoc = { type: 'doc', content: [{ type: 'paragraph' }] };

const VALIDATION_MESSAGE_PRIORITY = ['required', 'minlength'] as const;

function interpolateValidationTemplate(template: string, errorValue: unknown): string {
  if (!errorValue || typeof errorValue !== 'object') {
    return template;
  }
  let result = template;
  for (const [key, value] of Object.entries(errorValue as Record<string, unknown>)) {
    result = result.replaceAll(`{${key}}`, String(value));
  }
  return result;
}

function resolveValidationMessage(
  errors: ValidationErrors,
  messages: PixelEditorValidationMessages,
): string {
  for (const key of VALIDATION_MESSAGE_PRIORITY) {
    if (errors[key] != null) {
      const tpl = messages[key]?.trim();
      if (tpl) {
        return interpolateValidationTemplate(tpl, errors[key]);
      }
    }
  }
  for (const key of Object.keys(errors)) {
    const tpl = messages[key]?.trim();
    if (tpl) {
      return interpolateValidationTemplate(tpl, errors[key]);
    }
  }
  return '';
}

/**
 * Jira-like rich text editor backed by TipTap (ProseMirror).
 *
 * Canonical `value` is JSON (`PixelEditorDoc`). HTML is available via `(htmlChange)`.
 * TipTap packages are optional peers — install them when using this component.
 *
 * @example
 * ```html
 * <pixel-editor label="Description" [(value)]="doc" />
 * ```
 */
@Component({
  selector: 'pixel-editor',
  imports: [
    PixelEditorToolbarComponent,
    PixelEditorStatusBarComponent,
    PixelEditorImageToolbarComponent,
    PixelEditorTableToolbarComponent,
    PixelSkeletonComponent,
    PixelLoaderComponent,
    PixelEmptyStateComponent,
  ],
  templateUrl: './pixel-editor.html',
  styleUrl: './pixel-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    PixelEditorEngine,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PixelEditorComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PixelEditorComponent),
      multi: true,
    },
  ],
  host: {
    class: 'pixel-editor',
    '[attr.id]': 'id() || fallbackId',
    '[attr.data-size]': 'size()',
    '[attr.data-disabled]': 'disabled() || null',
    '[attr.data-readonly]': 'readonly() || null',
    '[attr.data-fullscreen]': 'fullscreen() || null',
    '[attr.data-loading]': 'loading() || null',
    '[attr.data-invalid]': 'showsValidationError() || null',
    '[attr.data-toolbar-position]': 'toolbarPosition()',
    '[attr.aria-busy]': 'loading() || null',
    '[attr.aria-invalid]': 'showsValidationError() ? "true" : null',
    '[attr.aria-describedby]': 'describedByIds()',
    '[class.pixel-editor--fullscreen]': 'fullscreen()',
    '[class.pixel-editor--invalid]': 'showsValidationError()',
    '(keydown)': 'onHostKeydown($event)',
  },
})
export default class PixelEditorComponent implements ControlValueAccessor, Validator {
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  protected readonly engine = inject(PixelEditorEngine);

  private hostEditor: Editor | null = null;
  private suppressEmit = false;
  private onChange: (value: PixelEditorDoc) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private onValidatorChange: () => void = () => undefined;
  private cvaDisabled = false;

  /** True when the bound NgControl is invalid and touched or dirty. */
  private readonly controlShowsError = signal(false);
  private readonly controlValidationErrors = signal<ValidationErrors | null>(null);

  protected readonly surfaceRef = viewChild<ElementRef<HTMLElement>>('surface');
  private readonly imageToolbarHost = viewChild('imageToolbarHost', { read: ElementRef });
  private readonly tableToolbarHost = viewChild('tableToolbarHost', { read: ElementRef });

  protected readonly fallbackId = `pixel-editor-${++nextEditorId}`;
  protected readonly helperId = `${this.fallbackId}-helper`;
  protected readonly errorId = `${this.fallbackId}-error`;

  /**
   * Optional host id.
   *
   * @type {string}
   * @default ''
   */
  readonly id = input('');

  /**
   * Visible field label above the editor.
   *
   * @type {string}
   * @default ''
   */
  readonly label = input('');

  /**
   * Placeholder when the document is empty.
   *
   * @type {string}
   * @default ''
   */
  readonly placeholder = input('');

  /**
   * Canonical document JSON (controlled). Prefer with `(valueChange)` or forms CVA.
   *
   * @type {PixelEditorDoc | null}
   * @default null
   */
  readonly value = input<PixelEditorDoc | null>(null);

  /**
   * Toolbar group visibility.
   *
   * @type {PixelEditorToolbarConfig}
   * @default {}
   */
  readonly toolbar = input<PixelEditorToolbarConfig>({});

  /**
   * Places the formatting toolbar above (`top`) or below (`bottom`) the canvas.
   * When `bottom`, the status bar is hidden even if `showStatusBar` is true.
   *
   * @type {PixelEditorToolbarPosition}
   * @default 'top'
   */
  readonly toolbarPosition = input<PixelEditorToolbarPosition>('top');

  /**
   * Chrome density.
   *
   * @type {PixelEditorSize}
   * @default 'md'
   */
  readonly size = input<PixelEditorSize>('md');

  /**
   * Minimum height of the editing surface.
   *
   * @type {string}
   * @default '12rem'
   */
  readonly minHeight = input('12rem');

  /**
   * Disables interaction.
   *
   * @type {boolean}
   * @default false
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Read-only surface (focus allowed; edits blocked).
   *
   * @type {boolean}
   * @default false
   */
  readonly readonly = input(false, { transform: booleanAttribute });

  /**
   * Shows the footer status bar. Ignored when `toolbarPosition` is `bottom`
   * (toolbar replaces the footer chrome).
   *
   * @type {boolean}
   * @default true
   */
  readonly showStatusBar = input(true, { transform: booleanAttribute });

  /**
   * Shows the formatting toolbar.
   *
   * @type {boolean}
   * @default true
   */
  readonly showToolbar = input(true, { transform: booleanAttribute });

  /**
   * Fullscreen presentation of the host.
   *
   * @type {boolean}
   * @default false
   */
  readonly fullscreen = model(false);

  /**
   * Status-bar save indicator.
   *
   * @type {PixelEditorSaveState}
   * @default 'idle'
   */
  readonly saveState = input<PixelEditorSaveState>('idle');

  /**
   * Relative time next to save state.
   *
   * @type {string}
   * @default ''
   */
  readonly savedAtLabel = input('');

  /**
   * Optional override for the status-bar block breadcrumb. When unset, follows selection.
   *
   * @type {PixelEditorBlockKind | null}
   * @default null
   */
  readonly blockKind = input<PixelEditorBlockKind | null>(null);

  /**
   * Status-bar count mode: words, characters (no spaces), or characters with spaces.
   *
   * @type {PixelEditorCountMode}
   * @default 'words'
   */
  readonly countMode = input<PixelEditorCountMode>('words');

  /**
   * Emits when the document JSON changes.
   *
   * @type {PixelEditorDoc}
   */
  readonly valueChange = output<PixelEditorDoc>();

  /**
   * Emits derived HTML when the document changes.
   *
   * @type {string}
   */
  readonly htmlChange = output<string>();

  /**
   * Image insert via upload or URL — apps may upload `file` then replace `src`.
   *
   * @type {PixelEditorImageRequest}
   */
  readonly imageRequest = output<PixelEditorImageRequest>();

  /**
   * People/entities available for @mentions (client filter + suggestion list).
   *
   * @type {readonly PixelEditorMentionItem[]}
   * @default []
   */
  readonly mentionItems = input<readonly PixelEditorMentionItem[]>([]);

  /**
   * Emits as the user types after `@` (for optional server-side filtering).
   *
   * @type {PixelEditorMentionQuery}
   */
  readonly mentionQuery = output<PixelEditorMentionQuery>();

  /**
   * Replaces the editor chrome with a skeleton placeholder (async hydrate).
   *
   * @type {boolean}
   * @default false
   */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  /**
   * Shows an inline loading overlay on the surface and sets `aria-busy`.
   *
   * @type {boolean}
   * @default false
   */
  readonly loading = input(false, { transform: booleanAttribute });

  /**
   * Accessible label for the loading overlay.
   *
   * @type {string}
   * @default 'Loading'
   */
  readonly loadingLabel = input('Loading');

  /**
   * Marks the control required — empty documents (no text) are invalid.
   *
   * @type {boolean}
   * @default false
   */
  readonly required = input(false, { transform: booleanAttribute });

  /**
   * Minimum plain-text length (after trim). `0` disables.
   *
   * @type {number}
   * @default 0
   */
  readonly minLength = input(0, { transform: numberAttribute });

  /**
   * Optional empty-state heading when the document has no text (first-use).
   * TipTap placeholder still applies when this is empty.
   *
   * @type {string}
   * @default ''
   */
  readonly emptyHeading = input('');

  /**
   * Optional empty-state description paired with `emptyHeading`.
   *
   * @type {string}
   * @default ''
   */
  readonly emptyDescription = input('');

  /**
   * Helper text below the frame (hidden while a validation error is shown).
   *
   * @type {string}
   * @default ''
   */
  readonly helperText = input('');

  /**
   * Forces the error message (and error chrome) regardless of control state.
   *
   * @type {string}
   * @default ''
   */
  readonly errorOverride = input('');

  /**
   * Map of validation error keys to messages when the bound control is invalid and
   * touched/dirty. Use `{requiredLength}` / `{actualLength}` in `minlength` strings.
   *
   * @type {PixelEditorValidationMessages}
   * @default {}
   */
  readonly validationMessages = input<PixelEditorValidationMessages>({});

  /** Live doc for word count (engine JSON after mount). */
  private readonly liveDoc = signal<PixelEditorDoc>(EMPTY_DOC);

  /** Image selection chrome. */
  protected readonly imageToolbarState = signal<{
    src: string;
    alt: string;
    align: string;
    width: string | null;
    float: string;
    hasCaption: boolean;
  } | null>(null);

  /** Floating image toolbar position relative to the surface wrap. */
  protected readonly imageToolbarPos = signal<{ top: number; left: number } | null>(null);

  /** Table selection chrome. */
  protected readonly tableToolbarVisible = signal(false);

  /** Floating table toolbar position relative to the surface wrap. */
  protected readonly tableToolbarPos = signal<{ top: number; left: number } | null>(null);

  /** Find & replace bar. */
  protected readonly findBarOpen = signal(false);
  protected readonly findQuery = signal('');
  protected readonly replaceQuery = signal('');
  protected readonly findMatchCase = signal(false);
  protected readonly findMatchWholeWord = signal(false);
  protected readonly findMatches = signal<readonly PixelEditorFindMatch[]>([]);
  protected readonly findActiveIndex = signal(0);

  /** Internal cycle override when user clicks status-bar count (falls back to input). */
  private readonly countModeOverride = signal<PixelEditorCountMode | null>(null);

  protected readonly resolvedCountMode = computed(
    () => this.countModeOverride() ?? this.countMode(),
  );

  protected readonly textCount = computed(() =>
    countDocument(this.liveDoc(), this.resolvedCountMode()),
  );

  protected readonly findMatchDisplayIndex = computed(() => {
    const matches = this.findMatches();
    if (matches.length === 0) return 0;
    return this.findActiveIndex() + 1;
  });

  protected readonly resolvedBlockKind = computed(() => {
    const override = this.blockKind();
    if (override) return override;
    return this.engine.activeBlockKind();
  });

  protected readonly interactionLocked = computed(
    () => this.disabled() || this.cvaDisabled || this.readonly() || this.loading(),
  );

  /** Status bar is suppressed when the toolbar sits in the footer slot. */
  protected readonly statusBarVisible = computed(
    () => this.showStatusBar() && this.toolbarPosition() !== 'bottom',
  );

  protected readonly showEmptyOverlay = computed(
    () =>
      Boolean(this.emptyHeading()) &&
      !this.showSkeleton() &&
      !this.loading() &&
      isEditorDocEmpty(this.liveDoc()),
  );

  protected readonly hasErrorOverride = computed(() => this.errorOverride().trim().length > 0);

  protected readonly showsValidationError = computed(
    () => this.hasErrorOverride() || this.controlShowsError(),
  );

  protected readonly resolvedValidationMessage = computed(() => {
    const override = this.errorOverride().trim();
    if (override) return override;
    if (!this.controlShowsError()) return '';
    const errors = this.controlValidationErrors();
    if (!errors) return '';
    return resolveValidationMessage(errors, this.validationMessages());
  });

  protected readonly showHelperHint = computed(
    () => this.helperText().trim().length > 0 && !this.showsValidationError(),
  );

  protected readonly describedByIds = computed(() => {
    const ids: string[] = [];
    if (this.resolvedValidationMessage()) ids.push(this.errorId);
    else if (this.showHelperHint()) ids.push(this.helperId);
    return ids.length ? ids.join(' ') : null;
  });

  constructor() {
    afterNextRender(
      () => {
        if (!this.showSkeleton()) {
          this.mountEditor();
        }
      },
      { injector: this.injector },
    );

    this.destroyRef.onDestroy(() => this.destroyEditor());

    effect(() => {
      const skeleton = this.showSkeleton();
      if (skeleton) {
        untracked(() => this.destroyEditor());
        return;
      }
      queueMicrotask(() => {
        if (!this.showSkeleton() && !this.hostEditor) {
          this.mountEditor();
        }
      });
    });

    effect(() => {
      const doc = this.value();
      const editor = this.engine.editor();
      if (!editor) return;
      const next = doc ?? EMPTY_DOC;
      const current = untracked(() => JSON.stringify(this.engine.getJSON()));
      if (current === JSON.stringify(next)) return;
      this.suppressEmit = true;
      this.engine.setContent(next, false);
      this.liveDoc.set(this.engine.getJSON());
      this.suppressEmit = false;
    });

    effect(() => {
      const locked = this.disabled() || this.cvaDisabled;
      const readonly = this.readonly();
      const loading = this.loading();
      const editor = this.engine.editor();
      if (!editor) return;
      editor.setEditable(!(locked || readonly || loading));
    });

    effect(() => {
      const placeholder = this.placeholder();
      // Placeholder extension reads option at create-time; remount not required for Phase 1 —
      // empty document still shows CSS ::before via data-placeholder until TipTap placeholder paints.
      void placeholder;
    });

    effect((onCleanup) => {
      if (!this.fullscreen()) return;
      const onKey = (event: KeyboardEvent) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        this.fullscreen.set(false);
      };
      document.addEventListener('keydown', onKey);
      onCleanup(() => document.removeEventListener('keydown', onKey));
    });

    effect(() => {
      this.required();
      this.minLength();
      untracked(() => this.onValidatorChange());
    });

    effect((onCleanup) => {
      const control = untracked(() => this.resolveFormControl());
      if (!control) {
        untracked(() => {
          this.controlShowsError.set(false);
          this.controlValidationErrors.set(null);
        });
        return;
      }

      const sync = (): void => {
        this.controlValidationErrors.set(control.errors);
        this.controlShowsError.set(
          Boolean(!control.pending && control.invalid && (control.touched || control.dirty)),
        );
      };

      sync();
      const sub = merge(control.statusChanges, control.valueChanges, control.events).subscribe(sync);
      onCleanup(() => sub.unsubscribe());
    });
  }

  writeValue(value: PixelEditorDoc | null): void {
    const next = value ?? EMPTY_DOC;
    this.liveDoc.set(next);
    if (this.engine.editor()) {
      this.suppressEmit = true;
      this.engine.setContent(next, false);
      this.suppressEmit = false;
    }
  }

  registerOnChange(fn: (value: PixelEditorDoc) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled = isDisabled;
    this.engine.setEditable(!(isDisabled || this.disabled() || this.readonly() || this.loading()));
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const doc = (control.value as PixelEditorDoc | null) ?? EMPTY_DOC;
    const text = collectEditorText(doc).trim();

    if (this.required() && text.length === 0) {
      return { required: true };
    }

    const min = this.minLength();
    if (min > 0 && text.length > 0 && text.length < min) {
      return { minlength: { requiredLength: min, actualLength: text.length } };
    }

    return null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  protected onFullscreenToggle(): void {
    this.fullscreen.update((v) => !v);
  }

  protected onSurfaceBlur(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    const frame = (event.currentTarget as HTMLElement | null)?.closest('.pixel-editor__frame');
    if (next && frame?.contains(next)) {
      return;
    }
    this.onTouched();
  }

  /**
   * Empty ProseMirror only lays out one line inside a tall canvas. Clicks on the
   * empty root (not a child block) must still place the caret.
   */
  protected onCanvasPointerDown(event: PointerEvent): void {
    if (this.interactionLocked()) return;
    if (event.button !== 0) return;

    const editor = this.engine.editor();
    if (!editor || editor.isDestroyed) return;

    const view = editor.view;
    const target = event.target as HTMLElement | null;
    if (!target) return;

    if (target.closest('a, button, input, textarea, label, [contenteditable="false"]')) {
      return;
    }

    // Click on the editor root itself (empty canvas below content) or the wrap padding.
    const clickedEmptyCanvas =
      target === view.dom || target.classList.contains('pixel-editor__surface-wrap');
    if (!clickedEmptyCanvas) {
      return;
    }

    event.preventDefault();
    editor.chain().focus('end').run();
  }

  protected focusEditor(): void {
    this.engine.focus();
  }

  private resolveFormControl(): AbstractControl | null {
    return this.injector.get(NgControl, null, { optional: true, self: true })?.control ?? null;
  }

  private mountEditor(): void {
    const el = this.surfaceRef()?.nativeElement;
    if (!el || this.hostEditor) return;

    ensurePixelEditorContentStyles();

    // Clear any leftover DOM from a previous mount (skeleton remount / destroy).
    el.replaceChildren();

    const placeholder = this.placeholder() || 'Write a description…';
    const initial = this.value() ?? this.liveDoc() ?? EMPTY_DOC;

    const editor = new Editor({
      // Use mount mode so ProseMirror edits *this* element (not a nested child).
      // Nested mount shrinks to one line and escapes Angular style encapsulation.
      element: { mount: el },
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          // Configure link once below; code block replaced by lowlight extension.
          link: false,
          codeBlock: false,
        }),
        CodeBlockLowlight.configure({
          lowlight: pixelEditorLowlight,
          HTMLAttributes: { class: 'pixel-editor-code-block' },
        }),
        Link.configure({
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          defaultProtocol: 'https',
          HTMLAttributes: { rel: 'noopener noreferrer nofollow' },
        }),
        TextStyle,
        FontSize,
        Color,
        Highlight.configure({ multicolor: true }),
        PixelEditorImage,
        PixelEditorFigure,
        PixelEditorCaption,
        Placeholder.configure({
          placeholder,
          emptyEditorClass: 'is-editor-empty',
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
          alignments: ['left', 'center', 'right', 'justify'],
        }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Table.configure({
          resizable: false,
          HTMLAttributes: { class: 'pixel-editor-table' },
        }),
        TableRow,
        TableHeader,
        TableCell,
        PixelEditorPanel,
        PixelEditorDateChip,
        PixelEditorPasteSanitize,
        Mention.configure({
          HTMLAttributes: { class: 'pixel-editor-mention' },
          renderText: ({ node }) => `@${node.attrs['label'] ?? node.attrs['id'] ?? ''}`,
          suggestion: {
            char: '@',
            items: ({ query }) => filterMentionItems(this.mentionItems(), query),
            render: () =>
              createMentionSuggestionRender((query) => {
                this.mentionQuery.emit({ query });
              }),
          },
        }),
        PixelEditorSlashCommands,
        PixelEditorFindHighlight,
      ],
      content: initial as import('@tiptap/core').Content,
      editable: !(this.disabled() || this.cvaDisabled || this.readonly() || this.loading()),
      editorProps: {
        attributes: {
          class: 'pixel-editor__surface pixel-editor__prose',
          role: 'textbox',
          'aria-multiline': 'true',
          'aria-label': this.label() || 'Rich text editor',
        },
      },
      onUpdate: ({ editor: ed }) => {
        this.engine.bump();
        if (this.findBarOpen()) {
          this.resyncFindDecorationsOnly();
        }
        if (this.tableToolbarVisible()) {
          this.updateTableToolbarPosition(ed);
        }
        if (this.suppressEmit) return;
        const json = ed.getJSON() as PixelEditorDoc;
        this.liveDoc.set(json);
        this.valueChange.emit(json);
        this.htmlChange.emit(ed.getHTML());
        this.onChange(json);
        this.onValidatorChange();
      },
      onSelectionUpdate: ({ editor: ed }) => {
        this.engine.bump();
        this.syncImageToolbar(ed);
        this.syncTableToolbar(ed);
      },
      onBlur: () => {
        this.onTouched();
      },
    });

    this.hostEditor = editor;
    this.engine.attach(editor);
    this.liveDoc.set(editor.getJSON() as PixelEditorDoc);
    this.syncImageToolbar(editor);
    this.syncTableToolbar(editor);
  }

  private syncTableToolbar(ed: Editor): void {
    if (!ed.isActive('table')) {
      this.tableToolbarVisible.set(false);
      this.tableToolbarPos.set(null);
      return;
    }
    this.tableToolbarVisible.set(true);
    this.updateTableToolbarPosition(ed);
  }

  private updateTableToolbarPosition(ed: Editor): void {
    const wrap = this.surfaceRef()?.nativeElement.closest(
      '.pixel-editor__surface-wrap',
    ) as HTMLElement | null;
    const tableEl = resolveActiveTableElement(ed);
    if (!wrap || !tableEl) {
      this.tableToolbarPos.set({ top: 8, left: 8 });
      return;
    }

    requestAnimationFrame(() => {
      const wrapRect = wrap.getBoundingClientRect();
      const tableRect = tableEl.getBoundingClientRect();
      const toolbarEl = this.tableToolbarHost()?.nativeElement as HTMLElement | undefined;
      const toolbarWidth = Math.max(toolbarEl?.offsetWidth ?? 0, 240);
      const toolbarHeight = Math.max(toolbarEl?.offsetHeight ?? 0, 44);
      const gap = 10;
      const pad = 8;
      const maxLeft = Math.max(pad, wrap.clientWidth - toolbarWidth - pad);

      let left = tableRect.left - wrapRect.left + wrap.scrollLeft;
      left = Math.min(Math.max(pad, left), maxLeft);

      // Prefer above the table; if clipped, place below.
      let top = tableRect.top - wrapRect.top - toolbarHeight - gap + wrap.scrollTop;
      if (top < pad) {
        top = tableRect.bottom - wrapRect.top + gap + wrap.scrollTop;
      }

      this.tableToolbarPos.set({ top, left });
    });
  }

  protected onHostKeydown(event: KeyboardEvent): void {
    if (this.interactionLocked()) return;
    const mod = event.metaKey || event.ctrlKey;
    if (mod && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFindBar();
    }
    if (event.key === 'Escape' && this.findBarOpen()) {
      event.preventDefault();
      this.closeFindBar();
    }
  }

  protected openFindBar(): void {
    this.findBarOpen.set(true);
    this.syncFindHighlightsOnly(0);
  }

  protected onFindOpenChange(open: boolean): void {
    if (open) {
      this.findBarOpen.set(true);
      this.syncFindHighlightsOnly(this.findActiveIndex());
      return;
    }
    this.closeFindBar();
  }

  protected closeFindBar(): void {
    this.findBarOpen.set(false);
    this.findQuery.set('');
    this.replaceQuery.set('');
    this.findMatchCase.set(false);
    this.findMatchWholeWord.set(false);
    this.findMatches.set([]);
    this.findActiveIndex.set(0);
    this.engine.clearFindHighlights();
  }

  protected onFindQueryChange(query: string): void {
    this.findQuery.set(query);
    // Decorations only — selecting/focusing the editor steals caret from the find input.
    this.syncFindHighlightsOnly(0);
  }

  protected onReplaceQueryChange(query: string): void {
    this.replaceQuery.set(query);
  }

  protected onFindMatchCaseChange(value: boolean): void {
    this.findMatchCase.set(value);
    this.syncFindHighlightsOnly(0);
  }

  protected onFindMatchWholeWordChange(value: boolean): void {
    this.findMatchWholeWord.set(value);
    this.syncFindHighlightsOnly(0);
  }

  protected onFindNext(): void {
    const matches = this.findMatches();
    if (matches.length === 0) return;
    const next = (this.findActiveIndex() + 1) % matches.length;
    this.goToFindMatch(next);
  }

  protected onFindPrev(): void {
    const matches = this.findMatches();
    if (matches.length === 0) return;
    const prev = (this.findActiveIndex() - 1 + matches.length) % matches.length;
    this.goToFindMatch(prev);
  }

  protected onReplaceOne(): void {
    const matches = this.findMatches();
    const idx = this.findActiveIndex();
    const match = matches[idx];
    if (!match) return;
    this.engine.replaceRange(match.from, match.to, this.replaceQuery());
    this.syncFindHighlightsOnly(idx);
  }

  protected onReplaceAll(): void {
    const q = this.findQuery().trim();
    if (!q) return;
    this.engine.replaceAllOccurrences(q, this.replaceQuery(), this.findOptions());
    this.syncFindHighlightsOnly(0);
  }

  private findOptions(): { matchCase: boolean; matchWholeWord: boolean } {
    return {
      matchCase: this.findMatchCase(),
      matchWholeWord: this.findMatchWholeWord(),
    };
  }

  /** Refresh find decorations without moving focus into the editor. */
  private syncFindHighlightsOnly(preferredIndex: number): void {
    const { matches, activeIndex } = this.engine.syncFindHighlights(
      this.findQuery(),
      preferredIndex,
      this.findOptions(),
    );
    this.findMatches.set(matches);
    this.findActiveIndex.set(activeIndex);
  }

  /** After doc edits, refresh highlights without forcing selection. */
  private resyncFindDecorationsOnly(): void {
    this.syncFindHighlightsOnly(this.findActiveIndex());
  }

  private goToFindMatch(index: number): void {
    const { matches, activeIndex } = this.engine.syncFindHighlights(
      this.findQuery(),
      index,
      this.findOptions(),
    );
    this.findMatches.set(matches);
    this.findActiveIndex.set(activeIndex);
    const match = matches[activeIndex];
    // Keep focus in the find popover while scrolling the match into view.
    if (match) this.engine.selectFindMatch(match.from, match.to, { focus: false });
  }

  protected onTableAddRow(): void {
    this.engine.addRowAfter();
  }

  protected onTableAddColumn(): void {
    this.engine.addColumnAfter();
  }

  protected onTableDeleteRow(): void {
    this.engine.deleteRow();
  }

  protected onTableDeleteColumn(): void {
    this.engine.deleteColumn();
  }

  protected onTableToggleHeader(): void {
    this.engine.toggleHeaderRow();
  }

  protected onTableDelete(): void {
    this.engine.deleteTable();
    this.tableToolbarVisible.set(false);
    this.tableToolbarPos.set(null);
  }

  protected onCountModeCycle(): void {
    const order: PixelEditorCountMode[] = ['words', 'characters', 'charactersWithSpaces'];
    const current = this.resolvedCountMode();
    const next = order[(order.indexOf(current) + 1) % order.length]!;
    this.countModeOverride.set(next);
  }

  protected async onCopyHtml(): Promise<void> {
    const html = this.engine.getHTML();
    try {
      await navigator.clipboard.writeText(html);
    } catch {
      // Clipboard may be unavailable in tests / insecure contexts.
    }
  }

  protected async onCopyMarkdown(): Promise<void> {
    const md = editorDocToMarkdown(this.liveDoc());
    try {
      await navigator.clipboard.writeText(md);
    } catch {
      // Clipboard may be unavailable in tests / insecure contexts.
    }
  }

  private syncImageToolbar(ed: Editor): void {
    const imagePos = resolveSelectedImagePos(ed);
    if (imagePos == null) {
      this.engine.rememberImageSelection(null);
      this.imageToolbarState.set(null);
      this.imageToolbarPos.set(null);
      return;
    }
    this.engine.rememberImageSelection(imagePos);
    const node = ed.state.doc.nodeAt(imagePos);
    const attrs = (node?.attrs ?? ed.getAttributes('image')) as {
      src?: string;
      alt?: string;
      align?: string;
      displayWidth?: string | null;
      float?: string;
    };
    if (!attrs.src) {
      this.imageToolbarState.set(null);
      this.imageToolbarPos.set(null);
      return;
    }
    const $pos = ed.state.doc.resolve(imagePos);
    let hasCaption = false;
    for (let d = $pos.depth; d > 0; d--) {
      if ($pos.node(d).type.name === 'figure') {
        hasCaption = $pos.node(d).childCount > 1;
        break;
      }
    }
    this.imageToolbarState.set({
      src: attrs.src,
      alt: attrs.alt ?? '',
      align: attrs.align ?? 'start',
      width: attrs.displayWidth ?? null,
      float: attrs.float ?? 'none',
      hasCaption,
    });
    this.updateImageToolbarPosition(ed);
  }

  private updateImageToolbarPosition(ed: Editor): void {
    const wrap = this.surfaceRef()?.nativeElement.closest(
      '.pixel-editor__surface-wrap',
    ) as HTMLElement | null;
    const selected =
      (ed.view.dom.querySelector('.pixel-editor-image--selected') as HTMLElement | null) ??
      (ed.view.dom.querySelector('.pixel-editor-image') as HTMLElement | null);
    if (!wrap || !selected) {
      this.imageToolbarPos.set({ top: 8, left: 8 });
      return;
    }

    // Measure after the toolbar paints so end-aligned images don't clip half the chrome.
    requestAnimationFrame(() => {
      const wrapRect = wrap.getBoundingClientRect();
      const imgRect = selected.getBoundingClientRect();
      const toolbarEl = this.imageToolbarHost()?.nativeElement as HTMLElement | undefined;
      const toolbarWidth = Math.max(toolbarEl?.offsetWidth ?? 0, 200);
      const toolbarHeight = Math.max(toolbarEl?.offsetHeight ?? 0, 44);
      const gap = 10;
      const pad = 8;
      const maxLeft = Math.max(pad, wrap.clientWidth - toolbarWidth - pad);

      let left = imgRect.left - wrapRect.left + wrap.scrollLeft;
      const align = this.imageToolbarState()?.align ?? 'start';
      if (align === 'end') {
        left = imgRect.right - wrapRect.left - toolbarWidth + wrap.scrollLeft;
      } else if (align === 'center') {
        left =
          imgRect.left -
          wrapRect.left +
          (imgRect.width - toolbarWidth) / 2 +
          wrap.scrollLeft;
      }
      left = Math.min(Math.max(pad, left), maxLeft);

      // Prefer above the image; if clipped, place below.
      let top = imgRect.top - wrapRect.top - toolbarHeight - gap + wrap.scrollTop;
      if (top < pad) {
        top = imgRect.bottom - wrapRect.top + gap + wrap.scrollTop;
      }

      this.imageToolbarPos.set({ top, left });
    });
  }

  protected onImageAlign(align: 'start' | 'center' | 'end'): void {
    this.engine.updateImageAttrs({ align });
    this.syncImageToolbarFromEngine();
  }

  protected onImageFloat(float: 'none' | 'start' | 'end'): void {
    this.engine.updateImageAttrs({ float });
    this.syncImageToolbarFromEngine();
  }

  protected onImageWidth(width: string): void {
    this.engine.updateImageAttrs({ displayWidth: width });
    this.syncImageToolbarFromEngine();
  }

  protected onImageCaptionToggle(): void {
    const state = this.imageToolbarState();
    if (state?.hasCaption) {
      this.engine.removeImageCaption();
    } else {
      this.engine.addImageCaption();
    }
    this.syncImageToolbarFromEngine();
  }

  protected async onImageCrop(ratio: '1:1' | '4:3' | '16:9' | 'free'): Promise<void> {
    const state = this.imageToolbarState();
    if (!state?.src) return;
    try {
      const bmp = await createImageBitmap(await (await fetch(state.src)).blob());
      const { width: iw, height: ih } = bmp;
      bmp.close();
      let cw = iw;
      let ch = ih;
      if (ratio === '1:1') {
        cw = ch = Math.min(iw, ih);
      } else if (ratio === '4:3') {
        if (iw / ih > 4 / 3) {
          cw = Math.round((ih * 4) / 3);
        } else {
          ch = Math.round((iw * 3) / 4);
        }
      } else if (ratio === '16:9') {
        if (iw / ih > 16 / 9) {
          cw = Math.round((ih * 16) / 9);
        } else {
          ch = Math.round((iw * 9) / 16);
        }
      }
      const crop = {
        x: Math.max(0, Math.round((iw - cw) / 2)),
        y: Math.max(0, Math.round((ih - ch) / 2)),
        width: cw,
        height: ch,
      };
      const blob = await cropImageToBlob(state.src, crop);
      const file = new File([blob], 'crop.jpg', { type: 'image/jpeg' });
      this.imageRequest.emit({ file, source: 'crop', alt: state.alt });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
      this.engine.updateImageAttrs({ src: dataUrl });
      this.syncImageToolbarFromEngine();
    } catch {
      // Crop can fail for cross-origin URLs without CORS — leave image unchanged.
    }
  }

  protected onImageRemove(): void {
    this.engine.removeImage();
    this.imageToolbarState.set(null);
  }

  private syncImageToolbarFromEngine(): void {
    const ed = this.engine.editor();
    if (ed) this.syncImageToolbar(ed);
  }

  private destroyEditor(): void {
    this.engine.detach();
    this.hostEditor?.destroy();
    this.hostEditor = null;
    this.imageToolbarState.set(null);
    this.imageToolbarPos.set(null);
    this.tableToolbarVisible.set(false);
    this.tableToolbarPos.set(null);
    this.findBarOpen.set(false);
    this.findMatches.set([]);
    // Mount mode leaves the host element in place — clear TipTap/ProseMirror children.
    this.surfaceRef()?.nativeElement.replaceChildren();
  }
}

/** DOM element for the table containing the current selection, or null. */
function resolveActiveTableElement(ed: Editor): HTMLElement | null {
  const { $from } = ed.state.selection;
  for (let depth = $from.depth; depth > 0; depth--) {
    if ($from.node(depth).type.name === 'table') {
      const dom = ed.view.nodeDOM($from.before(depth));
      return dom instanceof HTMLElement ? dom : null;
    }
  }
  return null;
}

/** Doc position of the selected image node, or null when none. */
function resolveSelectedImagePos(ed: Editor): number | null {
  const { selection, doc } = ed.state;
  const nodeSel = selection as { node?: { type: { name: string } }; from: number };
  if (nodeSel.node?.type.name === 'image') {
    return nodeSel.from;
  }
  if (ed.isActive('image') || ed.isActive('figure') || ed.isActive('caption')) {
    const { from, to } = selection;
    let found: number | null = null;
    doc.nodesBetween(Math.max(0, from - 1), Math.min(doc.content.size, to + 1), (node, pos) => {
      if (node.type.name === 'image') {
        found = pos;
        return false;
      }
      if (node.type.name === 'figure' && node.firstChild?.type.name === 'image') {
        found = pos + 1;
        return false;
      }
      return true;
    });
    if (found != null) return found;
    // Walk ancestors when caret is inside a figure caption.
    const $from = selection.$from;
    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.type.name === 'figure' && node.firstChild?.type.name === 'image') {
        return $from.before(depth) + 1;
      }
      if (node.type.name === 'image') {
        return $from.before(depth);
      }
    }
  }
  return null;
}

function countDocument(doc: PixelEditorDoc, mode: PixelEditorCountMode): number {
  const text = collectEditorText(doc);
  switch (mode) {
    case 'characters':
      return text.replace(/\s+/g, '').length;
    case 'charactersWithSpaces':
      return text.length;
    default: {
      const parts = text.trim().split(/\s+/).filter(Boolean);
      return parts.length;
    }
  }
}
