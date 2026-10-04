# pixel-input — design

This page explains **pixel-input** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

A single text field with a label, helper text, and errors. It works with reactive forms and template forms. The label can sit on top, on the left, float, or be hidden (still named for screen readers).

| This piece does | It does not |
| --- | --- |
| Edits one text value | Pick from a list (use pixel-select or pixel-autocomplete) |
| Shows required, error, and loading | Clear the field unless the page asks for a clear button |

## 2. Who talks to whom

The host is the field. The page owns the value through the form. The label always names the field, even when it is visually hidden. The clear button is off until the page asks for it. Loading covers the field, but it does not block typing unless the page also disables the field while loading.

```mermaid
flowchart TB
  subgraph page [Your page]
    Value[Form value]
    LabelPos[Label: top, left, floating, or hidden]
    Busy[Loading, and whether typing stops]
  end
  subgraph field [Input]
    Native[The text field]
    Error[Error text tied to the field]
    Clear[Clear button, only if asked]
    Spinner[Spinner over the field]
  end
  Value --> Native
  LabelPos --> Native
  Native -->|typed value| Value
  Busy --> Spinner
  Busy -->|only if disable-while-loading| Native
  Clear -->|empties the value| Native
```

**How to read the picture**

- **Label.** Top is the default. A left label stacks under the field on a narrow screen. Hidden still names the field for screen readers.
- **Empty is valid** unless the field is required.
- **Clear.** It appears only when show-clear is on and the field has text.
- **Loading.** The spinner is not inferred from the form, except a pending async validator can show the same spinner. Typing stays possible until the page disables the field while loading.
- **Nested errors.** A nested field inherits the parent errors only when that option is on.

## 3. Flows

### Type

1. The page sets the label. Top is the default. Left stacks under the field on a narrow screen. Hidden still names the field.
2. The user types. The form value updates. Empty is valid unless the field is required.

### Error

1. The form marks the control touched and invalid. The error text is shown and tied to the field.
2. A nested field can inherit the parent errors only when that option is on. Otherwise it keeps its own errors.

### Clear

1. The clear button appears only when the page turns it on and the field has text.
2. The user clears it. The value becomes empty.

### Loading

1. The page turns loading on, or the form is still checking the value. A spinner covers the field. Typing still works unless the page also disables the field while loading.
2. When loading ends, the spinner goes away.

## 4. Step by step

Section 3 is the short list. Each picture here is one of those flows, with the branch that changes what the developer must do. Read the note under the picture before copying the pattern.

### Type

```mermaid
sequenceDiagram
  participant Page
  participant Input
  participant Form
  Page->>Input: label and value
  Input->>Form: each change
  Note over Form: empty is valid unless required
```

Bind the form to this field. Do not read the value only from the DOM. Left labels need room below the field on a small screen.

### Error

```mermaid
sequenceDiagram
  participant Form
  participant Input
  Form->>Input: touched and invalid
  Input->>Input: show the error and point the field at it
  opt a nested field should inherit parent errors
    Note over Input: only when that option is on
  end
```

The error text is connected to the field. Do not assume a child control shows the parent message unless inheritance is turned on.

### Clear

```mermaid
sequenceDiagram
  actor User
  participant Input
  participant Page
  Page->>Input: show clear, and the field has text
  User->>Input: press clear
  Input->>Page: the value is empty
  Note over Input: no clear button when the option is off
```

Clear is opt-in. An empty field does not show the button even when the option is on.

### Loading

```mermaid
sequenceDiagram
  participant Page
  participant Input
  Page->>Input: loading, or the form is still checking
  Note over Input: a spinner covers the field
  alt the page also disables while loading
    Note over Input: typing stops
  else that flag is off
    Note over Input: typing still works
  end
  Page->>Input: loading ends
  Note over Input: the spinner leaves
```

Do not treat the spinner as a disabled field. The default is overlay only. Turn on disable-while-loading when the user must wait.

## 5. States

- Empty, filled, focused, disabled, and readonly.
- Required. Empty is valid until required says otherwise.
- Error after the form says the control is invalid.
- Loading overlay while the page is busy.
- Label positions: top, left, floating, or hidden.

## 6. Easy to get wrong

- The clear button is off until the page sets it. Do not expect it by default.
- Left labels wrap below the field on small screens. Plan for that stack.
- Do not treat a nested control as inheriting parent errors unless that option is on.

## 7. Files

- `pixel-input.html`
- `pixel-input.scss`
- `pixel-input.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
