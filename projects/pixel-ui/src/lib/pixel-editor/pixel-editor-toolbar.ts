import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import PixelButtonComponent from '../pixel-button/pixel-button';
import PixelDividerComponent from '../pixel-divider/pixel-divider';
import PixelInputComponent from '../pixel-input/pixel-input';
import PixelMenuComponent from '../pixel-menu/pixel-menu';
import PixelMenuItemComponent from '../pixel-menu/pixel-menu-item';
import PixelMenuTriggerDirective from '../pixel-menu/pixel-menu-trigger';
import PixelPopoverComponent from '../pixel-popover/pixel-popover';
import PixelPopoverTriggerDirective from '../pixel-popover/pixel-popover-trigger';
import PixelFileUploadComponent from '../pixel-file-upload/pixel-file-upload';
import type { PixelFileSelectEvent } from '../pixel-file-upload/pixel-file-upload.types';
import PixelTooltipDirective from '../pixel-tooltip/pixel-tooltip';
import PixelAutocompleteComponent from '../pixel-autocomplete/pixel-autocomplete';
import type { PixelAutocompleteOption } from '../pixel-autocomplete/pixel-autocomplete';
import PixelDatepickerComponent from '../pixel-datepicker/pixel-datepicker';
import {
  PixelEditorEngine,
  type PixelEditorPanelVariant,
  type PixelEditorTextAlign,
  type PixelEditorTextStyle,
} from './pixel-editor.service';
import type { PixelEditorToolbarConfig, PixelEditorToolbarPosition } from './pixel-editor.types';
import {
  PIXEL_EDITOR_HIGHLIGHT_COLORS,
  PIXEL_EDITOR_TEXT_COLORS,
  type PixelEditorImageRequest,
} from './pickers/pixel-editor-picker.types';
import {
  PIXEL_EDITOR_EMOJI,
  PIXEL_EDITOR_SPECIAL_CHARS,
  type PixelEditorMentionItem,
  type PixelEditorMentionQuery,
} from './pickers/pixel-editor-insert-data';
import { PIXEL_EDITOR_CODE_LANGUAGES } from './extensions/pixel-editor-lowlight';
import { filterMentionItems } from './extensions/pixel-editor-mention-suggestion';
import { toLocalIsoDate } from './pixel-editor-date.util';

/** Insert actions deferred to later phases. */
export type PixelEditorInsertAction =
  | 'link'
  | 'image'
  | 'mention'
  | 'emoji'
  | 'table'
  | 'panel'
  | 'date'
  | 'special-char';

/**
 * Formatting toolbar for `pixel-editor` — menus + pickers compose pixel chrome.
 */
@Component({
  selector: 'pixel-editor-toolbar',
  imports: [
    PixelButtonComponent,
    PixelDividerComponent,
    PixelTooltipDirective,
    PixelMenuComponent,
    PixelMenuItemComponent,
    PixelMenuTriggerDirective,
    PixelPopoverComponent,
    PixelPopoverTriggerDirective,
    PixelInputComponent,
    PixelFileUploadComponent,
    PixelAutocompleteComponent,
    PixelDatepickerComponent,
  ],
  templateUrl: './pixel-editor-toolbar.html',
  styleUrl: './pixel-editor-toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-editor-toolbar',
    role: 'toolbar',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.data-position]': 'position()',
    '(keydown)': 'onToolbarKeydown($event)',
  },
})
export default class PixelEditorToolbarComponent {
  private readonly engine = inject(PixelEditorEngine, { optional: true });

  protected readonly colorPopover = viewChild<PixelPopoverComponent>('colorPopover');
  protected readonly linkPopover = viewChild<PixelPopoverComponent>('linkPopover');
  protected readonly imagePopover = viewChild<PixelPopoverComponent>('imagePopover');
  protected readonly mentionPopover = viewChild<PixelPopoverComponent>('mentionPopover');
  protected readonly emojiPopover = viewChild<PixelPopoverComponent>('emojiPopover');
  protected readonly datePopover = viewChild<PixelPopoverComponent>('datePopover');
  protected readonly specialPopover = viewChild<PixelPopoverComponent>('specialPopover');

  protected readonly textColors = PIXEL_EDITOR_TEXT_COLORS;
  protected readonly highlightColors = PIXEL_EDITOR_HIGHLIGHT_COLORS;
  protected readonly emoji = PIXEL_EDITOR_EMOJI;
  protected readonly specialChars = PIXEL_EDITOR_SPECIAL_CHARS;
  protected readonly codeLanguages = PIXEL_EDITOR_CODE_LANGUAGES;
  protected readonly linkHref = signal('');
  protected readonly imageSrc = signal('');
  protected readonly imageAlt = signal('');
  protected readonly mentionValue = signal<unknown>(null);
  protected readonly mentionSearch = signal('');
  protected readonly dateValue = signal<Date | null>(null);

  /**
   * Accessible name for the toolbar landmark.
   *
   * @type {string}
   * @default 'Formatting'
   */
  readonly ariaLabel = input('Formatting');

  /**
   * Group visibility overrides.
   *
   * @type {PixelEditorToolbarConfig}
   * @default {}
   */
  readonly config = input<PixelEditorToolbarConfig>({});

  /**
   * Visual placement relative to the canvas (border side).
   *
   * @type {PixelEditorToolbarPosition}
   * @default 'top'
   */
  readonly position = input<PixelEditorToolbarPosition>('top');

  /**
   * Disables all toolbar controls.
   *
   * @type {boolean}
   * @default false
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Whether fullscreen is active (toggle pressed).
   *
   * @type {boolean}
   * @default false
   */
  readonly fullscreen = input(false, { transform: booleanAttribute });

  /**
   * Emits when the fullscreen control is activated.
   *
   * @type {void}
   */
  readonly fullscreenToggle = output<void>();

  /**
   * Emits when undo is requested.
   *
   * @type {void}
   */
  readonly undo = output<void>();

  /**
   * Emits when redo is requested.
   *
   * @type {void}
   */
  readonly redo = output<void>();

  /**
   * Insert actions that need later-phase UI (mentions, emoji, table, …).
   *
   * @type {PixelEditorInsertAction}
   */
  readonly insertRequest = output<PixelEditorInsertAction>();

  /**
   * People/entities for the mention autocomplete popover.
   *
   * @type {readonly PixelEditorMentionItem[]}
   * @default []
   */
  readonly mentionItems = input<readonly PixelEditorMentionItem[]>([]);

  /**
   * Image upload / URL insert — parent may upload `file` then rewrite `src`.
   *
   * @type {PixelEditorImageRequest}
   */
  readonly imageRequest = output<PixelEditorImageRequest>();

  /**
   * Forwards mention search queries from the autocomplete popover.
   *
   * @type {PixelEditorMentionQuery}
   */
  readonly mentionQuery = output<PixelEditorMentionQuery>();

  protected show(key: keyof PixelEditorToolbarConfig): boolean {
    return this.config()[key] !== false;
  }

  protected markPressed(name: string, attrs?: Record<string, unknown>): boolean {
    this.engine?.version();
    return this.engine?.isActive(name, attrs) ?? false;
  }

  protected textStyleLabel(): string {
    switch (this.engine?.activeTextStyle() ?? 'paragraph') {
      case 'heading1':
        return 'Heading 1';
      case 'heading2':
        return 'Heading 2';
      case 'heading3':
        return 'Heading 3';
      default:
        return 'Normal text';
    }
  }

  protected alignIcon(): string {
    switch (this.engine?.activeTextAlign() ?? 'left') {
      case 'center':
        return 'format_align_center';
      case 'right':
        return 'format_align_right';
      case 'justify':
        return 'format_align_justify';
      default:
        return 'format_align_left';
    }
  }

  protected setTextStyle(style: PixelEditorTextStyle): void {
    this.engine?.setTextStyle(style);
  }

  protected setAlign(align: PixelEditorTextAlign): void {
    this.engine?.setTextAlign(align);
  }

  protected onBold(): void {
    this.engine?.toggleBold();
  }

  protected onItalic(): void {
    this.engine?.toggleItalic();
  }

  protected onUnderline(): void {
    this.engine?.toggleUnderline();
  }

  protected onStrike(): void {
    this.engine?.toggleStrike();
  }

  protected onInlineCode(): void {
    this.engine?.toggleCode();
  }

  protected onClearFormatting(): void {
    this.engine?.clearFormatting();
  }

  protected onBulletList(): void {
    this.engine?.toggleBulletList();
  }

  protected onOrderedList(): void {
    this.engine?.toggleOrderedList();
  }

  protected onTaskList(): void {
    this.engine?.toggleTaskList();
  }

  protected onBlockquote(): void {
    this.engine?.toggleBlockquote();
  }

  protected onCodeBlock(): void {
    this.engine?.toggleCodeBlock();
  }

  protected insertCodeBlock(language: string): void {
    this.engine?.insertCodeBlock(language);
  }

  protected insertTable(): void {
    this.engine?.insertTable(3, 3, true);
  }

  protected onHorizontalRule(): void {
    this.engine?.setHorizontalRule();
  }

  protected onPanel(variant: PixelEditorPanelVariant): void {
    this.engine?.insertPanel(variant);
  }

  protected onColorPopoverOpen(open: boolean): void {
    if (open) this.engine?.version();
  }

  protected applyTextColor(value: string | null): void {
    this.engine?.setColor(value);
    this.colorPopover()?.close();
  }

  protected applyHighlight(value: string | null): void {
    this.engine?.setHighlight(value);
    this.colorPopover()?.close();
  }

  protected onLinkPopoverOpen(open: boolean): void {
    if (open) {
      this.linkHref.set(this.engine?.getLinkHref() ?? '');
    }
  }

  protected applyLink(): void {
    this.engine?.setLink(this.linkHref());
    this.linkPopover()?.close();
  }

  protected removeLink(): void {
    this.engine?.unsetLink();
    this.linkHref.set('');
    this.linkPopover()?.close();
  }

  protected onImagePopoverOpen(open: boolean): void {
    if (open) {
      this.imageSrc.set('');
      this.imageAlt.set('');
    }
  }

  protected applyImageUrl(): void {
    const src = this.imageSrc().trim();
    if (!src) return;
    const alt = this.imageAlt().trim();
    this.engine?.setImage(src, alt);
    this.imageRequest.emit({ src, alt, source: 'url' });
    this.imagePopover()?.close();
  }

  protected onImageFiles(event: PixelFileSelectEvent): void {
    const uploaded = event.accepted[0];
    const file = uploaded?.file;
    if (!file) return;
    const src = URL.createObjectURL(file);
    this.engine?.setImage(src, file.name);
    this.imageRequest.emit({ file, src, alt: file.name, source: 'upload' });
    this.imagePopover()?.close();
  }

  protected mentionOptions(): readonly PixelAutocompleteOption[] {
    return filterMentionItems(this.mentionItems(), this.mentionSearch()).map((item) => ({
      value: item.id,
      label: item.label,
      subtitle: item.subtitle,
    }));
  }

  protected onMentionSearch(query: string): void {
    this.mentionSearch.set(query);
    this.mentionQuery.emit({ query });
  }

  protected onMentionSelect(value: unknown): void {
    const id = String(value ?? '');
    const item = this.mentionItems().find((m) => m.id === id);
    if (!item) return;
    this.engine?.insertMention(item.id, item.label);
    this.mentionValue.set(null);
    this.mentionSearch.set('');
    this.mentionPopover()?.close();
  }

  protected insertEmoji(glyph: string): void {
    this.engine?.insertText(glyph);
    this.emojiPopover()?.close();
  }

  protected insertSpecialChar(glyph: string): void {
    this.engine?.insertText(glyph);
    this.specialPopover()?.close();
  }

  protected onDatePicked(date: Date | null): void {
    if (!date) return;
    this.engine?.insertDateChip(toLocalIsoDate(date));
    this.dateValue.set(null);
    this.datePopover()?.close();
  }

  protected onUndo(): void {
    this.engine?.undo();
    this.undo.emit();
  }

  protected onRedo(): void {
    this.engine?.redo();
    this.redo.emit();
  }

  /** Arrow-key roving focus across toolbar buttons. */
  protected onToolbarKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const root = event.currentTarget as HTMLElement;
    const buttons = Array.from(
      root.querySelectorAll<HTMLElement>('button:not([disabled]), [role="button"]:not([aria-disabled="true"])'),
    ).filter((el) => el.offsetParent !== null);
    if (buttons.length === 0) return;
    const active = document.activeElement as HTMLElement | null;
    const index = active ? buttons.indexOf(active) : -1;
    if (index < 0) return;
    event.preventDefault();
    const next =
      event.key === 'ArrowRight'
        ? buttons[(index + 1) % buttons.length]
        : buttons[(index - 1 + buttons.length) % buttons.length];
    next.focus();
  }
}
