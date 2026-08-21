# pixel-ui performance harness

Minimal routes for library Lighthouse / timespan budgets. **Not** the docs site.

> Status: scaffold — add an Angular app (or Playwright routes) here in a follow-up.
> Target routes (from `PERFORMANCE.md`):

| Route | Stress |
| --- | --- |
| `/perf/button` | Baseline JS (must stay small) |
| `/perf/overlay-closed` | Dialog/select/menu constructed but closed |
| `/perf/dialog` | Open/close 10× (timespan) |
| `/perf/select-500` | 500 options, open + typeahead |
| `/perf/grid-1k` | 1000 rows, virtual on vs off |
| `/perf/chart-line` | First paint + resize (`pixel-ui/charts`) |
| `/perf/editor` | Init vs idle (`pixel-ui/editor`) |
| `/perf/datepicker` | Open calendar (deferred chunk) |

Import heavy surfaces from secondary entries only:

```ts
import { PixelButtonComponent } from 'pixel-ui';
import { PixelDataGridComponent } from 'pixel-ui/data-grid';
import { PixelChartLineComponent } from 'pixel-ui/charts';
import { PixelEditorComponent } from 'pixel-ui/editor';
```
