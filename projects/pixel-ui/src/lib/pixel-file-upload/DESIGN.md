# pixel-file-upload — design

This page explains **pixel-file-upload** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

A drop zone and a hidden file input. The user can drop files or press Enter or Space to open the system file dialog. Analytics may count files and coarse type or size buckets. It never records file names.

| This piece does | It does not |
| --- | --- |
| Accepts dropped or picked files | Upload bytes by itself (the page or file-transfer service does that) |
| Rejects the wrong type or a file that is too large | Send file names to analytics |

## 2. Who talks to whom

The drop zone collects files. It does not upload them. The page, or the file-transfer service, sends the bytes. Analytics may count files and coarse type or size buckets. It never records file names.

```mermaid
flowchart TB
  subgraph page [Your page]
    Rules[Accepted types and max size]
    Upload[Your upload, or file transfer]
  end
  subgraph zone [Drop zone]
    Button[Button plus a hidden file input]
    List[Names on screen only]
    Error[Type or size rejection]
  end
  Rules --> Button
  Button -->|dialog or drop| List
  List -->|the files| Upload
  Button -->|wrong type or too big| Error
```

**How to read the picture**

- **Enter, Space, or click** opens the system file dialog. A drop skips the dialog.
- **Rejection.** That file is not a successful add. The message uses the component labels.
- **Names stay on screen** for the user. Do not send them to analytics.

## 3. Flows

### Pick files

1. The page sets accepted types and the max size. The zone is a button plus a hidden file input.
2. Enter, Space, or a click opens the system dialog. Dropping files skips the dialog.
3. The page receives the files. Names stay on screen for the user. They are not sent to analytics.

### Reject a file

1. A file with the wrong type or a size over the limit is rejected. The message uses the component labels.
2. The page does not receive that file as a successful add.

## 4. Step by step

Section 3 is the short list. Each picture here is one of those flows, with the branch that changes what the developer must do. Read the note under the picture before copying the pattern.

### Pick files

```mermaid
sequenceDiagram
  actor User
  participant Zone as Drop zone
  participant Page
  Page->>Zone: types and max size
  alt click, Enter, or Space
    Zone->>Zone: system file dialog
  else drop
    Zone->>Zone: use the dropped files
  end
  Zone->>Page: the accepted files
  Note over Zone: names are on screen, not in analytics
```

Hand the files to your upload code. This control stops once the page has the File list.

### Reject a file

```mermaid
sequenceDiagram
  participant Zone as Drop zone
  participant Page
  Zone->>Zone: wrong type or over the size limit
  Note over Page: that file is not added
```

Show the component’s own message. Do not log the file name.

## 5. States

- Idle, drag-over, and disabled.
- Files listed after a successful pick.
- Error for type or size.
- Busy if the page shows progress while it uploads.

## 6. Easy to get wrong

- This control collects files. It does not run the HTTP upload. Hand the files to your upload code or the file-transfer service.
- Never log file names in analytics. Counts and coarse buckets only.

## 7. Files

- `pixel-file-upload.html`
- `pixel-file-upload.scss`
- `pixel-file-upload.ts`
- `pixel-file-upload.types.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
