# pixel-card — design

This page explains **pixel-card** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

A surface for a title, text, media, and actions. Empty slots disappear. If the whole card is the action, it behaves like a button. Do not put other buttons inside an interactive card.

| This piece does | It does not |
| --- | --- |
| Groups content on a surface | Trap focus (it is not a dialog) |
| Can be selectable or fully clickable | Keep showing a header when there is no title |

## 2. Who talks to whom

```mermaid
flowchart LR
  page["Your page"]
  card["Card"]
  header["Header"]
  body["Body"]
  press["Interactive"]
  skeleton["Skeleton"]
  page --> card
  card --> header
  card --> body
  card --> press
  press --> page
  card --> page
  page --> skeleton
```

## 3. Flows

### Read-only card

1. The page sets a title and body. The header appears only when there is a title or subtitle.
2. Empty slots collapse. Actions in the card are their own buttons.

### The card is the action

1. The page marks the card interactive. Enter on keydown and Space on keyup activate it, like a button.
2. The user activates it. Do not nest another button, link, or input inside this card.

### Selectable

1. Selectable and interactive together use a pressed state so the user can tell it is on.
2. The page stores selected. The card does not keep a private copy.

### Skeleton

1. While loading, the skeleton replaces the card. The card is not a button and has no tab stop.
2. Content arrives. The skeleton leaves and the card returns.

## 4. Step by step

### Read-only card

```mermaid
sequenceDiagram
  participant page as "Your page"
  participant card as "Card"
  participant header as "Header"
  participant body as "Body"
  page->>card: The page sets a title and body. The header appears only when there is a title or subtitle.
  card->>card: Empty slots collapse. Actions in the card are their own buttons.
```

### The card is the action

```mermaid
sequenceDiagram
  participant page as "Your page"
  participant card as "Card"
  participant press as "Interactive"
  page->>card: The page marks the card interactive. Enter on keydown and Space on keyup activate it, like
  press->>page: The user activates it. Do not nest another button, link, or input inside this card.
```

### Selectable

```mermaid
sequenceDiagram
  participant page as "Your page"
  participant card as "Card"
  page->>card: Selectable and interactive together use a pressed state so the user can tell it is on.
  card->>page: The page stores selected. The card does not keep a private copy.
```

### Skeleton

```mermaid
sequenceDiagram
  participant page as "Your page"
  participant skeleton as "Skeleton"
  participant card as "Card"
  participant body as "Body"
  page->>skeleton: While loading, the skeleton replaces the card. The card is not a button and has no tab sto
  page->>card: Content arrives. The skeleton leaves and the card returns.
```

## 5. States

- Static surface with only the slots that have content.
- Interactive: one button for the whole card.
- Selectable: pressed when the page says it is selected.
- Skeleton: no role and no tab stop until content is ready.

## 6. Easy to get wrong

- Never nest a button, link, or input inside an interactive card. The card already is the control.
- Do not show a header for a card with no title and no subtitle.

## 7. Files

- `pixel-card.html`
- `pixel-card.scss`
- `pixel-card.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
