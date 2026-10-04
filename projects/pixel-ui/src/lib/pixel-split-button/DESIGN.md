# pixel-split-button — design

This page explains **pixel-split-button** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

One control with two parts: the main action, and a small arrow that opens a menu. The menu is a sibling pixel-menu. The arrow does not run the main action.

| This piece does | It does not |
| --- | --- |
| Runs the main action from the large part | Put the menu items inside the button |
| Opens the menu from the arrow | Run the main action when the arrow is pressed |

## 2. Who talks to whom

```mermaid
flowchart LR
  page["Your page"]
  split["Split button"]
  main["Main segment"]
  caret["Arrow"]
  menu["Menu"]
  page --> split
  split --> main
  main --> page
  caret --> menu
  menu --> page
  split --> caret
```

## 3. Flows

### Main action

1. The page sets the main label. The large part is the action.
2. The user clicks the large part. The page runs that action. The menu stays closed.

### Open the menu

1. The user clicks the arrow, or uses the keyboard on it. The sibling menu opens.
2. The user picks an item. The page handles that item. The main action does not run.

### Loading or disabled

1. Loading or disabled turns off both parts.
2. The user cannot run the action or open the menu until the page clears that state.

## 4. Step by step

### Main action

```mermaid
sequenceDiagram
  participant page as "Your page"
  participant split as "Split button"
  participant main as "Main segment"
  page->>split: The page sets the main label.
  main->>page: The user clicks the large part.
```

### Open the menu

```mermaid
sequenceDiagram
  participant caret as "Arrow"
  participant menu as "Menu"
  participant page as "Your page"
  caret->>menu: The user clicks the arrow, or uses the keyboard on it.
  menu->>page: The user picks an item. The page handles that item. The main action does not run.
```

### Loading or disabled

```mermaid
sequenceDiagram
  participant page as "Your page"
  participant split as "Split button"
  participant main as "Main segment"
  participant caret as "Arrow"
  page->>split: Loading or disabled turns off both parts.
  split->>split: The user cannot run the action or open the menu until the page clears that state.
```

## 5. States

- Default: both parts ready.
- Menu open: the arrow has expanded the menu.
- Loading or disabled: both the main part and the arrow are off.

## 6. Easy to get wrong

- Do not put pixel-menu inside the button. Place it as a sibling and point the split button at it.
- Do not expect the arrow click to emit the main action.

## 7. Files

- `pixel-split-button.html`
- `pixel-split-button.scss`
- `pixel-split-button.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
