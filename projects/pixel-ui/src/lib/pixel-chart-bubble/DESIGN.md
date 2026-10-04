# pixel-chart-bubble — design

This page explains **pixel-chart-bubble** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

Scatter points with a size. The page supplies x, y, and size. Clicks report the point. The shell can still hide a series from the legend.

| This piece does | It does not |
| --- | --- |
| Draws its series through the shared chart host | Ship inside the main barrel. Import from pixel-ui/charts |
| Encodes a third value as size | Drop the size and pretend it is a plain scatter |

## 2. Who talks to whom

```mermaid
flowchart LR
  page["Your page"]
  plot["pixel-chart-bubble"]
  host["Chart host"]
  theme["Theme"]
  click["Point click"]
  page --> plot
  plot --> host
  theme --> host
  host --> plot
  plot --> click
  click --> page
```

## 3. Flows

### Draw

1. The page passes data. The plot registers only its chart modules, then the host draws.
2. Colors come from the theme bridge, so light and dark follow the page tokens.

### No data

1. An empty series should show the shell empty state, not a blank card.
2. When data arrives, the host draws again.

### Resize

1. The container changes size. The host resizes the canvas. Below-the-fold charts should defer until they are near the screen, with a sized placeholder.
2. A theme change redraws with the new tokens. Dispose happens when the view goes away.

### Point click

1. The page passes points that include a size. The host draws the bubbles.
2. A click reports the point. The page decides what happens next.

## 4. Step by step

### Draw

```mermaid
sequenceDiagram
  participant page as "Your page"
  participant plot as "pixel-chart-bubble"
  participant host as "Chart host"
  participant theme as "Theme"
  page->>plot: The page passes data. The plot registers only its chart modules, then the host draws.
  theme->>host: Colors come from the theme bridge, so light and dark follow the page tokens.
```

### No data

```mermaid
sequenceDiagram
  participant page as "Your page"
  participant plot as "pixel-chart-bubble"
  participant host as "Chart host"
  page->>plot: An empty series should show the shell empty state, not a blank card.
  page->>plot: When data arrives, the host draws again.
```

### Resize

```mermaid
sequenceDiagram
  participant host as "Chart host"
  participant plot as "pixel-chart-bubble"
  participant theme as "Theme"
  host->>plot: The container changes size. The host resizes the canvas. Below-the-fold charts should defe
  theme->>host: A theme change redraws with the new tokens. Dispose happens when the view goes away.
```

### Point click

```mermaid
sequenceDiagram
  participant page as "Your page"
  participant plot as "pixel-chart-bubble"
  participant host as "Chart host"
  participant click as "Point click"
  page->>plot: The page passes points that include a size. The host draws the bubbles.
  plot->>click: A click reports the point. The page decides what happens next.
```

## 5. States

- Loading or skeleton, usually from the shell.
- Empty.
- Drawn.
- Resized or themed again.

## 6. Easy to get wrong

- Import from pixel-ui/charts.
- Defer charts that start off screen. Give the placeholder a size so the page does not jump.
- Size is data. Do not reuse the scatter facade when the third value matters.

## 7. Files

- `pixel-chart-bubble.html`
- `pixel-chart-bubble.scss`
- `pixel-chart-bubble.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
