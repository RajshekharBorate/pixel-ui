# pixel-divider — design

This page explains **pixel-divider** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

A line that separates regions. Horizontal is the default. Vertical only works when the parent has a height. A label is for horizontal lines only.

| This piece does | It does not |
| --- | --- |
| Draws a horizontal or vertical rule | Replace a heading |
| Can show a short label on a horizontal line | Label a vertical line |

## 2. Who talks to whom

```mermaid
flowchart LR
  page["Your page"]
  line["Divider"]
  label["Label"]
  skeleton["Skeleton"]
  page --> line
  line --> label
  page --> skeleton
```

## 3. Flows

### Horizontal

1. The page places a divider. It is horizontal and announced as a separator.
2. A label, if set, sits on that horizontal line. Inset and dashed or dotted styles stay on the same line.

### Vertical

1. The page asks for vertical. The parent must have a height, or the line has nothing to stretch through.
2. A label is not used on a vertical line.

### Skeleton

1. The page shows a skeleton. The divider is busy and is not the real rule yet.
2. Ready. The skeleton leaves and the rule is shown.

## 4. Step by step

### Horizontal

```mermaid
sequenceDiagram
  participant page as "Your page"
  participant line as "Divider"
  participant label as "Label"
  page->>line: The page places a divider. It is horizontal and announced as a separator.
  page->>line: A label, if set, sits on that horizontal line. Inset and dashed or dotted styles stay on t
```

### Vertical

```mermaid
sequenceDiagram
  participant page as "Your page"
  participant line as "Divider"
  page->>line: The page asks for vertical. The parent must have a height, or the line has nothing to stre
  line->>line: A label is not used on a vertical line.
```

### Skeleton

```mermaid
sequenceDiagram
  participant page as "Your page"
  participant skeleton as "Skeleton"
  participant line as "Divider"
  page->>skeleton: The page shows a skeleton. The divider is busy and is not the real rule yet.
  page->>line: Ready. The skeleton leaves and the rule is shown.
```

## 5. States

- Horizontal (default) or vertical.
- Solid, dashed, or dotted.
- With or without a label (label is horizontal only).
- Inset, or full bleed.
- Skeleton while loading.

## 6. Easy to get wrong

- A vertical divider in a parent with no height will not show. Give the parent a height.
- Do not put a label on a vertical divider.

## 7. Files

- `pixel-divider.scss`
- `pixel-divider.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
