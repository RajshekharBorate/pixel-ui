# pixel-chart-shell — design

This page explains **pixel-chart-shell** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

The card around a chart: title, description, legend, export, and fullscreen. The card itself is not clickable, because the shell already contains buttons. There is no inline data table. CSV is a download. Loading, skeleton, and empty states live here. The plot (bar, line, and the rest) is projected inside.

| This piece does | It does not |
| --- | --- |
| Wraps a projected plot with title, legend, and export | Draw the series. The plot does that |
| Toggles series and can expand to fullscreen | Show an inline data table |
| Shows loading, skeleton, and empty | Use the values toggle on a gauge or a sparkline |

## 2. Who talks to whom

The shell is the card around a plot: title, description, legend, export, and fullscreen. The card is not a button, because the shell already contains buttons. There is no inline data table. CSV is a download. Loading, skeleton, and empty live here. The plot is projected inside.

```mermaid
flowchart TB
  subgraph page [Your page]
    Plot[The projected plot]
  end
  subgraph shell [Chart shell]
    Title[Title and description]
    Legend[Legend]
    File[Export download]
    Full[Fullscreen]
  end
  Plot --> shell
  Legend -->|series id and visible, never the series name| page
  File -->|download, not an inline table| page
  Full --> Plot
```

**How to read the picture**

- **Project the plot.** The shell does not draw the series.
- **The card is not clickable.** Do not turn the shell into an interactive card.
- **Legend toggle** can be recorded as the chart id, the series id, and whether it is visible. Never the series name.
- **show values** on the shell must match the plot, except gauge and sparkline, which do not use that toggle.
- **Export** downloads a file. It does not render a table under the chart.

## 3. Flows

### Show a chart

1. The page projects a plot into the shell. The shell card stays non-interactive so its buttons and menus work.
2. While data is loading, the shell shows a loader or a skeleton. An empty series shows the empty state, not a blank card.

### Legend

1. The user toggles a series. The plot hides it. Colors stay tied to the original series list.
2. Analytics, if on, records the chart id, the series id, and visible or hidden. It does not record the series name.

### Export and expand

1. The more menu can show or hide values, and can download PNG, SVG, or CSV. Gauge and sparkline do not use the values toggle.
2. Expand uses fullscreen on the shell. Escape leaves it. Menus remount inside the fullscreen element so they stay visible.

## 4. Step by step

Section 3 is the short list. Each picture here is one of those flows, with the branch that changes what the developer must do. Read the note under the picture before copying the pattern.

### Show a chart

```mermaid
sequenceDiagram
  participant Page
  participant Shell as Chart shell
  participant Plot
  Page->>Shell: title and the projected plot
  alt loading or skeleton
    Note over Shell: the shell shows that state
  else there is no data
    Note over Shell: the empty state
  else data is ready
    Shell->>Plot: the plot draws inside the card
  end
```

Keep loading and empty on the shell. The plot should not invent a second empty card.

### Legend

```mermaid
sequenceDiagram
  actor User
  participant Shell as Chart shell
  participant Plot
  User->>Shell: toggle a series
  Shell->>Plot: that series is shown or hidden
  Note over Shell: analytics is the chart id, the series id, and visible
  Note over Plot: a hidden series keeps its color
```

Do not recolor the remaining series when one is hidden. The color stays tied to the series.

### Export and expand

```mermaid
sequenceDiagram
  actor User
  participant Shell as Chart shell
  User->>Shell: export
  Note over Shell: a file download, not an inline table
  User->>Shell: expand
  Note over Shell: fullscreen
  Note over Shell: gauge and sparkline do not use the values toggle
```

Bind show-values on the shell to the same input on the plot when the plot supports it. Skip that bind for a gauge or a sparkline.

## 5. States

- Loading or skeleton.
- Empty.
- Drawn, with legend items shown or hidden.
- Fullscreen.

## 6. Easy to get wrong

- Import from pixel-ui/charts.
- The shell card is not clickable. Do not make the card the button.
- Bind show-values on the shell to the same input on the plot. Skip that bind for gauge and sparkline.
- There is no inline table. CSV is a download.

## 7. Files

- `pixel-chart-shell.html`
- `pixel-chart-shell.scss`
- `pixel-chart-shell.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
