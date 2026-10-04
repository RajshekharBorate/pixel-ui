# pixel-editor — design

This page explains **pixel-editor** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

A rich text surface with a toolbar. Import it from pixel-ui/editor, not the main barrel. The toolbar is a toolbar. The writing area is a multiline textbox. Analytics records the command id only, never the document text.

| This piece does | It does not |
| --- | --- |
| Edits formatted text | Send the document, a find query, or a pasted URL to analytics |
| Runs toolbar commands | Include find-and-replace or a table toolbar (those are not in this control yet) |

## 2. Who talks to whom

```mermaid
flowchart LR
  page["Your page"]
  editor["Editor"]
  bar["Toolbar"]
  doc["Document"]
  page --> editor
  editor --> doc
  doc --> page
  bar --> doc
```

## 3. Flows

### Edit

1. The page gives the editor a document. The user types in the textbox.
2. The page reads the updated document from the editor output. The text stays in the page, not in analytics.

### Toolbar command

1. The user presses a toolbar button, such as bold. The command changes the selection in the document.
2. If analytics is on, only the command id is recorded. Not the text, not a search string, not a link URL.

## 4. Step by step

### Edit

```mermaid
sequenceDiagram
  participant page as "Your page"
  participant editor as "Editor"
  participant doc as "Document"
  page->>editor: The page gives the editor a document. The user types in the textbox.
  doc->>page: The page reads the updated document from the editor output. The text stays in the page, no
```

### Toolbar command

```mermaid
sequenceDiagram
  participant bar as "Toolbar"
  participant doc as "Document"
  bar->>doc: The user presses a toolbar button, such as bold. The command changes the selection in the 
  bar->>bar: If analytics is on, only the command id is recorded. Not the text, not a search string, no
```

## 5. States

- Ready, focused textbox, and disabled toolbar buttons when a command does not apply.
- Empty document.
- Read-only when the page disallows edits.

## 6. Easy to get wrong

- Import from pixel-ui/editor.
- Do not expect a find toolbar or a table toolbar. They are deferred.
- Do not put document text in analytics.

## 7. Files

- `extensions`
- `pickers`
- `pixel-editor-content-styles.ts`
- `pixel-editor-date.util.ts`
- `pixel-editor-doc.util.ts`
- `pixel-editor-find-bar.html`
- `pixel-editor-find-bar.scss`
- `pixel-editor-find-bar.ts`
- `pixel-editor-image-crop.util.ts`
- `pixel-editor-image-toolbar.html`
- `pixel-editor-image-toolbar.scss`
- `pixel-editor-image-toolbar.ts`
- `pixel-editor-labels.ts`
- `pixel-editor-markdown.util.ts`
- `pixel-editor-status-bar.html`
- `pixel-editor-status-bar.scss`
- `pixel-editor-status-bar.ts`
- `pixel-editor-table-toolbar.html`
- `pixel-editor-table-toolbar.scss`
- `pixel-editor-table-toolbar.ts`
- `pixel-editor-toolbar.html`
- `pixel-editor-toolbar.scss`
- `pixel-editor-toolbar.ts`
- `pixel-editor.html`
- `pixel-editor.scss`
- `pixel-editor.service.ts`
- `pixel-editor.ts`
- `pixel-editor.types.ts`
- `public-api.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
