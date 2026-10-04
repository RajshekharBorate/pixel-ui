# Shared orchestration player

The step-through pages (`orchestration.html` next to each component and service) share this player.

- `player.css` — card, wire, and caption styles
- `player.js` — story playback, arrows, and lines that stay outside the cards

Each page sets `window.__ORCH` (`nodes` and `stories`) and then loads `player.js`.

Open a page by serving `projects/pixel-ui/src/lib` (a `file://` open often blocks the shared script). `pixel-notification/orchestration.html` is the original self-contained page and does not use this folder.
