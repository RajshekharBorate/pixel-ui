# export — design

This page explains **export** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

Builds a CSV, TSV, JSON, or spreadsheet file in memory and downloads it. It does not call the network. The data grid toolbar uses it. It does not read the DOM.

| This piece does | It does not |
| --- | --- |
| Turns rows into a file and saves it | Upload or download from a URL (use file-transfer) |
| Stays in memory | Scrape a table from the page |

## 2. Who talks to whom

Export builds a CSV, TSV, JSON, or spreadsheet in memory and hands it to the browser download. It does not call the network, and it does not read the table in the DOM. The data grid toolbar uses this service. Filter the columns before you call it.

```mermaid
flowchart TB
  subgraph page [Your page]
    Rows[Columns and rows you allow]
  end
  subgraph exp [Export]
    File[In-memory file]
  end
  subgraph browser [Browser]
    Save[Download]
  end
  Rows --> File
  File --> Save
```

**How to read the picture**

- **You pass the rows.** The service does not scrape the grid.
- **You pass the columns.** Hidden or forbidden columns stay out because you never passed them.
- **No HTTP.** Uploads and remote downloads belong to file transfer.

## 3. Flows

### Download rows

1. The page, or the grid toolbar, passes columns and rows. The service builds the file in memory.
2. The browser downloads it. No request is sent.

### Only allowed columns

1. Pass only the columns the person may see. The service does not discover hidden columns from the DOM.
2. The file contains that list and nothing else.

## 4. Step by step

Section 3 is the short list. Each picture here is one of those flows, with the branch that changes what the developer must do. Read the note under the picture before copying the pattern.

### Download rows

```mermaid
sequenceDiagram
  participant Page
  participant Export
  participant Browser
  Page->>Export: columns and rows
  Export->>Export: build the file in memory
  Export->>Browser: download
  Note over Browser: no request is sent
```

Use this for a grid export or any in-memory table. Do not point it at a URL.

### Only allowed columns

```mermaid
sequenceDiagram
  participant Page
  participant Export
  Page->>Export: the columns this person may see
  Note over Export: nothing else is discovered from the DOM
  Note over Export: the file contains that list only
```

Filter columns before the call. The service will not drop a column you included, even if the grid had hidden it.

## 5. States

- Idle.
- Building the file.
- Download started.

## 6. Easy to get wrong

- This is not an HTTP client and not the file-transfer queue.
- Do not pass columns the user must not see. Filter them before the call.

## 7. Files

- `clipboard.ts`
- `export.service.ts`
- `export.tokens.ts`
- `export.ts`
- `export.types.ts`
- `public-api.ts`
- `save-as.ts`
- `serialize.ts`
- `xlsx.ts`
- `zip.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
