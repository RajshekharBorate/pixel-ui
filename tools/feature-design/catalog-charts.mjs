import { feature, n, st } from './helpers.mjs';

const lib = 'projects/pixel-ui/src/lib';

function chart(dir, title, summary, extraDoes, extraNodes, extraStories, extraStates, extraMistakes) {
  return feature({
    dir: `${lib}/${dir}`,
    title,
    summary,
    does: [
      ['Draws its series through the shared chart host', 'Ship inside the main barrel. Import from pixel-ui/charts'],
      ...(extraDoes || []),
    ],
    nodes: [
      n('page', 'Your page', 'Passes the data', null, 0, 0),
      n('plot', title, 'The series', title, 1, 0),
      n('host', 'Chart host', 'Draws and resizes', 'pixel-chart-host', 2, 0),
      n('theme', 'Theme', 'Reads system tokens', 'pixel-chart-theme', 3, 0),
      ...(extraNodes || []),
    ],
    stories: {
      draw: {
        label: 'Draw',
        steps: [
          st(['page', 'plot', 'host'], ['page>plot', 'plot>host'], 'The page passes data. The plot registers only its chart modules, then the host draws.'),
          st(['theme', 'host'], ['theme>host'], 'Colors come from the theme bridge, so light and dark follow the page tokens.'),
        ],
      },
      empty: {
        label: 'No data',
        steps: [
          st(['page', 'plot'], ['page>plot'], 'An empty series should show the shell empty state, not a blank card.', ['host']),
          st(['page', 'plot', 'host'], ['page>plot', 'plot>host'], 'When data arrives, the host draws again.'),
        ],
      },
      resize: {
        label: 'Resize',
        steps: [
          st(['host', 'plot'], ['host>plot'], 'The container changes size. The host resizes the canvas. Below-the-fold charts should defer until they are near the screen, with a sized placeholder.'),
          st(['theme', 'host'], ['theme>host'], 'A theme change redraws with the new tokens. Dispose happens when the view goes away.'),
        ],
      },
      ...(extraStories || {}),
    },
    states: [
      'Loading or skeleton, usually from the shell.',
      'Empty.',
      'Drawn.',
      'Resized or themed again.',
      ...(extraStates || []),
    ],
    mistakes: [
      'Import from pixel-ui/charts.',
      'Defer charts that start off screen. Give the placeholder a size so the page does not jump.',
      ...(extraMistakes || []),
    ],
  });
}

export const chartFeatures = [
  feature({
    dir: `${lib}/pixel-chart`,
    title: 'pixel-chart',
    summary: 'The shared chart core: a host that creates and destroys the canvas, a theme bridge from the design tokens, and register functions so each chart type loads only its own modules. Facades such as bar and line sit on top of this. Sparkline does not use this canvas.',
    does: [
      ['Hosts the canvas, theme, and resize lifecycle', 'Render a sparkline. That one is custom SVG'],
      ['Registers series modules on demand', 'Import ECharts from the main component barrel as the preferred path'],
    ],
    nodes: [
      n('page', 'Your page', 'May pass raw options', null, 0, 0),
      n('host', 'Chart host', 'Init, draw, resize, dispose', 'pixel-chart-host', 1, 0),
      n('theme', 'Theme', 'Tokens to chart colors', 'pixel-chart-theme', 2, 0),
      n('mod', 'Series modules', 'Loaded per type', null, 3, 0),
    ],
    stories: {
      draw: {
        label: 'Draw',
        steps: [
          st(['page', 'host', 'mod'], ['page>host', 'mod>host'], 'A facade or the page registers the modules it needs, then the host draws the options.'),
          st(['theme', 'host'], ['theme>host'], 'The theme bridge maps the system tokens. Light and dark come from those tokens.'),
        ],
      },
      resize: {
        label: 'Resize and dispose',
        steps: [
          st(['host'], [], 'The container changes size. The host resizes. A large series can switch to progressive draw or sampling when it crosses the thresholds.'),
          st(['host'], [], 'When the view is destroyed, the host disposes the canvas. A chart below the fold should wait until it is near the screen.'),
        ],
      },
      time: {
        label: 'Time axis',
        steps: [
          st(['page', 'host'], ['page>host'], 'A line can use a time axis with real dates. Labels use the date adapter when one is provided.'),
          st(['host'], [], 'Free-text categories such as "Q1" stay as typed. Do not pass Angular format names like mediumDate. Use a pattern, Intl options, a function, or null.', ['theme']),
        ],
      },
    },
    states: [
      'Not created yet.',
      'Drawn.',
      'Progressive or sampled when the point count is high.',
      'Disposed.',
    ],
    mistakes: [
      'Prefer import from pixel-ui/charts.',
      'Sparkline is SVG and does not use this host.',
      'Do not pass Angular named date formats to the axis.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-chart-shell`,
    title: 'pixel-chart-shell',
    summary: 'The card around a chart: title, description, legend, export, and fullscreen. The card itself is not clickable, because the shell already contains buttons. There is no inline data table. CSV is a download. Loading, skeleton, and empty states live here. The plot (bar, line, and the rest) is projected inside.',
    does: [
      ['Wraps a projected plot with title, legend, and export', 'Draw the series. The plot does that'],
      ['Toggles series and can expand to fullscreen', 'Show an inline data table'],
      ['Shows loading, skeleton, and empty', 'Use the values toggle on a gauge or a sparkline'],
    ],
    nodes: [
      n('page', 'Your page', 'Projects a plot', null, 0, 0),
      n('shell', 'Chart shell', 'The card', 'pixel-chart-shell', 1, 0),
      n('plot', 'Plot', 'Bar, line, or other', null, 2, 0),
      n('legend', 'Legend', 'Shows or hides a series', null, 3, 0),
      n('menu', 'More menu', 'Values and download', null, 1, 1),
      n('state', 'Empty or loading', 'Shell states', null, 2, 1),
    ],
    stories: {
      show: {
        label: 'Show a chart',
        steps: [
          st(['page', 'shell', 'plot'], ['page>shell', 'shell>plot'], 'The page projects a plot into the shell. The shell card stays non-interactive so its buttons and menus work.'),
          st(['shell', 'state'], ['shell>state'], 'While data is loading, the shell shows a loader or a skeleton. An empty series shows the empty state, not a blank card.'),
        ],
      },
      legend: {
        label: 'Legend',
        steps: [
          st(['legend', 'plot'], ['legend>plot'], 'The user toggles a series. The plot hides it. Colors stay tied to the original series list.'),
          st(['legend'], [], 'Analytics, if on, records the chart id, the series id, and visible or hidden. It does not record the series name.', ['menu']),
        ],
      },
      export: {
        label: 'Export and expand',
        steps: [
          st(['menu', 'plot'], ['menu>plot'], 'The more menu can show or hide values, and can download PNG, SVG, or CSV. Gauge and sparkline do not use the values toggle.'),
          st(['menu', 'shell'], ['menu>shell'], 'Expand uses fullscreen on the shell. Escape leaves it. Menus remount inside the fullscreen element so they stay visible.'),
        ],
      },
    },
    states: [
      'Loading or skeleton.',
      'Empty.',
      'Drawn, with legend items shown or hidden.',
      'Fullscreen.',
    ],
    mistakes: [
      'Import from pixel-ui/charts.',
      'The shell card is not clickable. Do not make the card the button.',
      'Bind show-values on the shell to the same input on the plot. Skip that bind for gauge and sparkline.',
      'There is no inline table. CSV is a download.',
    ],
  }),

  chart(
    'pixel-chart-bar',
    'pixel-chart-bar',
    'Columns or horizontal bars for categories. Modes are single, grouped, stacked, and 100 percent stacked. Value labels hide automatically when there are too many cells. Drill-down is owned by the page: the chart only reports the click.',
    [
      ['Compares categories', 'Navigate to the next drill level. The page does that'],
    ],
    [n('click', 'Point click', 'The page drills', null, 1, 1)],
    {
      click: {
        label: 'Drill-down',
        steps: [
          st(['plot', 'click', 'page'], ['plot>click', 'click>page'], 'A click reports the point. The page pushes a drill level and rebinds categories and series.'),
          st(['page', 'plot'], ['page>plot'], 'The breadcrumb lives in the chart header slot. Hide it at the root. Keyboard users use the shell table path. The click is pointer-oriented.'),
        ],
      },
    },
    ['Stacked or percent mode.', 'Value labels hidden when the grid is dense.'],
    ['Do not let the chart own navigation. Handle the click in the page.', 'A hidden series keeps its color. Do not recolor the remaining bars.'],
  ),

  chart(
    'pixel-chart-line',
    'pixel-chart-line',
    'A line of points, including a time axis. Large series can sample or draw progressively. Point clicks are for the pointer. Keyboard access to the numbers is the shell, not the canvas.',
    [
      ['Shows a trend, including time', 'Sample a small series. Sampling starts at the documented threshold'],
    ],
    [n('zoom', 'Time axis', 'Dates, not free text', null, 1, 1)],
    {
      time: {
        label: 'Time axis',
        steps: [
          st(['page', 'plot', 'zoom'], ['page>zoom', 'zoom>plot'], 'The page sets a time axis with real dates. Labels use the date adapter when one exists.'),
          st(['plot', 'host'], ['plot>host'], 'Tooltip headers use that same date format. A custom formatter is needed when the label must include the clock time.'),
        ],
      },
    },
    ['Progressive or sampled when the point count is high.'],
    ['Free-text categories are not dates. Leave them unchanged.', 'Do not pass an Angular named date format.'],
  ),

  chart(
    'pixel-chart-area',
    'pixel-chart-area',
    'A filled line. It follows the same host, theme, time axis, and large-series rules as the line chart. Stacked areas add the series together.',
    [
      ['Shows volume under a line', 'Use a separate color system. Colors come from the theme'],
    ],
    [],
    {},
    ['Stacked area.'],
    ['Treat area like line for time axes and sampling. Do not invent a second host.'],
  ),

  chart(
    'pixel-chart-pie',
    'pixel-chart-pie',
    'Slices of a whole. A click reports the slice so the page can drill. The shell legend can hide a slice. Colors stay tied to the full series when slices are hidden.',
    [
      ['Shows parts of a whole', 'Drill by itself'],
    ],
    [n('click', 'Slice click', 'The page drills', null, 1, 1)],
    {
      click: {
        label: 'Slice click',
        steps: [
          st(['plot', 'click', 'page'], ['plot>click', 'click>page'], 'The user clicks a slice. The page decides whether to drill or filter.'),
          st(['page', 'plot', 'host'], ['page>plot', 'plot>host'], 'The page rebinds the data. The chart does not push a route.'),
        ],
      },
    },
    [],
    ['Do not navigate inside the pie. The page owns the next view.'],
  ),

  chart(
    'pixel-chart-gauge',
    'pixel-chart-gauge',
    'One value on a dial, between a min and a max. It does not use the shell "show values" toggle. The meaning of the number is the page’s label, not a second series.',
    [
      ['Shows one measure on a dial', 'Use the values toggle from the shell'],
    ],
    [],
    {
      value: {
        label: 'Update the value',
        steps: [
          st(['page', 'plot', 'host'], ['page>plot', 'plot>host'], 'The page sets the value. The host redraws the dial.'),
          st(['plot'], [], 'There is no legend series to hide and no value-label toggle.', ['theme']),
        ],
      },
    },
    ['A single value, not a series list.'],
    ['Do not bind the shell show-values toggle to a gauge.'],
  ),

  chart(
    'pixel-chart-scatter',
    'pixel-chart-scatter',
    'Points on two numeric axes. A large cloud can draw progressively. Clicks report a point. The page owns any drill or filter that follows.',
    [
      ['Plots x and y points', 'Become a bubble chart unless a size is part of this facade'],
    ],
    [n('click', 'Point click', 'The page reacts', null, 1, 1)],
    {
      click: {
        label: 'Point click',
        steps: [
          st(['plot', 'click', 'page'], ['plot>click', 'click>page'], 'The user clicks a point. The page reads the ids and indexes, not a raw payload in analytics.'),
          st(['host', 'plot'], ['host>plot'], 'A large set uses the progressive path past the threshold instead of drawing every point the slow way.'),
        ],
      },
    },
    ['Progressive draw for a large cloud.'],
    ['Analytics for a point click is ids and indexes, not the raw coordinates text.'],
  ),

  chart(
    'pixel-chart-bubble',
    'pixel-chart-bubble',
    'Scatter points with a size. The page supplies x, y, and size. Clicks report the point. The shell can still hide a series from the legend.',
    [
      ['Encodes a third value as size', 'Drop the size and pretend it is a plain scatter'],
    ],
    [n('click', 'Point click', 'The page reacts', null, 1, 1)],
    {
      click: {
        label: 'Point click',
        steps: [
          st(['page', 'plot', 'host'], ['page>plot', 'plot>host'], 'The page passes points that include a size. The host draws the bubbles.'),
          st(['plot', 'click', 'page'], ['plot>click', 'click>page'], 'A click reports the point. The page decides what happens next.'),
        ],
      },
    },
    [],
    ['Size is data. Do not reuse the scatter facade when the third value matters.'],
  ),

  chart(
    'pixel-chart-radar',
    'pixel-chart-radar',
    'Several measures around a spoke chart. Each series is a shape. The legend can hide a series. The page owns the spoke labels.',
    [
      ['Compares a few measures on spokes', 'Replace a bar chart for a long list of categories'],
    ],
    [],
    {},
    ['One or more series on the same spokes.'],
    ['Keep the spoke count small enough to read. A long category list belongs on a bar chart.'],
  ),

  feature({
    dir: `${lib}/pixel-chart-sparkline`,
    title: 'pixel-chart-sparkline',
    summary: 'A tiny trend with no axes, drawn as SVG. It does not use the ECharts host and does not need the ECharts package. It does not use the shell values toggle.',
    does: [
      ['Draws a compact SVG trend', 'Use the canvas host or ECharts'],
      ['Fits in a table cell or a stat', 'Show a legend, axes, or the values toggle'],
    ],
    nodes: [
      n('page', 'Your page', 'Passes numbers', null, 0, 0),
      n('plot', 'Sparkline', 'SVG, no axes', 'pixel-chart-sparkline', 1, 0),
      n('cell', 'Cell or stat', 'Where it sits', null, 2, 0),
    ],
    stories: {
      draw: {
        label: 'Draw',
        steps: [
          st(['page', 'plot'], ['page>plot'], 'The page passes a short list of numbers. The sparkline draws SVG. No chart host is created.'),
          st(['plot', 'cell'], ['plot>cell'], 'Put it in a table cell or a compact stat. There is no legend and no values toggle.'),
        ],
      },
      empty: {
        label: 'No points',
        steps: [
          st(['page', 'plot'], ['page>plot'], 'With no numbers, there is no line to draw. Do not load ECharts to show an empty trend.'),
          st(['page', 'plot', 'cell'], ['page>plot', 'plot>cell'], 'When numbers arrive, the SVG updates in place.'),
        ],
      },
    },
    states: [
      'Empty.',
      'A single SVG trend.',
    ],
    mistakes: [
      'Import from pixel-ui/charts.',
      'Do not wrap a sparkline in the shell values toggle.',
      'Do not load ECharts for a sparkline.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-chart-map`,
    title: 'pixel-chart-map',
    summary: 'A geographic map. The library does not ship a world atlas. The page registers GeoJSON, then binds values. Variants are choropleth, area, point, bubble, scatter, symbol, heatmap, route, and flow. A click does not navigate. The page owns drill-down.',
    does: [
      ['Draws a map from GeoJSON the page supplies', 'Ship a world atlas or geocode addresses'],
      ['Colors regions, plots points, or draws routes', 'Change the route when a region is clicked'],
    ],
    nodes: [
      n('page', 'Your page', 'Supplies GeoJSON and data', null, 0, 0),
      n('plot', 'Map', 'The facade', 'pixel-chart-map', 1, 0),
      n('geo', 'GeoJSON', 'Registered by the page', null, 2, 0),
      n('host', 'Chart host', 'Draws and resizes', 'pixel-chart-host', 3, 0),
      n('region', 'Regions', 'Choropleth or area', null, 0, 1),
      n('points', 'Points', 'Sites, bubbles, heat', null, 1, 1),
      n('links', 'Routes', 'Route or flow', null, 2, 1),
      n('click', 'Click', 'Page owns drill', null, 3, 1),
    ],
    stories: {
      regions: {
        label: 'Regions',
        steps: [
          st(['page', 'geo', 'plot'], ['page>geo', 'geo>plot'], 'The page registers GeoJSON under a map name, or passes it in. There is no built-in atlas.'),
          st(['page', 'plot', 'region', 'host'], ['page>region', 'region>plot', 'plot>host'], 'Choropleth joins values to features by the region key and paints a scale. Area mode uses category colors and the shell legend.'),
        ],
      },
      points: {
        label: 'Points and heat',
        steps: [
          st(['page', 'points', 'plot'], ['page>points', 'points>plot'], 'Point, symbol, bubble, and scatter use a point list. Bubble and scatter size comes from the point size, or the value if size is missing.'),
          st(['points', 'plot', 'host'], ['plot>host'], 'Heatmap uses the point value as intensity. Labels hide automatically when there are many points. Pan and zoom are pointer actions, not keyboard actions.'),
        ],
      },
      routes: {
        label: 'Routes',
        steps: [
          st(['page', 'links', 'plot'], ['page>links', 'links>plot'], 'Route and flow use links. Each link has a from and a to, as coordinates or point ids, and may include waypoints.'),
          st(['links', 'plot', 'host'], ['plot>host'], 'Flow line width follows the link value. Arrows show direction.'),
        ],
      },
      click: {
        label: 'Click',
        steps: [
          st(['plot', 'click', 'page'], ['plot>click', 'click>page'], 'A click reports the region or point. The page may filter or drill. The map does not change the route.'),
          st(['page', 'plot'], ['page>plot'], 'Loading, empty, and skeleton belong to the shell around the map. Export PNG, SVG, or CSV from that shell.'),
        ],
      },
    },
    states: [
      'No GeoJSON yet: nothing geographic to draw.',
      'Regions, points, heat, or links drawn.',
      'Roaming with the pointer.',
      'Empty or loading, from the shell.',
    ],
    mistakes: [
      'Import from pixel-ui/charts. Register GeoJSON yourself. The library does not include a world map.',
      'Join region data with the region key. The default key is the feature name.',
      'Do not navigate inside the map. Drill-down stays in the page.',
      'Pan and zoom are pointer-only. Do not expect arrow keys to roam.',
    ],
  }),
];
