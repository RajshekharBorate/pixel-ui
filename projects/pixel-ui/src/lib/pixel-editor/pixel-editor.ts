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
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import { Mention } from '@tiptap/extension-mention';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { PixelEditorPanel } from './extensions/pixel-editor-panel';
import { PixelEditorDateChip } from './extensions/pixel-editor-date-chip';
import { pixelEditorLowlight } from './extensions/pixel-editor-lowlight';
import { PixelEditorPasteSanitize } from './extensions/pixel-editor-paste-sanitize';
import {
  createMentionSuggestionRender,
  filterMentionItems,
} from './extensions/pixel-editor-mention-suggestion';
import { collectEditorText, isEditorDocEmpty } from './pixel-editor-doc.util';
import PixelEditorStatusBarComponent from './pixel-editor-status-bar';
import PixelEditorToolbarComponent from './pixel-editor-toolbar';
import { PixelEditorEngine } from './pixel-editor.service';
import type { PixelEditorImageRequest } from './pickers/pixel-editor-picker.types';
import type {
  PixelEditorMentionItem,
  PixelEditorMentionQuery,
} from './pickers/pixel-editor-insert-data';
import type {
  PixelEditorBlockKind,
  PixelEditorDoc,
  PixelEditorSaveState,
  PixelEditorSize,
  PixelEditorToolbarConfig,
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
    '[attr.aria-busy]': 'loading() || null',
    '[attr.aria-invalid]': 'showsValidationError() ? "true" : null',
    '[attr.aria-describedby]': 'describedByIds()',
    '[class.pixel-editor--fullscreen]': 'fullscreen()',
    '[class.pixel-editor--invalid]': 'showsValidationError()',
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
   * Shows the footer status bar.
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

  protected readonly wordCount = computed(() => countWords(this.liveDoc()));

  protected readonly resolvedBlockKind = computed(() => {
    const override = this.blockKind();
    if (override) return override;
    return this.engine.activeBlockKind();
  });

  protected readonly interactionLocked = computed(
    () => this.disabled() || this.cvaDisabled || this.readonly() || this.loading(),
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

  protected focusEditor(): void {
    this.engine.focus();
  }

  private resolveFormControl(): AbstractControl | null {
    return this.injector.get(NgControl, null, { optional: true, self: true })?.control ?? null;
  }

  private mountEditor(): void {
    const el = this.surfaceRef()?.nativeElement;
    if (!el || this.hostEditor) return;

    const placeholder = this.placeholder() || 'Write a description…';
    const initial = this.value() ?? this.liveDoc() ?? EMPTY_DOC;

    const editor = new Editor({
      element: el,
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
        Color,
        Highlight.configure({ multicolor: true }),
        Image.configure({ inline: false, allowBase64: true }),
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
      ],
      content: initial as import('@tiptap/core').Content,
      editable: !(this.disabled() || this.cvaDisabled || this.readonly() || this.loading()),
      editorProps: {
        attributes: {
          class: 'pixel-editor__prose',
          role: 'textbox',
          'aria-multiline': 'true',
          'aria-label': this.label() || 'Rich text editor',
        },
      },
      onUpdate: ({ editor: ed }) => {
        this.engine.bump();
        if (this.suppressEmit) return;
        const json = ed.getJSON() as PixelEditorDoc;
        this.liveDoc.set(json);
        this.valueChange.emit(json);
        this.htmlChange.emit(ed.getHTML());
        this.onChange(json);
        this.onValidatorChange();
      },
      onSelectionUpdate: () => {
        this.engine.bump();
      },
      onBlur: () => {
        this.onTouched();
      },
    });

    this.hostEditor = editor;
    this.engine.attach(editor);
    this.liveDoc.set(editor.getJSON() as PixelEditorDoc);
  }

  private destroyEditor(): void {
    this.engine.detach();
    this.hostEditor?.destroy();
    this.hostEditor = null;
  }
}

function countWords(doc: PixelEditorDoc): number {
  const text = collectEditorText(doc);
  const parts = text.trim().split(/\s+/).filter(Boolean);
  return parts.length;
}
