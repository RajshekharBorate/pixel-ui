# pixel-badge — design

This page explains **pixel-badge** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

A small status mark: a count, a dot, a status, or a short label. It can be plain text, a button, or a removable chip-like control. The type picks the picture. Clickable and removable pick the behavior.

| This piece does | It does not |
| --- | --- |
| Shows a count, dot, status, or label | Replace a toast or a dialog |
| Can be pressed or removed when asked | Navigate by itself |

## 2. Who talks to whom

```mermaid
flowchart LR
  page["Your page"]
  badge["Badge"]
  count["Count"]
  live["Status text"]
  press["Press"]
  page --> badge
  badge --> count
  badge --> live
  badge --> press
  press --> page
```

## 3. Flows

### Count

1. The page sets a count. The badge shows the number, or a cap when the number is large.
2. If the badge is not a button, it is a status. The name is derived, for example "10 notifications".

### Press or remove

1. The page marks it clickable or removable. It becomes a real button.
2. The user presses it or removes it. The page updates the value. A live status is not used on the button itself.

## 4. Step by step

### Count

```mermaid
sequenceDiagram
  participant page as "Your page"
  participant badge as "Badge"
  participant count as "Count"
  participant live as "Status text"
  page->>badge: The page sets a count. The badge shows the number, or a cap when the number is large.
  badge->>live: If the badge is not a button, it is a status. The name is derived, for example '10 notific
```

### Press or remove

```mermaid
sequenceDiagram
  participant page as "Your page"
  participant badge as "Badge"
  participant press as "Press"
  page->>badge: The page marks it clickable or removable. It becomes a real button.
  press->>page: The user presses it or removes it. The page updates the value. A live status is not used o
```

## 5. States

- Count, dot, status, or label — the type chooses the picture.
- Plain: announced as status.
- Clickable or removable: a button, with its own name.

## 6. Easy to get wrong

- Do not use the type string to mean "clickable". Clickable and removable are separate flags.
- Do not announce a static badge twice. The status role is for the non-interactive badge.

## 7. Files

- `pixel-badge.html`
- `pixel-badge.scss`
- `pixel-badge.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
