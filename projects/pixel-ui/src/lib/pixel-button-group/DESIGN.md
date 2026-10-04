# pixel-button-group — design

This page explains **pixel-button-group** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

A row or column of pixel-button controls that belong together. The group is a label for the set. Each button still owns its own click, loading, and pressed state.

| This piece does | It does not |
| --- | --- |
| Groups related buttons | Replace each button’s own disabled or loading state |
| Can disable the whole group visually | Remove buttons from the accessibility tree by itself |

## 2. Who talks to whom

The group is only a label for a set of buttons. Each button still owns its own click, loading, and pressed state. Disabling the group stops the pointer. It does not, by itself, tell a screen reader that the buttons are off.

```mermaid
flowchart TB
  subgraph page [Your page]
    List[Which buttons belong together]
    Off[Whether the whole set is off]
  end
  subgraph group [Button group]
    Name[Group name]
  end
  subgraph children [Each pixel-button]
    One[First action]
    Two[Second action]
  end
  List --> Name
  Name --> One
  Name --> Two
  Off -->|pointer only| group
  Off -->|also set disabled on each child| children
```

**How to read the picture**

- **Page → group.** The group announces the set. It does not replace the buttons.
- **Group → each button.** A press hits one button. The other buttons do not change.
- **Disable the set.** Turning the group off blocks the pointer. Also disable each child, or a screen reader can still reach an enabled button inside a group that only looks off.

## 3. Flows

### A set of actions

1. The page puts two or more buttons in the group. The group is announced as a group.
2. The user presses one button. Only that button reports the click. The other button is unchanged.

### Disable the set

1. The page disables the group. Pointers cannot hit the buttons.
2. Also disable each button. Otherwise a screen reader can still reach an enabled button inside a group that only looks off.

## 4. Step by step

Section 3 is the short list. Each picture here is one of those flows, with the branch that changes what the developer must do. Read the note under the picture before copying the pattern.

### A set of actions

```mermaid
sequenceDiagram
  participant Page
  participant Group as Button group
  participant One as One button
  participant Two as Another button
  Page->>Group: related buttons
  Group->>One: first action
  Group->>Two: second action
  One->>Page: only this click
  Note over Two: the other button is unchanged
```

Use the group when the actions belong together, such as a toolbar cluster. Do not make the group itself the button. Each action stays a pixel-button, with its own loading and toggle.

### Disable the set

```mermaid
sequenceDiagram
  participant Page
  participant Group as Button group
  participant One as One button
  participant Two as Another button
  Page->>Group: group disabled
  Note over Group: pointer cannot hit the children
  Page->>One: disable this button too
  Page->>Two: disable this button too
```

The group flag is visual and pointer-only. Assistive tech still walks the children. Disable every pixel-button in the set when the whole set is unavailable.

## 5. States

- Each child button still has its own hover, focus, loading, pressed, and disabled states.
- A disabled group blocks the pointer. Disable the children too so assistive tech matches.

## 6. Easy to get wrong

- Do not rely on the group disabled flag alone for screen readers. Disable each pixel-button as well.
- Do not use the group as one big button. Each action stays its own button.

## 7. Files

- `pixel-button-group.html`
- `pixel-button-group.scss`
- `pixel-button-group.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
