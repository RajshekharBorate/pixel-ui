# pixel-chart-bar — design

This page explains **pixel-chart-bar** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

Columns or horizontal bars for categories. Modes are single, grouped, stacked, and 100 percent stacked. Value labels hide automatically when there are too many cells. Drill-down is owned by the page: the chart only reports the click.

| This piece does | It does not |
| --- | --- |
| Draws its series through the shared chart host | Ship inside the main barrel. Import from pixel-ui/charts |
| Compares categories | Navigate to the next drill level. The page does that |

## 2. Who talks to whom

```mermaid
flowchart LR
  page["Your page"]
  plot["pixel-chart-bar"]
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

### Drill-down

1. A click reports the point. The page pushes a drill level and rebinds categories and series.
2. The breadcrumb lives in the chart header slot. Hide it at the root. Keyboard users use the shell table path. The click is pointer-oriented.

## 4. Step by step

### Draw

```mermaid
sequenceDiagram
  participant page as "Your page"
  participant plot as "pixel-chart-bar"
  participant host as "Chart host"
  participant theme as "Theme"
  page->>plot: The page passes data. The plot registers only its chart modules, then the host draws.
  theme->>host: Colors come from the theme bridge, so light and dark follow the page tokens.
```

### No data

```mermaid
sequenceDiagram
  participant page as "Your page"
  participant plot as "pixel-chart-bar"
  participant host as "Chart host"
  page->>plot: An empty series should show the shell empty state, not a blank card.
  page->>plot: When data arrives, the host draws again.
```

### Resize

```mermaid
sequenceDiagram
  participant host as "Chart host"
  participant plot as "pixel-chart-bar"
  participant theme as "Theme"
  host->>plot: The container changes size.
  theme->>host: A theme change redraws with the new tokens.
```

### Drill-down

```mermaid
sequenceDiagram
  participant plot as "pixel-chart-bar"
  participant click as "Point click"
  participant page as "Your page"
  plot->>click: A click reports the point.
  page->>plot: The breadcrumb lives in the chart header slot.
```

## 5. States

- Loading or skeleton, usually from the shell.
- Empty.
- Drawn.
- Resized or themed again.
- Stacked or percent mode.
- Value labels hidden when the grid is dense.

## 6. Easy to get wrong

- Import from pixel-ui/charts.
- Defer charts that start off screen. Give the placeholder a size so the page does not jump.
- Do not let the chart own navigation. Handle the click in the page.
- A hidden series keeps its color. Do not recolor the remaining bars.

## 7. Files

- `pixel-chart-bar.html`
- `pixel-chart-bar.scss`
- `pixel-chart-bar.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
