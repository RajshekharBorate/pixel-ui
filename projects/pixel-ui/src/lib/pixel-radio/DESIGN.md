# pixel-radio — design

This page explains **pixel-radio** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

A set of options where one is selected. The group owns the value, the arrow keys, and the form binding. Each radio is an option inside that group.

| This piece does | It does not |
| --- | --- |
| Picks one option in a group | Pick many (use pixel-checkbox) |
| Moves with arrow keys | Change the value while readonly |

## 2. Who talks to whom

The group owns the one selected value, the arrow keys, and the form binding. Each radio is only an option. Readonly can be focused and does not change. Disabled options are skipped.

```mermaid
flowchart TB
  subgraph page [Your page]
    Value[One value]
  end
  subgraph group [Radio group]
    Keys[Arrow keys]
    Form[The form control]
  end
  subgraph option [One option]
    Radio[A radio]
  end
  Value --> group
  group --> Radio
  Keys --> group
  Radio -->|click or Space| group
  group -->|one value| Form
```

**How to read the picture**

- **Bind the value on the group.** A single radio does not own the selection.
- **Arrows move and select.** Disabled options are skipped.
- **Readonly versus disabled.** Readonly can take focus and does not change the value. Disabled options cannot be chosen.

## 3. Flows

### Pick one

1. The page lists options and sets the current value on the group.
2. The user clicks an option or presses Space. The group updates the single value.

### Arrow keys

1. Arrow keys move between options and select the next one. Disabled options are skipped.
2. The form sees one value for the group, not one value per option.

### Readonly or disabled

1. Readonly can be focused but does not change the value. Disabled options are skipped and cannot be chosen.
2. No new value is written.

## 4. Step by step

Section 3 is the short list. Each picture here is one of those flows, with the branch that changes what the developer must do. Read the note under the picture before copying the pattern.

### Pick one

```mermaid
sequenceDiagram
  actor User
  participant Group as Radio group
  participant Page
  Page->>Group: options and the current value
  User->>Group: click or Space
  Group->>Page: the single new value
```

The form sees one control, the group. Do not bind a separate form control on each radio.

### Arrow keys

```mermaid
sequenceDiagram
  actor User
  participant Group as Radio group
  User->>Group: arrow
  alt the next option is disabled
    Group->>Group: skip it
  else it can be chosen
    Group->>Group: select it
  end
```

Arrow keys both move and select. That is the radio pattern. Do not require a second Enter to commit.

### Readonly or disabled

```mermaid
sequenceDiagram
  participant Page
  participant Group as Radio group
  alt readonly
    Page->>Group: focus, no new value
  else an option is disabled
    Note over Group: that option is skipped
  end
```

A readonly group is still announced. It just refuses the change.

## 5. States

- None selected, or one selected.
- Disabled option: skipped.
- Readonly group: focusable, no change.
- Error on the group when the form is invalid.

## 6. Easy to get wrong

- Bind the value on the group. A single radio does not own the selection.
- Readonly and disabled are different. Readonly still allows focus.

## 7. Files

- `pixel-radio-group.html`
- `pixel-radio-group.ts`
- `pixel-radio.html`
- `pixel-radio.scss`
- `pixel-radio.shared.ts`
- `pixel-radio.tokens.ts`
- `pixel-radio.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
