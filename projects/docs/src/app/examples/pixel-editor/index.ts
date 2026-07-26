import { createDocExample } from '../../shared/example-source.util';
import { EditorBasicExample } from './editor-basic.example';
import { EditorBlocksExample } from './editor-blocks.example';
import { EditorCanvasExample } from './editor-canvas.example';
import { EditorInsertsExample } from './editor-inserts.example';
import { EditorMediaExample } from './editor-media.example';
import { EditorReactiveFormExample } from './editor-reactive-form.example';
import { EditorToolbarBottomExample } from './editor-toolbar-bottom.example';

const EDITOR_IMPORTS = ['PixelEditorComponent'] as const;

export const EDITOR_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Basic editor',
    category: 'Setup',
    description:
      'TipTap-backed canvas with JSON value, toolbar marks/lists/history, and status bar. Canonical value is PixelEditorDoc.',
    component: EditorBasicExample,
    imports: [...EDITOR_IMPORTS],
    html: `<pixel-editor
  label="Description"
  placeholder="Write a description…"
  [value]="doc()"
  (valueChange)="doc.set($event)"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelEditorComponent, type PixelEditorDoc } from 'pixel-ui';

@Component({ /* … */ })
export class EditorBasicExample {
  protected readonly doc = signal<PixelEditorDoc>({ type: 'doc', content: [/* … */] });
}`,
  }),
  createDocExample({
    id: 'toolbar-bottom',
    title: 'Toolbar at bottom',
    category: 'Setup',
    description:
      'toolbarPosition="bottom" moves formatting chrome under the canvas and hides the status bar (footer slot is the toolbar).',
    component: EditorToolbarBottomExample,
    imports: [...EDITOR_IMPORTS],
    html: `<pixel-editor
  label="Comment"
  placeholder="Write a comment…"
  toolbarPosition="bottom"
  [value]="doc()"
  (valueChange)="doc.set($event)"
/>`,
    typescript: `// toolbarPosition: 'top' | 'bottom' — bottom suppresses the status bar`,
  }),
  createDocExample({
    id: 'canvas',
    title: 'Mock canvas',
    category: 'Content',
    description:
      'Matches the UX reference: heading, bullets, info panel, and interactive task list (checked state persists in JSON).',
    component: EditorCanvasExample,
    imports: [...EDITOR_IMPORTS],
    html: `<pixel-editor
  label="Project update"
  [value]="doc()"
  (valueChange)="doc.set($event)"
/>`,
    typescript: `// Seeded PixelEditorDoc with heading, bulletList, panel, taskList`,
  }),
  createDocExample({
    id: 'media',
    title: 'Color, links & images',
    category: 'Content',
    description:
      'Theme-aware text/highlight swatches (CSS tokens for light & dark), link popover (Apply/Remove), and image URL or file upload. Paste a URL to autolink. (imageRequest) notifies the app for upload pipelines.',
    component: EditorMediaExample,
    imports: [...EDITOR_IMPORTS],
    html: `<pixel-editor
  [value]="doc()"
  (valueChange)="doc.set($event)"
  (imageRequest)="onImage($event)"
/>`,
    typescript: `// Color, highlight, link marks + imageRequest handler`,
  }),
  createDocExample({
    id: 'inserts',
    title: 'Mentions, emoji & dates',
    category: 'Content',
    description:
      'Type @ for mention suggestions, or use toolbar pickers for mentions, a larger curated emoji set, date chips (local calendar day), and special characters. Insert menu is block-only. Bind [mentionItems] and optionally (mentionQuery) for async search.',
    component: EditorInsertsExample,
    imports: [...EDITOR_IMPORTS],
    html: `<pixel-editor
  [value]="doc()"
  [mentionItems]="people()"
  (valueChange)="doc.set($event)"
  (mentionQuery)="onMentionQuery($event.query)"
/>`,
    typescript: `// mentionItems + dateChip / emoji inserts`,
  }),
  createDocExample({
    id: 'blocks',
    title: 'Code, tables & HR',
    category: 'Content',
    description:
      'Code blocks with lowlight syntax highlighting (language submenu), 3×3 tables with header row and Tab cell navigation, horizontal rules, and Escape-to-exit fullscreen.',
    component: EditorBlocksExample,
    imports: [...EDITOR_IMPORTS],
    html: `<pixel-editor
  [value]="doc()"
  (valueChange)="doc.set($event)"
/>`,
    typescript: `// Seeded codeBlock (typescript) + table + horizontalRule`,
  }),
  createDocExample({
    id: 'reactive-form',
    title: 'Reactive forms',
    category: 'Forms',
    description: 'ControlValueAccessor + required/minLength validators (empty docs are invalid when required).',
    component: EditorReactiveFormExample,
    imports: [...EDITOR_IMPORTS, 'ReactiveFormsModule', 'PixelButtonComponent'],
    html: `<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <pixel-editor
    formControlName="description"
    label="Description"
    required
    minLength="8"
    [validationMessages]="{ required: 'Description is required.', minlength: '…' }"
  />
</form>`,
    typescript: `// markAllAsTouched() on submit so invalid chrome matches pixel-input`,
  }),
];
