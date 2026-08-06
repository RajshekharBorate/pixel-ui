/**
 * Overridable user-visible copy for `pixel-editor` (CONVENTIONS §3i).
 * Pass a partial map via `[labels]` on `PixelEditorComponent`.
 */

/** Replace `{name}`-style placeholders in a label template. */
export function pixelEditorFormatLabel(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : '',
  );
}

export type PixelEditorLabels = {
  // Host / chrome
  readonly richTextEditor: string;
  readonly writeDescription: string;
  readonly formatting: string;

  // Toolbar groups
  readonly textStyle: string;
  readonly textStyleTooltip: string;
  readonly inlineFormatting: string;
  readonly listsAndAlignment: string;
  readonly insert: string;
  readonly moreTools: string;
  readonly history: string;

  // Text style / font size
  readonly normalText: string;
  readonly heading1: string;
  readonly heading2: string;
  readonly heading3: string;
  readonly fontSize: string;
  readonly fontSizeTooltip: string;
  readonly fontSizeDefault: string;
  readonly fontSizeSmall: string;
  readonly fontSizeMedium: string;
  readonly fontSizeLarge: string;
  readonly fontSizeExtraLarge: string;
  readonly fontSizeFallback: string;

  // Inline marks
  readonly bold: string;
  readonly boldTooltip: string;
  readonly italic: string;
  readonly italicTooltip: string;
  readonly underline: string;
  readonly underlineTooltip: string;
  readonly textColorAndHighlight: string;
  readonly colorAndHighlight: string;
  readonly colorHighlightTooltip: string;
  readonly textColor: string;
  readonly highlight: string;
  readonly moreFormatting: string;
  readonly moreTooltip: string;
  readonly strikethrough: string;
  readonly inlineCode: string;
  readonly clearFormatting: string;

  // Lists / alignment
  readonly alignment: string;
  readonly alignLeft: string;
  readonly alignCenter: string;
  readonly alignRight: string;
  readonly justify: string;
  readonly bulletedList: string;
  readonly numberedList: string;
  readonly taskList: string;
  readonly blockQuote: string;
  readonly quoteTooltip: string;

  // Insert / pickers
  readonly insertLink: string;
  readonly linkTooltip: string;
  readonly urlLabel: string;
  readonly urlPlaceholder: string;
  readonly remove: string;
  readonly apply: string;
  readonly insertImage: string;
  readonly imageTooltip: string;
  readonly imageUrlLabel: string;
  readonly altTextLabel: string;
  readonly altTextPlaceholder: string;
  readonly insertAction: string;
  readonly insertTable: string;
  readonly tableTooltip: string;
  readonly mentionSomeone: string;
  readonly mentionTooltip: string;
  readonly personLabel: string;
  readonly searchPeoplePlaceholder: string;
  readonly emoji: string;
  readonly insertEmoji: string;
  readonly insertDate: string;
  readonly dateTooltip: string;
  readonly dateLabel: string;
  readonly specialCharacters: string;
  readonly insertBlock: string;
  readonly insertTooltip: string;
  readonly codeBlock: string;
  readonly panel: string;
  readonly horizontalRule: string;
  readonly codeLanguage: string;
  readonly panelVariant: string;
  readonly panelInfo: string;
  readonly panelNote: string;
  readonly panelSuccess: string;
  readonly panelWarning: string;
  readonly panelError: string;

  // Find & replace
  readonly findAndReplace: string;
  readonly findTooltip: string;
  readonly find: string;
  readonly findPlaceholder: string;
  readonly replace: string;
  readonly replacePlaceholder: string;
  readonly previousMatch: string;
  readonly previousTooltip: string;
  readonly nextMatch: string;
  readonly nextTooltip: string;
  readonly replaceAll: string;
  readonly findOptions: string;
  readonly matchCase: string;
  readonly matchWholeWord: string;
  readonly findNoMatches: string;
  /** Template: `{index}` / `{count}`. */
  readonly findMatchStatus: string;

  // History / fullscreen
  readonly undo: string;
  readonly undoTooltip: string;
  readonly redo: string;
  readonly redoTooltip: string;
  readonly enterFullscreen: string;
  readonly exitFullscreen: string;
  readonly fullscreenTooltip: string;

  // Status bar
  /** Template: `{kind}`. */
  readonly currentBlock: string;
  /** Template: `{label}`. */
  readonly cycleCountMode: string;
  /** Template: `{n}`. */
  readonly charactersCount: string;
  /** Template: `{n}`. */
  readonly charactersWithSpacesCount: string;
  /** Template: `{n}`. */
  readonly wordsCount: string;
  readonly charactersCountTooltip: string;
  readonly charactersWithSpacesCountTooltip: string;
  readonly wordsCountTooltip: string;
  readonly pixelDocumentFormat: string;
  readonly formatHintTooltip: string;
  readonly copyAsHtml: string;
  readonly copyHtmlTooltip: string;
  readonly copyAsMarkdown: string;
  readonly copyMarkdownTooltip: string;
  readonly htmlShort: string;
  readonly mdShort: string;
  readonly saving: string;
  readonly draftSaved: string;
  readonly saveFailed: string;

  // Image toolbar
  readonly imageFormatting: string;
  readonly alignGroup: string;
  readonly alignStart: string;
  readonly alignEnd: string;
  readonly widthGroup: string;
  readonly imageWidth: string;
  readonly widthTooltip: string;
  readonly imageWidthAuto: string;
  readonly floatGroup: string;
  readonly floatStart: string;
  readonly floatEnd: string;
  readonly noFloat: string;
  readonly captionAndCrop: string;
  readonly addCaption: string;
  readonly removeCaption: string;
  readonly cropImage: string;
  readonly cropTooltip: string;
  readonly crop1x1: string;
  readonly crop4x3: string;
  readonly crop16x9: string;
  readonly removeImage: string;
  readonly removeTooltip: string;

  // Table toolbar
  readonly tableFormatting: string;
  readonly rows: string;
  readonly columns: string;
  readonly cells: string;
  readonly header: string;
  readonly border: string;
  readonly resize: string;
  readonly addRowAbove: string;
  readonly addRowBelow: string;
  readonly deleteRow: string;
  readonly addColumnBefore: string;
  readonly addColumnAfter: string;
  readonly addColumnLeftTooltip: string;
  readonly addColumnRightTooltip: string;
  readonly deleteColumn: string;
  readonly mergeCells: string;
  readonly splitCell: string;
  readonly cellAlign: string;
  readonly cellBackground: string;
  readonly toggleHeaderRow: string;
  readonly toggleHeaderColumn: string;
  readonly headerColor: string;
  readonly tableBorder: string;
  readonly tableWidth: string;
  readonly columnWidth: string;
  readonly rowHeight: string;
  readonly equalizeColumns: string;
  readonly deleteTable: string;
  readonly tableColNarrow: string;
  readonly tableColDefault: string;
  readonly tableColWide: string;
  readonly tableColExtraWide: string;
  readonly tableRowCompact: string;
  readonly tableRowDefault: string;
  readonly tableRowComfortable: string;
  readonly tableRowTall: string;
  readonly tableFitContent: string;
  readonly tableWidth25: string;
  readonly tableWidth50: string;
  readonly tableWidth75: string;
  readonly tableWidth100: string;
  readonly borderSolid: string;
  readonly borderDashed: string;
  readonly borderNone: string;

  // Slash / mention suggest
  readonly slashCommands: string;
  readonly mentionSuggestions: string;
  readonly suggestNoMatches: string;
  readonly slashHeading1: string;
  readonly slashHeading2: string;
  readonly slashHeading3: string;
  readonly slashBulletList: string;
  readonly slashOrderedList: string;
  readonly slashTaskList: string;
  readonly slashInfoPanel: string;
  readonly slashNotePanel: string;
  readonly slashSuccessPanel: string;
  readonly slashWarningPanel: string;
  readonly slashErrorPanel: string;
  readonly slashCalloutSubtitle: string;
  readonly slashCodeBlock: string;
  readonly slashTable: string;
  readonly slashTableSubtitle: string;
  readonly slashHorizontalRule: string;
  readonly slashImage: string;
  readonly slashImageSubtitle: string;
  readonly slashMention: string;
  readonly slashMentionSubtitle: string;
  readonly slashEmoji: string;
  readonly slashEmojiSubtitle: string;
  readonly slashDate: string;
  readonly slashDateSubtitle: string;
};

export const DEFAULT_PIXEL_EDITOR_LABELS: PixelEditorLabels = {
  richTextEditor: 'Rich text editor',
  writeDescription: 'Write a description…',
  formatting: 'Formatting',

  textStyle: 'Text style',
  textStyleTooltip: 'Text style',
  inlineFormatting: 'Inline formatting',
  listsAndAlignment: 'Lists and alignment',
  insert: 'Insert',
  moreTools: 'More tools',
  history: 'History',

  normalText: 'Normal text',
  heading1: 'Heading 1',
  heading2: 'Heading 2',
  heading3: 'Heading 3',
  fontSize: 'Font size',
  fontSizeTooltip: 'Font size',
  fontSizeDefault: 'Default',
  fontSizeSmall: 'Small',
  fontSizeMedium: 'Medium',
  fontSizeLarge: 'Large',
  fontSizeExtraLarge: 'Extra large',
  fontSizeFallback: 'Size',

  bold: 'Bold',
  boldTooltip: 'Bold (Ctrl+B)',
  italic: 'Italic',
  italicTooltip: 'Italic (Ctrl+I)',
  underline: 'Underline',
  underlineTooltip: 'Underline (Ctrl+U)',
  textColorAndHighlight: 'Text color and highlight',
  colorAndHighlight: 'Color and highlight',
  colorHighlightTooltip: 'Color & highlight',
  textColor: 'Text color',
  highlight: 'Highlight',
  moreFormatting: 'More formatting',
  moreTooltip: 'More',
  strikethrough: 'Strikethrough',
  inlineCode: 'Inline code',
  clearFormatting: 'Clear formatting',

  alignment: 'Alignment',
  alignLeft: 'Align left',
  alignCenter: 'Align center',
  alignRight: 'Align right',
  justify: 'Justify',
  bulletedList: 'Bulleted list',
  numberedList: 'Numbered list',
  taskList: 'Task list',
  blockQuote: 'Block quote',
  quoteTooltip: 'Quote',

  insertLink: 'Insert link',
  linkTooltip: 'Link',
  urlLabel: 'URL',
  urlPlaceholder: 'https://',
  remove: 'Remove',
  apply: 'Apply',
  insertImage: 'Insert image',
  imageTooltip: 'Image',
  imageUrlLabel: 'Image URL',
  altTextLabel: 'Alt text',
  altTextPlaceholder: 'Describe the image',
  insertAction: 'Insert',
  insertTable: 'Insert table',
  tableTooltip: 'Table',
  mentionSomeone: 'Mention someone',
  mentionTooltip: 'Mention',
  personLabel: 'Person',
  searchPeoplePlaceholder: 'Search people…',
  emoji: 'Emoji',
  insertEmoji: 'Insert emoji',
  insertDate: 'Insert date',
  dateTooltip: 'Date',
  dateLabel: 'Date',
  specialCharacters: 'Special characters',
  insertBlock: 'Insert block',
  insertTooltip: 'Insert',
  codeBlock: 'Code block',
  panel: 'Panel',
  horizontalRule: 'Horizontal rule',
  codeLanguage: 'Code language',
  panelVariant: 'Panel variant',
  panelInfo: 'Info',
  panelNote: 'Note',
  panelSuccess: 'Success',
  panelWarning: 'Warning',
  panelError: 'Error',

  findAndReplace: 'Find and replace',
  findTooltip: 'Find (Ctrl+F)',
  find: 'Find',
  findPlaceholder: 'Find',
  replace: 'Replace',
  replacePlaceholder: 'Replace',
  previousMatch: 'Previous match',
  previousTooltip: 'Previous',
  nextMatch: 'Next match',
  nextTooltip: 'Next',
  replaceAll: 'Replace all',
  findOptions: 'Find options',
  matchCase: 'Match case',
  matchWholeWord: 'Match whole word',
  findNoMatches: 'No matches',
  findMatchStatus: '{index} of {count}',

  undo: 'Undo',
  undoTooltip: 'Undo (Ctrl+Z)',
  redo: 'Redo',
  redoTooltip: 'Redo (Ctrl+Y)',
  enterFullscreen: 'Enter fullscreen',
  exitFullscreen: 'Exit fullscreen',
  fullscreenTooltip: 'Fullscreen',

  currentBlock: 'Current block {kind}',
  cycleCountMode: '{label}. Cycle count mode',
  charactersCount: '{n} characters',
  charactersWithSpacesCount: '{n} characters (with spaces)',
  wordsCount: '{n} words',
  charactersCountTooltip: 'Character count (no spaces). Click to cycle.',
  charactersWithSpacesCountTooltip: 'Character count (with spaces). Click to cycle.',
  wordsCountTooltip: 'Word count. Click to cycle.',
  pixelDocumentFormat: 'Pixel Document Format',
  formatHintTooltip:
    'Documents are stored as structured JSON (Pixel Document Format). HTML is available as a derived export.',
  copyAsHtml: 'Copy as HTML',
  copyHtmlTooltip: 'Copy HTML',
  copyAsMarkdown: 'Copy as Markdown',
  copyMarkdownTooltip: 'Copy Markdown',
  htmlShort: 'HTML',
  mdShort: 'MD',
  saving: 'Saving…',
  draftSaved: 'Draft saved',
  saveFailed: 'Save failed',

  imageFormatting: 'Image formatting',
  alignGroup: 'Align',
  alignStart: 'Align start',
  alignEnd: 'Align end',
  widthGroup: 'Width',
  imageWidth: 'Image width',
  widthTooltip: 'Width',
  imageWidthAuto: 'Auto',
  floatGroup: 'Float',
  floatStart: 'Float start',
  floatEnd: 'Float end',
  noFloat: 'No float',
  captionAndCrop: 'Caption and crop',
  addCaption: 'Add caption',
  removeCaption: 'Remove caption',
  cropImage: 'Crop image',
  cropTooltip: 'Crop',
  crop1x1: 'Crop 1:1',
  crop4x3: 'Crop 4:3',
  crop16x9: 'Crop 16:9',
  removeImage: 'Remove image',
  removeTooltip: 'Remove',

  tableFormatting: 'Table formatting',
  rows: 'Rows',
  columns: 'Columns',
  cells: 'Cells',
  header: 'Header',
  border: 'Border',
  resize: 'Resize',
  addRowAbove: 'Add row above',
  addRowBelow: 'Add row below',
  deleteRow: 'Delete row',
  addColumnBefore: 'Add column before',
  addColumnAfter: 'Add column after',
  addColumnLeftTooltip: 'Add column left',
  addColumnRightTooltip: 'Add column right',
  deleteColumn: 'Delete column',
  mergeCells: 'Merge cells',
  splitCell: 'Split cell',
  cellAlign: 'Cell align',
  cellBackground: 'Cell background',
  toggleHeaderRow: 'Toggle header row',
  toggleHeaderColumn: 'Toggle header column',
  headerColor: 'Header color',
  tableBorder: 'Table border',
  tableWidth: 'Table width',
  columnWidth: 'Column width',
  rowHeight: 'Row height',
  equalizeColumns: 'Equalize columns',
  deleteTable: 'Delete table',
  tableColNarrow: 'Narrow',
  tableColDefault: 'Default',
  tableColWide: 'Wide',
  tableColExtraWide: 'Extra wide',
  tableRowCompact: 'Compact',
  tableRowDefault: 'Default',
  tableRowComfortable: 'Comfortable',
  tableRowTall: 'Tall',
  tableFitContent: 'Fit content',
  tableWidth25: '25%',
  tableWidth50: '50%',
  tableWidth75: '75%',
  tableWidth100: '100%',
  borderSolid: 'Solid',
  borderDashed: 'Dashed',
  borderNone: 'None',

  slashCommands: 'Slash commands',
  mentionSuggestions: 'Mention suggestions',
  suggestNoMatches: 'No matches',
  slashHeading1: 'Heading 1',
  slashHeading2: 'Heading 2',
  slashHeading3: 'Heading 3',
  slashBulletList: 'Bullet list',
  slashOrderedList: 'Ordered list',
  slashTaskList: 'Task list',
  slashInfoPanel: 'Info panel',
  slashNotePanel: 'Note panel',
  slashSuccessPanel: 'Success panel',
  slashWarningPanel: 'Warning panel',
  slashErrorPanel: 'Error panel',
  slashCalloutSubtitle: 'Callout',
  slashCodeBlock: 'Code block',
  slashTable: 'Table',
  slashTableSubtitle: '2×2 with header',
  slashHorizontalRule: 'Horizontal rule',
  slashImage: 'Image',
  slashImageSubtitle: 'URL or upload',
  slashMention: 'Mention',
  slashMentionSubtitle: 'Opens @ mention',
  slashEmoji: 'Emoji',
  slashEmojiSubtitle: 'Pick an emoji',
  slashDate: 'Date',
  slashDateSubtitle: 'Pick a date',
};

/** Number of keys on {@link PixelEditorLabels} / {@link DEFAULT_PIXEL_EDITOR_LABELS}. */
export const PIXEL_EDITOR_LABEL_KEY_COUNT = Object.keys(DEFAULT_PIXEL_EDITOR_LABELS)
  .length as number;
