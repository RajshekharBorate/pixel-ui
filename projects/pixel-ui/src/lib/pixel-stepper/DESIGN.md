# pixel-stepper — design

This page explains **pixel-stepper** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

A sequence of steps. Linear mode blocks later steps until earlier ones are done. Free mode lets the user jump. If an access check is required and none is provided, the step stays closed. The chrome does not have a skeleton mode.

| This piece does | It does not |
| --- | --- |
| Moves through steps in order or freely | Show a skeleton for the step chrome |
| Fails closed when access is required but missing | Treat orientation as a color. It is only layout |

## 2. Who talks to whom

The stepper is a list of steps. Linear mode walks them in order. Free mode lets the user jump. The orientation and the type are layout, not a color appearance. If a step is gated and the app has no authorization evaluator, the step fails closed. The chrome has no skeleton.

```mermaid
flowchart TB
  subgraph page [Your page]
    Steps[Steps]
    Mode[Linear or free]
    Gate[Optional access check]
  end
  subgraph stepper [Stepper]
    List[Step list]
  end
  Steps --> List
  Mode -->|in order| List
  Mode -->|jump| List
  Gate -->|no evaluator: fail closed| List
```

**How to read the picture**

- **Linear.** The user cannot skip ahead.
- **Free.** Any step can be chosen.
- **Access.** A protected step calls the evaluator. If the app never provided one, the step stays closed.
- **Labels** can collapse on their own when space is tight. That is layout, not a missing step.
- **No skeleton** on the stepper chrome. Load the steps before you render it, or accept the real labels.

## 3. Flows

### In order

1. Linear mode shows the current step. Later steps are not available yet.
2. The page marks the step complete and moves forward. The user cannot skip ahead.

### Jump around

1. Free mode lets the user activate any step from the keyboard list.
2. The page follows the selected index. Labels can collapse automatically when space is tight.

### Access missing

1. A step that requires access, with no evaluator provided, stays closed.
2. The user cannot open that step until the page provides a real decision.

## 4. Step by step

Section 3 is the short list. Each picture here is one of those flows, with the branch that changes what the developer must do. Read the note under the picture before copying the pattern.

### In order

```mermaid
sequenceDiagram
  actor User
  participant Stepper
  User->>Stepper: next
  Note over Stepper: the following step opens
  User->>Stepper: a later step
  Note over Stepper: skipped steps stay closed
```

Use linear when a later step is meaningless until the earlier ones are done.

### Jump around

```mermaid
sequenceDiagram
  actor User
  participant Stepper
  participant Page
  Page->>Stepper: free navigation
  User->>Stepper: any step
  Stepper->>Page: that step is current
```

Free mode is still a step list. It is not a set of tabs with hidden panels unless you build the panels that way.

### Access missing

```mermaid
sequenceDiagram
  participant Step
  participant App
  Step->>App: this step needs an access check
  alt the evaluator exists
    App->>Step: allow or deny
  else no evaluator
    Note over Step: fail closed
  end
```

Do not treat a missing evaluator as “allow”. Provide the evaluator in the app, or do not mark the step as gated.

## 5. States

- Current, complete, and upcoming.
- Linear lock on later steps.
- Free selection.
- Access fail-closed.

## 6. Easy to get wrong

- Orientation and type change layout, not the color set.
- There is no skeleton for the stepper chrome.
- A missing access evaluator does not mean "allow". It means the step stays shut.

## 7. Files

- `pixel-step-actions.ts`
- `pixel-step-content.ts`
- `pixel-step-header.html`
- `pixel-step-header.scss`
- `pixel-step-header.ts`
- `pixel-step-icon.ts`
- `pixel-step.ts`
- `pixel-stepper.html`
- `pixel-stepper.scss`
- `pixel-stepper.ts`
- `pixel-stepper.types.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
