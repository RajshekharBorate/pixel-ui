# pixel-chart-area — design

This page explains **pixel-chart-area** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

A filled line. It follows the same host, theme, time axis, and large-series rules as the line chart. Stacked areas add the series together.

| This piece does | It does not |
| --- | --- |
| Draws its series through the shared chart host | Ship inside the main barrel. Import from pixel-ui/charts |
| Shows volume under a line | Use a separate color system. Colors come from the theme |

## 2. Who talks to whom

```mermaid
flowchart LR
  page["Your page"]
  plot["pixel-chart-area"]
  host["Chart host"]
  theme["Theme"]
  page --> plot
  plot --> host
  theme --> host
  host --> plot
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

## 4. Step by step

### Draw

```mermaid
sequenceDiagram
  participant page as "Your page"
  participant plot as "pixel-chart-area"
  participant host as "Chart host"
  participant theme as "Theme"
  page->>plot: The page passes data. The plot registers only its chart modules, then the host draws.
  theme->>host: Colors come from the theme bridge, so light and dark follow the page tokens.
```

### No data

```mermaid
sequenceDiagram
  participant page as "Your page"
  participant plot as "pixel-chart-area"
  participant host as "Chart host"
  page->>plot: An empty series should show the shell empty state, not a blank card.
  page->>plot: When data arrives, the host draws again.
```

### Resize

```mermaid
sequenceDiagram
  participant host as "Chart host"
  participant plot as "pixel-chart-area"
  participant theme as "Theme"
  host->>plot: The container changes size.
  theme->>host: A theme change redraws with the new tokens.
```

## 5. States

- Loading or skeleton, usually from the shell.
- Empty.
- Drawn.
- Resized or themed again.
- Stacked area.

## 6. Easy to get wrong

- Import from pixel-ui/charts.
- Defer charts that start off screen. Give the placeholder a size so the page does not jump.
- Treat area like line for time axes and sampling. Do not invent a second host.

## 7. Files

- `pixel-chart-area.html`
- `pixel-chart-area.scss`
- `pixel-chart-area.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
