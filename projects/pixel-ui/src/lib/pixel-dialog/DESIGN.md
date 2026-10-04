# pixel-dialog — design

This page explains **pixel-dialog** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

A modal window. Focus is trapped inside until it closes. Escape and the scrim close it only when the page allows dismiss. A confirm dialog is an alert dialog. The body scrolls, not the whole page.

| This piece does | It does not |
| --- | --- |
| Shows a modal and restores focus to the trigger | Close on Escape when the page marked it not dismissable |
| Records open and close reasons if analytics is on | Send the dialog title to analytics |

## 2. Who talks to whom

The dialog is modal. While it is open, focus stays inside, the page behind does not scroll, and focus returns to the trigger on close. A confirm dialog has no close button. The user must use the actions. Analytics records why it closed, never the title.

```mermaid
flowchart TB
  subgraph page [Your page]
    OpenAsk[Open or close]
    Content[Title and body]
  end
  subgraph dialog [Dialog]
    Trap[Focus trap]
    Lock[Scroll lock]
    Scrim[Scrim]
  end
  OpenAsk -->|open| dialog
  Content --> dialog
  Trap --> dialog
  Scrim -->|dismiss, if allowed| page
  dialog -->|escape, scrim, close, or programmatic| page
```

**How to read the picture**

- **Open.** Focus moves inside. Body scroll is locked.
- **Dismissable.** Escape or the scrim closes it and restores focus.
- **Must choose.** A confirm dialog is an alert dialog. Escape, the scrim, and a close button do not dismiss it.
- **Long body.** The body scrolls inside the dialog. The footer stays put.
- **Analytics.** Open and close, with a reason. Never the title or the body text.

## 3. Flows

### Open and close

1. The page opens the dialog. Focus moves inside. Tab stays in the dialog. The page behind does not scroll.
2. The user closes it with the close control. Focus returns to the trigger.

### Escape or scrim

1. If dismissable, Escape or a scrim click closes the dialog.
2. The close reason is escape, scrim, close, or programmatic. The title is never recorded.

### Must choose

1. A confirm dialog is an alert dialog. If it is not dismissable, Escape and the scrim do nothing.
2. The user picks a button. The page closes the dialog and continues.

## 4. Step by step

Section 3 is the short list. Each picture here is one of those flows, with the branch that changes what the developer must do. Read the note under the picture before copying the pattern.

### Open and close

```mermaid
sequenceDiagram
  actor User
  participant Page
  participant Dialog
  Page->>Dialog: open
  Note over Dialog: focus moves in, page stops scrolling
  User->>Dialog: press close
  Dialog->>Page: closed, focus returns to the trigger
  Note over Page: analytics may record the reason, never the title
```

Keep the trigger in the page so focus has somewhere to return. Do not destroy the trigger while the dialog is open.

### Escape or scrim

```mermaid
sequenceDiagram
  actor User
  participant Dialog
  participant Page
  alt dismissable
    User->>Dialog: Escape or scrim
    Dialog->>Page: close and restore focus
  else not dismissable
    Note over Dialog: Escape and the scrim do nothing
  end
```

Turn dismissable off when the user must pick an action. The close button follows the same rule.

### Must choose

```mermaid
sequenceDiagram
  actor User
  participant Dialog
  participant Page
  Note over Dialog: alert dialog, no close button
  User->>Dialog: confirm or cancel
  Dialog->>Page: that result only
```

Confirm and cancel are the only exits. Do not also listen for Escape as a cancel unless the dialog is dismissable.

## 5. States

- Closed.
- Open, focus trapped, body scrolling inside the dialog.
- Dismissable or locked.
- Confirm: alert dialog.

## 6. Easy to get wrong

- Do not send the title to analytics. Send the close reason only.
- A locked dialog must not close on Escape or the scrim.
- Restore focus to the trigger. Do not leave focus on the body.

## 7. Files

- `pixel-confirm-dialog.ts`
- `pixel-dialog-container.ts`
- `pixel-dialog-ref.ts`
- `pixel-dialog.scss`
- `pixel-dialog.service.ts`
- `pixel-dialog.ts`
- `pixel-dialog.types.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
