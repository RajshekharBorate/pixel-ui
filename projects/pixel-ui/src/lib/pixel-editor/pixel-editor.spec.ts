import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import PixelEditorComponent from './pixel-editor';
import PixelEditorToolbarComponent from './pixel-editor-toolbar';
import type { PixelEditorDoc } from './pixel-editor.types';
import { sanitizePastedHtml } from './extensions/pixel-editor-paste-sanitize';
import {
  filterSlashCommandItems,
  PIXEL_EDITOR_SLASH_COMMANDS,
} from './extensions/pixel-editor-slash-suggestion';
import { collectFindMatches } from './extensions/pixel-editor-find';
import { editorDocToMarkdown } from './pixel-editor-markdown.util';
import { toLocalIsoDate } from './pixel-editor-date.util';
import { PIXEL_EDITOR_EMOJI } from './pickers/pixel-editor-insert-data';
import {
  PIXEL_EDITOR_HIGHLIGHT_COLORS,
  PIXEL_EDITOR_TEXT_COLORS,
} from './pickers/pixel-editor-picker.types';

const SAMPLE_DOC: PixelEditorDoc = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Hello world from pixel' }],
    },
  ],
};

@Component({
  imports: [PixelEditorComponent, ReactiveFormsModule],
  template: `
    <pixel-editor
      [label]="label()"
      [placeholder]="placeholder()"
      [value]="value()"
      [disabled]="disabled()"
      [showToolbar]="showToolbar()"
      [showStatusBar]="showStatusBar()"
      [toolbarPosition]="toolbarPosition()"
      [showSkeleton]="showSkeleton()"
      [loading]="loading()"
      [required]="required()"
      [saveState]="saveState()"
      [savedAtLabel]="savedAtLabel()"
      [(fullscreen)]="fullscreen"
      (valueChange)="onValueChange($event)"
    />
    <pixel-editor [formControl]="control" label="Form-bound" />
    <pixel-editor
      [formControl]="requiredControl"
      label="Required form"
      required
      [validationMessages]="{ required: 'Required description.' }"
    />
  `,
})
class HostComponent {
  readonly label = signal('Description');
  readonly placeholder = signal('Write…');
  readonly value = signal<PixelEditorDoc | null>(SAMPLE_DOC);
  readonly disabled = signal(false);
  readonly showToolbar = signal(true);
  readonly showStatusBar = signal(true);
  readonly toolbarPosition = signal<'top' | 'bottom'>('top');
  readonly saveState = signal<'idle' | 'saving' | 'saved' | 'error'>('saved');
  readonly savedAtLabel = signal('Just now');
  readonly fullscreen = signal(false);
  readonly showSkeleton = signal(false);
  readonly loading = signal(false);
  readonly required = signal(false);
  readonly lastValue = signal<PixelEditorDoc | null>(null);
  readonly control = new FormControl<PixelEditorDoc | null>(SAMPLE_DOC);
  readonly requiredControl = new FormControl<PixelEditorDoc | null>({
    type: 'doc',
    content: [{ type: 'paragraph' }],
  });

  onValueChange(doc: PixelEditorDoc): void {
    this.lastValue.set(doc);
  }
}

describe('PixelEditorComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    // TipTap / ProseMirror focus helpers need Range geometry in jsdom.
    if (!(Range.prototype as unknown as { getClientRects?: () => DOMRectList }).getClientRects) {
      Range.prototype.getBoundingClientRect = () =>
        ({
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          toJSON: () => ({}),
        }) as DOMRect;
      Range.prototype.getClientRects = () => ({
        length: 0,
        item: () => null,
        [Symbol.iterator]: function* () {},
      }) as DOMRectList;
    }

    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders label, toolbar, ProseMirror surface, and status bar', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.pixel-editor__label')?.textContent?.trim()).toBe('Description');
    expect(el.querySelector('pixel-editor-toolbar')).toBeTruthy();
    expect(el.querySelector('.ProseMirror')).toBeTruthy();
    expect(el.querySelector('pixel-editor-status-bar')).toBeTruthy();
  });

  it('exposes textbox semantics on the ProseMirror surface', () => {
    const prose = fixture.nativeElement.querySelector('.ProseMirror') as HTMLElement;
    expect(prose.getAttribute('role')).toBe('textbox');
    expect(prose.getAttribute('aria-multiline')).toBe('true');
  });

  it('shows word count derived from JSON value', () => {
    const status = fixture.nativeElement.querySelectorAll('pixel-editor-status-bar')[0] as HTMLElement;
    expect(status.textContent).toContain('4 words');
  });

  it('shows Pixel Document Format hint (not ADF)', () => {
    const status = fixture.nativeElement.querySelector('pixel-editor-status-bar') as HTMLElement;
    expect(status.textContent).toContain('Pixel Document Format');
    expect(status.textContent).not.toContain('Atlassian');
  });

  it('hides chrome when flags are false', () => {
    host.showToolbar.set(false);
    host.showStatusBar.set(false);
    fixture.detectChanges();
    const editors = fixture.nativeElement.querySelectorAll('pixel-editor');
    const first = editors[0] as HTMLElement;
    expect(first.querySelector('pixel-editor-toolbar')).toBeNull();
    expect(first.querySelector('pixel-editor-status-bar')).toBeNull();
  });

  it('places toolbar below the canvas and hides the status bar when toolbarPosition is bottom', () => {
    host.toolbarPosition.set('bottom');
    host.showStatusBar.set(true);
    fixture.detectChanges();
    const first = fixture.nativeElement.querySelectorAll('pixel-editor')[0] as HTMLElement;
    expect(first.getAttribute('data-toolbar-position')).toBe('bottom');
    const frame = first.querySelector('.pixel-editor__frame') as HTMLElement;
    const children = Array.from(frame.children).map((node) => node.tagName.toLowerCase());
    expect(children.indexOf('pixel-editor-toolbar')).toBeGreaterThan(
      children.indexOf('div'), // surface wrap
    );
    expect(first.querySelector('pixel-editor-toolbar')?.getAttribute('data-position')).toBe('bottom');
    expect(first.querySelector('pixel-editor-status-bar')).toBeNull();
  });

  it('toggles fullscreen via the toolbar control', () => {
    const first = fixture.nativeElement.querySelectorAll('pixel-editor')[0] as HTMLElement;
    const fullscreenBtn = first.querySelector(
      'pixel-editor-toolbar button[aria-label="Enter fullscreen"]',
    ) as HTMLButtonElement | null;
    expect(fullscreenBtn).toBeTruthy();
    fullscreenBtn?.click();
    fixture.detectChanges();
    expect(host.fullscreen()).toBe(true);
    expect(first.classList.contains('pixel-editor--fullscreen')).toBe(true);
  });

  it('toggles bold via the toolbar and emits valueChange', async () => {
    const first = fixture.nativeElement.querySelectorAll('pixel-editor')[0] as HTMLElement;
    const prose = first.querySelector('.ProseMirror') as HTMLElement;
    prose.focus();
    const boldBtn = first.querySelector(
      'pixel-editor-toolbar button[aria-label="Bold"]',
    ) as HTMLButtonElement;
    boldBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.lastValue()).toBeTruthy();
  });

  it('supports ControlValueAccessor writeValue', async () => {
    const next: PixelEditorDoc = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Form value' }] }],
    };
    host.control.setValue(next);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const editors = fixture.nativeElement.querySelectorAll('pixel-editor');
    const formEditor = editors[1] as HTMLElement;
    expect(formEditor.querySelector('.ProseMirror')?.textContent).toContain('Form value');
  });

  it('applies invalid chrome when a required CVA control is touched', async () => {
    expect(host.requiredControl.invalid).toBe(true);
    host.requiredControl.markAsTouched();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const editors = fixture.nativeElement.querySelectorAll('pixel-editor');
    const requiredEditor = editors[2] as HTMLElement;
    expect(requiredEditor.classList.contains('ng-invalid')).toBe(true);
    expect(requiredEditor.classList.contains('pixel-editor--invalid')).toBe(true);
    expect(requiredEditor.getAttribute('aria-invalid')).toBe('true');
    expect(requiredEditor.querySelector('.pixel-editor__frame')?.getAttribute('data-state')).toBe(
      'error',
    );
    expect(requiredEditor.querySelector('.pixel-editor__error')?.textContent?.trim()).toBe(
      'Required description.',
    );

    host.requiredControl.setValue({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Filled in' }] }],
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.requiredControl.valid).toBe(true);
    expect(requiredEditor.classList.contains('pixel-editor--invalid')).toBe(false);
    expect(requiredEditor.querySelector('.pixel-editor__error')).toBeNull();
  });

  it('disables the surface when disabled is set', async () => {
    host.disabled.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const first = fixture.nativeElement.querySelectorAll('pixel-editor')[0] as HTMLElement;
    const prose = first.querySelector('.ProseMirror') as HTMLElement;
    expect(prose.getAttribute('contenteditable')).toBe('false');
  });

  it('applies Heading 1 via text style command', async () => {
    const editors = fixture.debugElement.queryAll(
      (de) => de.name === 'pixel-editor' || de.nativeElement?.tagName === 'PIXEL-EDITOR',
    );
    const firstDe = editors[0];
    const first = firstDe.nativeElement as HTMLElement;
    const prose = first.querySelector('.ProseMirror') as HTMLElement;
    prose.focus();
    const toolbar = firstDe.query((de) => de.name === 'pixel-editor-toolbar')!
      .componentInstance as PixelEditorToolbarComponent;
    toolbar['setTextStyle']('heading1');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(prose.querySelector('h1')).toBeTruthy();
    expect(
      (
        first.querySelector(
          'pixel-editor-toolbar button[aria-label^="Text style"]',
        ) as HTMLElement
      ).getAttribute('aria-label'),
    ).toContain('Heading 1');
  });

  it('opens the text style menu with heading options', async () => {
    const first = fixture.nativeElement.querySelectorAll('pixel-editor')[0] as HTMLElement;
    const styleBtn = first.querySelector(
      'pixel-editor-toolbar button[aria-label^="Text style"]',
    ) as HTMLButtonElement;
    styleBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const labels = Array.from(document.body.querySelectorAll('pixel-menu-item'))
      .map((el) => el.textContent?.replace(/\s+/g, ' ').trim() ?? '')
      .join(' | ');
    expect(labels).toContain('Normal text');
    expect(labels).toContain('Heading 1');
    expect(labels).toContain('Heading 2');
    expect(labels).toContain('Heading 3');
  });

  it('toggles task list from the toolbar', async () => {
    const first = fixture.nativeElement.querySelectorAll('pixel-editor')[0] as HTMLElement;
    const prose = first.querySelector('.ProseMirror') as HTMLElement;
    prose.focus();
    (first.querySelector('button[aria-label="Task list"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(prose.querySelector('ul[data-type="taskList"]')).toBeTruthy();
  });

  it('inserts a horizontal rule from the Insert menu', async () => {
    const first = fixture.nativeElement.querySelectorAll('pixel-editor')[0] as HTMLElement;
    const insertBtn = first.querySelector(
      'pixel-editor-toolbar button[aria-label="Insert block"]',
    ) as HTMLButtonElement;
    insertBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const hrItem = Array.from(document.body.querySelectorAll('pixel-menu-item')).find((el) =>
      el.textContent?.includes('Horizontal rule'),
    ) as HTMLElement | undefined;
    expect(hrItem).toBeTruthy();
    hrItem?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    const prose = first.querySelector('.ProseMirror') as HTMLElement;
    expect(prose.querySelector('hr')).toBeTruthy();
  });

  it('sets text align center from the alignment menu', async () => {
    const first = fixture.nativeElement.querySelectorAll('pixel-editor')[0] as HTMLElement;
    const alignBtn = first.querySelector(
      'pixel-editor-toolbar button[aria-label="Alignment"]',
    ) as HTMLButtonElement;
    alignBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const centerItem = Array.from(document.body.querySelectorAll('pixel-menu-item')).find((el) =>
      el.textContent?.includes('Align center'),
    ) as HTMLElement | undefined;
    expect(centerItem).toBeTruthy();
    centerItem?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    const prose = first.querySelector('.ProseMirror') as HTMLElement;
    const aligned = prose.querySelector('[style*="text-align: center"], p[style*="text-align: center"]');
    expect(aligned || prose.innerHTML.includes('text-align: center')).toBeTruthy();
  });

  it('inserts an info panel and round-trips variant in JSON', async () => {
    const editors = fixture.debugElement.queryAll(
      (de) => de.nativeElement?.tagName === 'PIXEL-EDITOR',
    );
    const firstDe = editors[0];
    const first = firstDe.nativeElement as HTMLElement;
    const prose = first.querySelector('.ProseMirror') as HTMLElement;
    prose.focus();
    const toolbar = firstDe.query((de) => de.name === 'pixel-editor-toolbar')!
      .componentInstance as PixelEditorToolbarComponent;
    toolbar['onPanel']('info');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(prose.querySelector('.pixel-editor-panel--info')).toBeTruthy();
    expect(prose.querySelector('.pixel-editor-panel__icon')?.textContent?.trim()).toBe('info');
    const json = host.lastValue() ?? host.value();
    const panel = findNode(json, 'panel');
    expect(panel?.['attrs']).toEqual(expect.objectContaining({ variant: 'info' }));
  });

  it('keeps task item text beside the checkbox (no list bullet)', async () => {
    const editors = fixture.debugElement.queryAll(
      (de) => de.nativeElement?.tagName === 'PIXEL-EDITOR',
    );
    const firstDe = editors[0];
    const first = firstDe.nativeElement as HTMLElement;
    const editorCmp = firstDe.componentInstance as PixelEditorComponent;
    editorCmp['engine'].toggleTaskList();
    editorCmp['engine'].insertText('Task beside checkbox');
    fixture.detectChanges();
    await fixture.whenStable();
    const list = first.querySelector('.ProseMirror ul[data-type="taskList"]') as HTMLElement;
    const li = list?.querySelector('li') as HTMLElement;
    expect(list).toBeTruthy();
    expect(li).toBeTruthy();
    expect(li.querySelector('input[type="checkbox"]')).toBeTruthy();
    expect(li.querySelector('div')).toBeTruthy();
    expect(li.textContent).toContain('Task beside checkbox');
    // TipTap task items are label+div siblings (inline chrome is CSS in the browser).
    expect(li.children[0]?.tagName.toLowerCase()).toBe('label');
    expect(li.children[1]?.tagName.toLowerCase()).toBe('div');
  });

  it('persists task item checked state in the JSON value', async () => {
    host.value.set({
      type: 'doc',
      content: [
        {
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ship it' }] }],
            },
          ],
        },
      ],
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const first = fixture.nativeElement.querySelectorAll('pixel-editor')[0] as HTMLElement;
    const checkbox = first.querySelector(
      '.ProseMirror ul[data-type="taskList"] input[type="checkbox"]',
    ) as HTMLInputElement | null;
    expect(checkbox).toBeTruthy();
    expect(checkbox?.checked).toBe(false);
    checkbox!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const json = host.lastValue();
    const task = findNode(json, 'taskItem');
    expect(task?.['attrs']).toEqual(expect.objectContaining({ checked: true }));
  });
  it('applies text color via the engine and round-trips in JSON', async () => {
    const editors = fixture.debugElement.queryAll(
      (de) => de.nativeElement?.tagName === 'PIXEL-EDITOR',
    );
    const firstDe = editors[0];
    const editorCmp = firstDe.componentInstance as PixelEditorComponent;
    editorCmp['engine'].editor()?.chain().focus().selectAll().setColor('#2962ff').run();
    fixture.detectChanges();
    await fixture.whenStable();
    const json = host.lastValue() ?? host.value();
    const colored = findMark(json, 'textStyle');
    expect(colored?.['attrs']).toEqual(expect.objectContaining({ color: '#2962ff' }));
  });

  it('sets and removes a link mark', async () => {
    const editors = fixture.debugElement.queryAll(
      (de) => de.nativeElement?.tagName === 'PIXEL-EDITOR',
    );
    const firstDe = editors[0];
    const editorCmp = firstDe.componentInstance as PixelEditorComponent;
    const engine = editorCmp['engine'];
    engine.editor()?.chain().focus().selectAll().setLink({ href: 'https://example.com' }).run();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(findMark(host.lastValue() ?? host.value(), 'link')?.['attrs']).toEqual(
      expect.objectContaining({ href: 'https://example.com' }),
    );
    engine.unsetLink();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(findMark(host.lastValue() ?? host.value(), 'link')).toBeNull();
  });

  it('inserts an image node from a URL', async () => {
    const editors = fixture.debugElement.queryAll(
      (de) => de.nativeElement?.tagName === 'PIXEL-EDITOR',
    );
    const firstDe = editors[0];
    const first = firstDe.nativeElement as HTMLElement;
    const editorCmp = firstDe.componentInstance as PixelEditorComponent;
    editorCmp['engine'].setImage('https://example.com/pixel.png', 'Pixel');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(first.querySelector('.ProseMirror img')?.getAttribute('src')).toBe(
      'https://example.com/pixel.png',
    );
    expect(findNode(host.lastValue(), 'image')?.['attrs']).toEqual(
      expect.objectContaining({ src: 'https://example.com/pixel.png', alt: 'Pixel' }),
    );
  });

  it('inserts a mention node that round-trips in JSON', async () => {
    const editors = fixture.debugElement.queryAll(
      (de) => de.nativeElement?.tagName === 'PIXEL-EDITOR',
    );
    const firstDe = editors[0];
    const first = firstDe.nativeElement as HTMLElement;
    const editorCmp = firstDe.componentInstance as PixelEditorComponent;
    editorCmp['engine'].insertMention('u1', 'Ada Lovelace');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(first.querySelector('.pixel-editor-mention')?.textContent).toContain('Ada Lovelace');
    expect(findNode(host.lastValue(), 'mention')?.['attrs']).toEqual(
      expect.objectContaining({ id: 'u1', label: 'Ada Lovelace' }),
    );
  });

  it('registers the slash-command extension and filters / applies Heading 1', async () => {
    expect(filterSlashCommandItems('head').map((i) => i.id)).toEqual(
      expect.arrayContaining(['heading1', 'heading2', 'heading3']),
    );
    expect(filterSlashCommandItems('todo').map((i) => i.id)).toEqual(['taskList']);
    expect(PIXEL_EDITOR_SLASH_COMMANDS.some((i) => i.id === 'table')).toBe(true);

    const editors = fixture.debugElement.queryAll(
      (de) => de.nativeElement?.tagName === 'PIXEL-EDITOR',
    );
    const firstDe = editors[0];
    const first = firstDe.nativeElement as HTMLElement;
    const editorCmp = firstDe.componentInstance as PixelEditorComponent;
    const editor = editorCmp['engine'].editor();
    expect(editor).toBeTruthy();
    expect(editor!.extensionManager.extensions.some((ext) => ext.name === 'pixelEditorSlashCommands')).toBe(
      true,
    );

    const prose = first.querySelector('.ProseMirror') as HTMLElement;
    prose.focus();
    // Simulate selecting the Heading 1 slash item after typing `/` (deleteRange + run).
    const heading = filterSlashCommandItems('heading 1')[0];
    expect(heading?.id).toBe('heading1');
    heading!.run(editor!);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(prose.querySelector('h1')).toBeTruthy();
  });

  it('inserts a date chip that round-trips in JSON', async () => {
    const editors = fixture.debugElement.queryAll(
      (de) => de.nativeElement?.tagName === 'PIXEL-EDITOR',
    );
    const firstDe = editors[0];
    const first = firstDe.nativeElement as HTMLElement;
    const editorCmp = firstDe.componentInstance as PixelEditorComponent;
    editorCmp['engine'].insertDateChip('2026-07-24');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(first.querySelector('.pixel-editor-date-chip')).toBeTruthy();
    expect(findNode(host.lastValue(), 'dateChip')?.['attrs']).toEqual(
      expect.objectContaining({ value: '2026-07-24' }),
    );
  });

  it('formats date chips from local calendar days (not UTC ISO)', () => {
    // 8 Jul 00:30 local — in IST this is still 7 Jul in UTC (`toISOString`).
    const localMorning = new Date(2026, 6, 8, 0, 30, 0);
    expect(toLocalIsoDate(localMorning)).toBe('2026-07-08');
    expect(toLocalIsoDate(new Date(2026, 6, 8, 23, 45, 0))).toBe('2026-07-08');
  });

  it('exposes expanded curated color and emoji palettes', () => {
    expect(PIXEL_EDITOR_TEXT_COLORS.length).toBeGreaterThanOrEqual(12);
    expect(PIXEL_EDITOR_HIGHLIGHT_COLORS.length).toBeGreaterThanOrEqual(10);
    expect(PIXEL_EDITOR_EMOJI.length).toBeGreaterThanOrEqual(60);
    expect(PIXEL_EDITOR_TEXT_COLORS.some((c) => c.label === 'Teal')).toBe(true);
    expect(PIXEL_EDITOR_HIGHLIGHT_COLORS.some((c) => c.label === 'Gray')).toBe(true);
    expect(PIXEL_EDITOR_EMOJI.some((e) => e.glyph === '🚀')).toBe(true);
  });

  it('keeps Insert menu to block inserts (no emoji/date/special duplicates)', () => {
    const first = fixture.nativeElement.querySelectorAll('pixel-editor')[0] as HTMLElement;
    const insertBtn = first.querySelector(
      'pixel-editor-toolbar button[aria-label="Insert block"]',
    ) as HTMLButtonElement;
    insertBtn.click();
    fixture.detectChanges();
    const labels = Array.from(
      document.querySelectorAll('.pixel-menu-item, pixel-menu-item, [role="menuitem"]'),
    ).map((el) => (el.textContent ?? '').trim());
    const joined = labels.join(' | ');
    expect(joined).toMatch(/Code block|Table|Panel|Horizontal rule/i);
    expect(joined).not.toMatch(/Date \(today\)|Emoticon|Special characters/i);
  });

  it('applies image displayWidth / align attrs and shows the image toolbar', async () => {
    const editors = fixture.debugElement.queryAll(
      (de) => de.nativeElement?.tagName === 'PIXEL-EDITOR',
    );
    const firstDe = editors[0];
    const first = firstDe.nativeElement as HTMLElement;
    const editorCmp = firstDe.componentInstance as PixelEditorComponent;
    editorCmp['engine'].setImage('https://example.com/pic.png', 'Demo', {
      align: 'center',
      displayWidth: '50%',
    });
    fixture.detectChanges();
    await fixture.whenStable();
    const wrap = first.querySelector('.pixel-editor-image') as HTMLElement;
    expect(wrap).toBeTruthy();
    expect(wrap.getAttribute('data-align')).toBe('center');
    expect(findNode(host.lastValue(), 'image')?.['attrs']).toEqual(
      expect.objectContaining({
        src: 'https://example.com/pic.png',
        align: 'center',
        displayWidth: '50%',
      }),
    );
    const ed = editorCmp['engine'].editor();
    let imagePos = -1;
    ed?.state.doc.descendants((node, pos) => {
      if (node.type.name === 'image') {
        imagePos = pos;
        return false;
      }
      return true;
    });
    expect(imagePos).toBeGreaterThanOrEqual(0);
    ed?.chain().setNodeSelection(imagePos).run();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(first.querySelector('pixel-editor-image-toolbar')).toBeTruthy();
  });

  it('wraps a selected image with a figure caption', async () => {
    const editors = fixture.debugElement.queryAll(
      (de) => de.nativeElement?.tagName === 'PIXEL-EDITOR',
    );
    const firstDe = editors[0];
    const first = firstDe.nativeElement as HTMLElement;
    const editorCmp = firstDe.componentInstance as PixelEditorComponent;
    editorCmp['engine'].setImage('https://example.com/cap.png', 'Cap');
    fixture.detectChanges();
    await fixture.whenStable();
    const ed = editorCmp['engine'].editor();
    let imagePos = -1;
    ed?.state.doc.descendants((node, pos) => {
      if (node.type.name === 'image') {
        imagePos = pos;
        return false;
      }
      return true;
    });
    ed?.chain().setNodeSelection(imagePos).run();
    editorCmp['engine'].rememberImageSelection(imagePos);
    expect(editorCmp['engine'].addImageCaption()).toBe(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(findNode(host.lastValue(), 'figure')).toBeTruthy();
    expect(first.querySelector('.pixel-editor-figure__caption')).toBeTruthy();
  });

  it('toggles a block quote around the selection', async () => {
    const editors = fixture.debugElement.queryAll(
      (de) => de.nativeElement?.tagName === 'PIXEL-EDITOR',
    );
    const firstDe = editors[0];
    const first = firstDe.nativeElement as HTMLElement;
    const editorCmp = firstDe.componentInstance as PixelEditorComponent;
    const prose = first.querySelector('.ProseMirror') as HTMLElement;
    prose.focus();
    expect(editorCmp['engine'].toggleBlockquote()).toBe(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(prose.querySelector('blockquote')).toBeTruthy();
    expect(findNode(host.lastValue(), 'blockquote')).toBeTruthy();
    expect(editorCmp['engine'].toggleBlockquote()).toBe(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(prose.querySelector('blockquote')).toBeNull();
  });

  it('inserts emoji and special characters as text', async () => {
    const editors = fixture.debugElement.queryAll(
      (de) => de.nativeElement?.tagName === 'PIXEL-EDITOR',
    );
    const firstDe = editors[0];
    const editorCmp = firstDe.componentInstance as PixelEditorComponent;
    editorCmp['engine'].insertText('👍');
    editorCmp['engine'].insertText('—');
    fixture.detectChanges();
    await fixture.whenStable();
    const prose = firstDe.nativeElement.querySelector('.ProseMirror') as HTMLElement;
    expect(prose.textContent).toContain('👍');
    expect(prose.textContent).toContain('—');
  });

  it('inserts a 3×3 table with a header row', async () => {
    const editors = fixture.debugElement.queryAll(
      (de) => de.nativeElement?.tagName === 'PIXEL-EDITOR',
    );
    const firstDe = editors[0];
    const first = firstDe.nativeElement as HTMLElement;
    const editorCmp = firstDe.componentInstance as PixelEditorComponent;
    editorCmp['engine'].insertTable(3, 3, true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(first.querySelectorAll('.ProseMirror table th').length).toBe(3);
    expect(first.querySelectorAll('.ProseMirror table td').length).toBe(6);
    expect(findNode(host.lastValue(), 'table')).toBeTruthy();
  });

  it('inserts a syntax-highlighted code block with a language', async () => {
    const editors = fixture.debugElement.queryAll(
      (de) => de.nativeElement?.tagName === 'PIXEL-EDITOR',
    );
    const firstDe = editors[0];
    const first = firstDe.nativeElement as HTMLElement;
    const editorCmp = firstDe.componentInstance as PixelEditorComponent;
    editorCmp['engine'].insertCodeBlock('javascript');
    editorCmp['engine'].insertText('const x = 1;');
    fixture.detectChanges();
    await fixture.whenStable();
    const pre = first.querySelector('.ProseMirror pre');
    expect(pre).toBeTruthy();
    expect(findNode(host.lastValue(), 'codeBlock')?.['attrs']).toEqual(
      expect.objectContaining({ language: 'javascript' }),
    );
    expect(first.querySelector('.ProseMirror pre .hljs-keyword, .ProseMirror pre code')).toBeTruthy();
  });

  it('exits fullscreen on Escape', async () => {
    const editors = fixture.debugElement.queryAll(
      (de) => de.nativeElement?.tagName === 'PIXEL-EDITOR',
    );
    const first = editors[0].nativeElement as HTMLElement;
    host.fullscreen.set(true);
    fixture.detectChanges();
    expect(first.classList.contains('pixel-editor--fullscreen')).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.fullscreen()).toBe(false);
    expect(first.classList.contains('pixel-editor--fullscreen')).toBe(false);
  });

  it('updates the status-bar block breadcrumb from selection', async () => {
    const editors = fixture.debugElement.queryAll(
      (de) => de.nativeElement?.tagName === 'PIXEL-EDITOR',
    );
    const firstDe = editors[0];
    const first = firstDe.nativeElement as HTMLElement;
    const editorCmp = firstDe.componentInstance as PixelEditorComponent;
    editorCmp['engine'].insertCodeBlock('typescript');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const chip = first.querySelector('.pixel-editor-status-bar__block');
    expect(chip?.textContent?.trim()).toBe('</>');
  });

  it('renders a skeleton instead of the frame when showSkeleton is set', async () => {
    host.showSkeleton.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const first = fixture.nativeElement.querySelectorAll('pixel-editor')[0] as HTMLElement;
    expect(first.querySelector('pixel-skeleton')).toBeTruthy();
    expect(first.querySelector('.pixel-editor__frame')).toBeNull();
  });

  it('shows a loading overlay when loading is set', async () => {
    host.loading.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const first = fixture.nativeElement.querySelectorAll('pixel-editor')[0] as HTMLElement;
    expect(first.getAttribute('aria-busy')).toBe('true');
    expect(first.querySelector('.pixel-editor__loading')).toBeTruthy();
  });

  it('treats empty documents as invalid when required', () => {
    const editors = fixture.debugElement.queryAll(
      (de) => de.nativeElement?.tagName === 'PIXEL-EDITOR',
    );
    const editorCmp = editors[0].componentInstance as PixelEditorComponent;
    host.required.set(true);
    fixture.detectChanges();
    const empty = { type: 'doc', content: [{ type: 'paragraph' }] } as PixelEditorDoc;
    expect(editorCmp.validate({ value: empty } as never)).toEqual({ required: true });
    expect(
      editorCmp.validate({
        value: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hi' }] }],
        },
      } as never),
    ).toBeNull();
  });

  it('opens find popover via Ctrl+F and highlights matches', async () => {
    const editors = fixture.debugElement.queryAll(
      (de) => de.nativeElement?.tagName === 'PIXEL-EDITOR',
    );
    const firstDe = editors[0];
    const first = firstDe.nativeElement as HTMLElement;
    const editorCmp = firstDe.componentInstance as PixelEditorComponent;
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(editorCmp['findBarOpen']()).toBe(true);
    expect(first.querySelector('pixel-editor-toolbar')).toBeTruthy();
    editorCmp['onFindQueryChange']('Hello');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(editorCmp['findMatches']().length).toBeGreaterThan(0);
    // Typing must not force editor focus (find popover keeps the caret).
    expect(editorCmp['engine'].editor()?.isFocused).toBeFalsy();
  });

  it('shows floating table toolbar when selection is in a table', async () => {
    const editors = fixture.debugElement.queryAll(
      (de) => de.nativeElement?.tagName === 'PIXEL-EDITOR',
    );
    const firstDe = editors[0];
    const first = firstDe.nativeElement as HTMLElement;
    const editorCmp = firstDe.componentInstance as PixelEditorComponent;
    editorCmp['engine'].insertTable(2, 2, true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const toolbar = first.querySelector('pixel-editor-table-toolbar');
    expect(toolbar).toBeTruthy();
    expect(toolbar?.classList.contains('pixel-editor__table-float')).toBe(true);
    expect(first.querySelector('.pixel-editor__surface-wrap pixel-editor-table-toolbar')).toBeTruthy();
    editorCmp['onTableAddRow']();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(first.querySelectorAll('.ProseMirror tr').length).toBeGreaterThanOrEqual(3);
  });

  it('injects dashed guide borders for table cells', async () => {
    const editors = fixture.debugElement.queryAll(
      (de) => de.nativeElement?.tagName === 'PIXEL-EDITOR',
    );
    const firstDe = editors[0];
    const editorCmp = firstDe.componentInstance as PixelEditorComponent;
    editorCmp['engine'].insertTable(2, 2, true);
    fixture.detectChanges();
    await fixture.whenStable();
    const style = document.getElementById('pixel-editor-content-styles');
    expect(style?.textContent).toContain('border: 1px dashed');
    expect(style?.textContent).toMatch(/\.pixel-editor-table|table/);
  });

  it('applies font size that persists in JSON', async () => {
    const editors = fixture.debugElement.queryAll(
      (de) => de.nativeElement?.tagName === 'PIXEL-EDITOR',
    );
    const firstDe = editors[0];
    const editorCmp = firstDe.componentInstance as PixelEditorComponent;
    const ed = editorCmp['engine'].editor();
    ed?.chain().focus().selectAll().setFontSize('1.25rem').run();
    fixture.detectChanges();
    await fixture.whenStable();
    const mark = findMark(host.lastValue(), 'textStyle');
    expect(mark?.['attrs']).toEqual(expect.objectContaining({ fontSize: '1.25rem' }));
  });

  it('clears formatting via the engine clearFormatting command', async () => {
    const editors = fixture.debugElement.queryAll(
      (de) => de.nativeElement?.tagName === 'PIXEL-EDITOR',
    );
    const firstDe = editors[0];
    const editorCmp = firstDe.componentInstance as PixelEditorComponent;
    editorCmp['engine'].editor()?.chain().focus().selectAll().toggleBold().run();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(findMark(host.lastValue(), 'bold')).toBeTruthy();
    expect(editorCmp['engine'].clearFormatting()).toBe(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(findMark(host.lastValue(), 'bold')).toBeNull();
  });

  it('serializes documents to Markdown and cycles count mode', async () => {
    const md = editorDocToMarkdown({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Title' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Hello world' }] },
      ],
    });
    expect(md).toContain('## Title');
    expect(md).toContain('Hello world');

    const editors = fixture.debugElement.queryAll(
      (de) => de.nativeElement?.tagName === 'PIXEL-EDITOR',
    );
    const first = editors[0].nativeElement as HTMLElement;
    const countBtn = first.querySelector('.pixel-editor-status-bar__count') as HTMLButtonElement;
    expect(countBtn.textContent).toContain('words');
    countBtn.click();
    fixture.detectChanges();
    expect(countBtn.textContent).toContain('characters');
  });

  it('collects find matches across text nodes', () => {
    const editors = fixture.debugElement.queryAll(
      (de) => de.nativeElement?.tagName === 'PIXEL-EDITOR',
    );
    const editorCmp = editors[0].componentInstance as PixelEditorComponent;
    const ed = editorCmp['engine'].editor();
    expect(ed).toBeTruthy();
    const matches = collectFindMatches(ed!.state.doc, 'world');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});

describe('sanitizePastedHtml', () => {
  it('strips scripts, event handlers, and javascript URLs', () => {
    const dirty =
      '<p onclick="alert(1)">Hi</p><script>evil()</script><a href="javascript:alert(1)">x</a>';
    const clean = sanitizePastedHtml(dirty);
    expect(clean).not.toContain('<script');
    expect(clean).not.toContain('onclick');
    expect(clean).not.toContain('javascript:');
    expect(clean).toContain('<p');
    expect(clean).toContain('Hi');
  });
});

function findMark(
  doc: PixelEditorDoc | null | undefined,
  type: string,
): Record<string, unknown> | null {
  if (!doc) return null;
  const walk = (node: Record<string, unknown>): Record<string, unknown> | null => {
    const marks = node['marks'];
    if (Array.isArray(marks)) {
      for (const mark of marks) {
        if (mark && typeof mark === 'object' && (mark as { type?: string }).type === type) {
          return mark as Record<string, unknown>;
        }
      }
    }
    const content = node['content'];
    if (!Array.isArray(content)) return null;
    for (const child of content) {
      if (child && typeof child === 'object') {
        const hit = walk(child as Record<string, unknown>);
        if (hit) return hit;
      }
    }
    return null;
  };
  return walk(doc as Record<string, unknown>);
}

function findNode(
  doc: PixelEditorDoc | null | undefined,
  type: string,
): Record<string, unknown> | null {
  if (!doc) return null;
  const walk = (node: Record<string, unknown>): Record<string, unknown> | null => {
    if (node['type'] === type) return node;
    const content = node['content'];
    if (!Array.isArray(content)) return null;
    for (const child of content) {
      if (child && typeof child === 'object') {
        const hit = walk(child as Record<string, unknown>);
        if (hit) return hit;
      }
    }
    return null;
  };
  return walk(doc as Record<string, unknown>);
}
