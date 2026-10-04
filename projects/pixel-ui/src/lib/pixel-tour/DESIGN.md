# pixel-tour — design

This page explains **pixel-tour** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

A guided spotlight over the page. start() stops any tour already running, remembers focus, and shows a card in a shared overlay with the current theme. It is not a wizard. Wizards do not start a tour by themselves.

| This piece does | It does not |
| --- | --- |
| Walks the user through anchors on the page | Replace a multi-step form (that is a wizard or pixel-stepper) |
| Traps focus in the tour card | Leave a previous tour running when a new one starts |

## 2. Who talks to whom

```mermaid
flowchart LR
  page["Your page"]
  tour["Tour"]
  spot["Spotlight"]
  card["Card"]
  focus["Saved focus"]
  page --> tour
  tour --> focus
  tour --> spot
  tour --> card
  card --> tour
```

## 3. Flows

### Start

1. The page calls start(). Any running tour stops. Focus is snapshotted.
2. The overlay highlights the step target and shows the card. The theme is copied onto the overlay. The card traps focus. The dialog itself is not a full-page modal.

### Next and back

1. Arrow keys or the card buttons move to the next or previous step. The spotlight follows.
2. Escape aborts. Finish also ends the tour. Focus returns to the element that had it before the tour.

### Custom card

1. The page can bring its own card, or use the headless mode and render the step itself.
2. The spotlight and the step order still belong to the tour.

## 4. Step by step

### Start

```mermaid
sequenceDiagram
  participant page as "Your page"
  participant tour as "Tour"
  participant focus as "Saved focus"
  participant spot as "Spotlight"
  participant card as "Card"
  page->>tour: The page calls start(). Any running tour stops. Focus is snapshotted.
  tour->>spot: The overlay highlights the step target and shows the card. The theme is copied onto the ov
```

### Next and back

```mermaid
sequenceDiagram
  participant card as "Card"
  participant tour as "Tour"
  participant spot as "Spotlight"
  participant focus as "Saved focus"
  card->>tour: Arrow keys or the card buttons move to the next or previous step. The spotlight follows.
  tour->>focus: Escape aborts. Finish also ends the tour. Focus returns to the element that had it before 
```

### Custom card

```mermaid
sequenceDiagram
  participant page as "Your page"
  participant tour as "Tour"
  participant card as "Card"
  participant spot as "Spotlight"
  page->>tour: The page can bring its own card, or use the headless mode and render the step itself.
  tour->>spot: The spotlight and the step order still belong to the tour.
```

## 5. States

- Idle.
- Running: spotlight, card, focus trapped in the card.
- Aborted with Escape, or finished on the last step.
- Focus restored to the pre-tour element.

## 6. Easy to get wrong

- A wizard is not a tour. Do not auto-start a tour from a wizard.
- start() replaces the current tour. It does not stack a second one.
- Escape aborts and gives focus back. Do not drop the user on the body.

## 7. Files

- `_pixel-tour-panel-host.scss`
- `pixel-tour-anchor.ts`
- `pixel-tour-card.html`
- `pixel-tour-card.scss`
- `pixel-tour-card.ts`
- `pixel-tour-controls.html`
- `pixel-tour-controls.scss`
- `pixel-tour-controls.ts`
- `pixel-tour-custom-card.html`
- `pixel-tour-custom-card.scss`
- `pixel-tour-custom-card.ts`
- `pixel-tour-panel-body.ts`
- `pixel-tour-panel-controller.ts`
- `pixel-tour-panel-position.ts`
- `pixel-tour-panel-ref-bridge.ts`
- `pixel-tour-panel.providers.ts`
- `pixel-tour-panel.ts`
- `pixel-tour-ref.ts`
- `pixel-tour-spotlight.scss`
- `pixel-tour-spotlight.ts`
- `pixel-tour.service.ts`
- `pixel-tour.types.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
