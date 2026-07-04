# Pixel Stepper

An accessible, themeable, **signals-driven** stepper / wizard system for Angular 21. Project
`pixel-step` children and the stepper renders a state-aware header rail, the active step's content,
and — for wizard / mobile presets — a Back / Next / Finish footer.

- 8 visual presets · 4 sizes · 3 navigation modes
- Linear / non-linear / free navigation with sync **and async** per-step validation
- Dynamic, conditional, and branching workflows (steps are projected content)
- Reactive-forms integration via `stepControl`
- Full keyboard support + WCAG-AA ARIA (`tablist` / `tab` / `tabpanel`, roving focus)
- Light / dark theming through `--pixel-sys-*` tokens — nothing hardcoded
- `OnPush`, standalone, default exports, `input()` / `output()` only

---

## 1. Overview

```html
<pixel-stepper type="wizard" navigationMode="linear" (finished)="submit()">
  <pixel-step label="Account" [stepControl]="accountForm">
    <pixel-step-content>…form fields…</pixel-step-content>
  </pixel-step>
  <pixel-step label="Review">
    <pixel-step-content>Confirm and finish.</pixel-step-content>
  </pixel-step>
</pixel-stepper>
```

The system is five components:

| Component             | Selector             | Role                                                        |
| --------------------- | -------------------- | ----------------------------------------------------------- |
| `PixelStepperComponent`     | `pixel-stepper`      | Orchestrator — owns selection, navigation, progress, ARIA.  |
| `PixelStepComponent`        | `pixel-step`         | A single step; its body is captured and rendered on demand. |
| `PixelStepHeaderComponent`  | `pixel-step-header`  | Presentational indicator + label (rendered by the stepper). |
| `PixelStepContentComponent` | `pixel-step-content` | Structural wrapper for a step's body.                       |
| `PixelStepActionsComponent` | `pixel-step-actions` | Footer row for a step's navigation buttons.                 |

---

## 2. Stepper types

Set with `type`:

| Type           | Description                                                       |
| -------------- | ---------------------------------------------------------------- |
| `horizontal`   | Numbered indicators in a row, connected by lines (default).      |
| `vertical`     | Indicators stacked, content nested under the active step.        |
| `wizard`       | Horizontal header + Back / Next / Finish footer and counter.     |
| `progress`     | Slim progress bar with `Step N of M` + percentage.               |
| `navigation`   | Pill-style, free-navigation header.                              |
| `timeline`     | Vertical dots-and-line activity feed.                            |
| `compact`      | Condensed horizontal header (descriptions hidden).               |
| `mobile`       | Dot rail + Back / Next footer for small screens.                 |

Sizes: `xs` · `sm` · `md` (default) · `lg`. Navigation modes: `linear` · `non-linear` · `free`.

---

## 3. Inputs

### `pixel-stepper`

| Input              | Type                              | Default        | Description                                                   |
| ------------------ | --------------------------------- | -------------- | ------------------------------------------------------------- |
| `type`             | `PixelStepperType`                | `'horizontal'` | Visual preset (also sets default orientation).               |
| `orientation`      | `PixelStepperOrientation`         | derived        | Override the layout axis.                                     |
| `size`             | `PixelStepperSize`                | `'md'`         | Density tier.                                                 |
| `navigationMode`   | `PixelStepperNavigationMode`      | `'linear'`     | How freely a user may move.                                  |
| `selectedIndex`    | `number` (two-way)                | `0`            | Active step index.                                           |
| `clickableHeaders` | `boolean`                         | `true`         | Whether headers navigate on click.                           |
| `showNavigation`   | `boolean \| undefined`            | preset-based   | Force the footer on/off.                                     |
| `showProgress`     | `boolean \| undefined`            | preset-based   | Force the progress bar on/off.                              |
| `showStepCounter`  | `boolean \| undefined`            | preset-based   | Force the `Step N of M` counter on/off.                     |
| `animated`         | `boolean`                         | `true`         | Enable transitions (auto-off under reduced motion).         |
| `animationDuration`| `number`                          | `250`          | Transition duration (ms).                                    |
| `ariaLabel`        | `string`                          | `'Progress'`   | Accessible label for the tablist.                            |
| `previousLabel` / `nextLabel` / `finishLabel` / `skipLabel` | `string` | `'Back'` / `'Next'` / `'Finish'` / `'Skip'` | Footer button labels. |
| `beforeNext` / `beforePrevious` / `beforeFinish` / `canActivateStep` / `canLeaveStep` | `PixelStepGuard` | — | Sync / async navigation guards. |

### `pixel-step`

| Input         | Type                       | Default     | Description                                              |
| ------------- | -------------------------- | ----------- | -------------------------------------------------------- |
| `label`       | `string`                   | `''`        | Header label.                                            |
| `description` | `string`                   | `''`        | Secondary line.                                          |
| `icon`        | `string`                   | `''`        | Material Symbols glyph for the indicator.                |
| `badge`       | `string \| number`         | `''`        | Badge beside the label.                                  |
| `stepId`      | `string`                   | uid         | Stable id for tracking / state restore.                  |
| `optional`    | `boolean`                  | `false`     | Skippable; shows an "Optional" hint.                     |
| `editable`    | `boolean`                  | `true`      | Allow returning to edit after completion.                |
| `disabled`    | `boolean`                  | `false`     | Prevent selection.                                       |
| `completed`   | `boolean` (two-way)        | `undefined` | Explicit completion; otherwise derived.                  |
| `state`       | `PixelStepState`           | `undefined` | Force `error` / `warning` / `loading` / `locked`.        |
| `stepControl` | `AbstractControl`          | `undefined` | Reactive-forms control gating linear navigation.         |
| `validator`   | `PixelStepGuard`           | `undefined` | Async guard run on Next / Finish.                        |
| `lazy`        | `boolean`                  | `false`     | Defer body rendering until first activation.             |

---

## 4. Outputs

| Output              | Payload                  | Fires when…                                  |
| ------------------- | ------------------------ | -------------------------------------------- |
| `selectedIndexChange` | `number`               | The active index changes (two-way).          |
| `selectionChange`   | `PixelStepChangeEvent`   | Selection changes (with direction + ids).    |
| `finished`          | `void`                   | `finish()` succeeds on the last step.        |
| `cancelled`         | `void`                   | `cancel()` is called.                        |
| `stepSkipped`       | `number`                 | An optional step is skipped.                 |
| `draftSaved`        | `PixelStepperDraft`      | `saveDraft()` is called.                     |
| `navigationBlocked` | `PixelStepGuardContext`  | A guard / validator cancels navigation.      |

### Public methods

`next()` · `previous()` · `jumpTo(i)` · `skip()` · `finish()` · `cancel()` · `reset()` ·
`saveDraft()` · `restoreDraft(draft)` · `canEnter(i)`. The async ones return `Promise<boolean>`.

---

## 5. Wizard example

```html
<pixel-stepper type="wizard" navigationMode="linear" #s (finished)="submit()">
  <pixel-step label="Plan">…</pixel-step>
  <pixel-step label="Billing">…</pixel-step>
  <pixel-step label="Done">Press Finish.</pixel-step>
</pixel-stepper>
```

The footer's Back / Next / Finish are rendered automatically. Drive it programmatically via the
template ref: `s.next()`, `s.previous()`, `s.reset()`.

---

## 6. Form integration

```ts
form = inject(FormBuilder).group({ email: ['', [Validators.required, Validators.email]] });
```

```html
<pixel-stepper navigationMode="linear">
  <pixel-step label="Account" [stepControl]="form">
    <pixel-step-content><form [formGroup]="form">…</form></pixel-step-content>
  </pixel-step>
</pixel-stepper>
```

A step with a `stepControl` gates the Next button in **linear** mode while it is invalid. Use
**free** (or **non-linear**) navigation to move between steps without blocking Next, and rely on
`canFinish` / the disabled Finish button to require every bound control to be valid before
completing. Invalid steps surface the **error** indicator once their control is touched, visited,
or a finish attempt is blocked. After the user advances, the step counts as complete when the
control is **valid** and the step has been visited. For server-side checks use an async guard:

```ts
validateOnServer = (ctx) => firstValueFrom(this.api.check(ctx.fromIndex)); // Promise<boolean>
```

```html
<pixel-stepper [beforeNext]="validateOnServer">…</pixel-stepper>
```

The indicator spins and Next is disabled while the guard is pending.

---

## 7. Accessibility

- The header rail is a `role="tablist"`; each header a `role="tab"` with `aria-selected`,
  `aria-current="step"`, and `aria-controls`. The body is a `role="tabpanel"` linked by
  `aria-labelledby`.
- **Keyboard:** Arrow keys move roving focus (horizontal vs vertical aware), `Home` / `End` jump to
  the first / last header, `Enter` / `Space` activate, `Tab` moves in/out.
- Disabled / locked steps are exposed via `aria-disabled` and skipped by arrow navigation.
- Focus-visible rings use `--pixel-sys-focus-ring`; all colours meet WCAG-AA contrast.
- Animations respect `@media (prefers-reduced-motion: reduce)`.

---

## 8. Theme customization

Colours come from system tokens (`--pixel-sys-*`), so light / dark and the enterprise themes work
out of the box. Override component-level custom properties per instance:

```css
pixel-stepper {
  --pixel-stepper-accent: #7c3aed;
  --pixel-stepper-success: #16a34a;
  --pixel-stepper-indicator-size: 2.25rem;
  --pixel-stepper-line: color-mix(in srgb, currentColor 20%, transparent);
}
```

---

## 9. Dynamic & branching steps

Because steps are projected content children, modern control flow drives them directly:

```html
<pixel-stepper navigationMode="free">
  <pixel-step label="Basics">…</pixel-step>

  @for (s of extraSteps(); track s) {
    <pixel-step [label]="s">…</pixel-step>        <!-- dynamic insertion -->
  }

  @if (userType() === 'admin') {                  <!-- branching -->
    <pixel-step label="Permissions">…</pixel-step>
  } @else {
    <pixel-step label="Profile">…</pixel-step>
  }

  <pixel-step label="Review">…</pixel-step>
</pixel-stepper>
```

Persist / restore progress with `saveDraft()` → `PixelStepperDraft` (`{ selectedIndex,
completedStepIds }`) and `restoreDraft(draft)` — handy for URL-based or server-backed resume.

---

## 10. Migration notes

Coming from Angular Material `mat-stepper`:

| Material                          | Pixel                                                    |
| --------------------------------- | -------------------------------------------------------- |
| `<mat-stepper>` / `<mat-step>`    | `<pixel-stepper>` / `<pixel-step>`                       |
| `[linear]="true"`                 | `navigationMode="linear"`                                |
| `[stepControl]`                   | `[stepControl]` (same idea)                              |
| `matStepperNext` / `matStepperPrevious` directives | Call `s.next()` / `s.previous()` via a template ref, inside `<pixel-step-actions>` |
| `<ng-template matStepLabel>`      | `label` / `description` / `icon` inputs                  |
| `orientation="vertical"`          | `type="vertical"` (or `orientation="vertical"`)          |
| `selectionChange`                 | `selectionChange` (richer `PixelStepChangeEvent`)        |

There is no `matStepperNext` directive equivalent — wire buttons to the stepper's public methods
through a template reference variable, which keeps navigation explicit and testable.

<!-- API-CONTRACT:START — generated by tools/generate-readme-api.mjs. Do NOT edit between these markers; run `npm run readme:api` instead. -->

## API contract

_Machine-generated from the component source. This is the behavioral API surface: any change
to it is a **breaking-change candidate** and must be deliberate. After modifying this
component, run `npm run readme:api` and review this section's diff as a regression check._

### Component `pixel-step-actions` (`PixelStepActionsComponent`)

Footer row for a step's navigation buttons (Back / Next / Finish / Cancel). Lays projected buttons out in a flex row with consistent spacing and alignment. Purely presentational — wire the buttons to the stepper's public methods (`next()`, `previous()`, `finish()`…) yourself.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `align` | `PixelStepActionsAlign` | `'between'` |  |

### Component `pixel-step-content` (`PixelStepContentComponent`)

Structural wrapper for the body of a `pixel-step`. Provides consistent spacing and an enter animation hook around projected step content. Purely presentational.

### Component `pixel-step-header` (`PixelStepHeaderComponent`)

Presentational header for a single step: a state-aware indicator (number → icon → check / error / warning / spinner / lock) plus label, description, optional hint, and badge. Rendered by `pixel-stepper` for each step, but exported for bespoke layouts. Exposes `role="tab"` semantics and emits `select` when activated; the parent owns whether the activation is allowed.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `index` | `number` | `0` |  |
| `displayNumber` | `number` | `1` |  |
| `label` | `string` | `''` |  |
| `description` | `string` | `''` |  |
| `icon` | `string` | `''` |  |
| `badge` | `string | number` | `''` |  |
| `state` | `PixelStepState` | `'pending'` |  |
| `size` | `PixelStepperSize` | `'md'` |  |
| `orientation` | `PixelStepperOrientation` | `'horizontal'` |  |
| `type` | `PixelStepperType` | `'horizontal'` |  |
| `labelPosition` | `PixelStepperLabelPosition` | `'end'` |  |
| `selected` | `boolean` | `false` |  |
| `clickable` | `boolean` | `true` |  |
| `optional` | `boolean` | `false` |  |
| `first` | `boolean` | `false` |  |
| `last` | `boolean` | `false` |  |
| `tabIndex` | `number` | `-1` |  |
| `headerId` | `string` | `''` |  |
| `panelId` | `string` | `''` |  |
| `iconTemplate` | `TemplateRef<unknown> | undefined` | `undefined` |  |

**Outputs**

| Output | Payload | Description |
| --- | --- | --- |
| `select` | `number` | Emitted when an enabled header is activated (click / Enter / Space). |

### Component `pixel-step` (`PixelStepComponent`)

A single step projected into `pixel-stepper`. Its body is captured as a template and rendered by the parent in the active panel, so only the current step's content is in the live panel at a time.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | `''` |  |
| `description` | `string` | `''` |  |
| `icon` | `string` | `''` |  |
| `badge` | `string | number` | `''` |  |
| `stepId` | `string` | `''` |  |
| `optional` | `boolean` | `false` |  |
| `editable` | `boolean` | `true` |  |
| `disabled` | `boolean` | `false` |  |
| `state` | `PixelStepState | undefined` | `undefined` |  |
| `stepControl` | `AbstractControl | undefined` | `undefined` |  |
| `validator` | `PixelStepGuard | undefined` | `undefined` |  |
| `lazy` | `boolean` | `false` |  |

**Two-way (model)**

| Model | Type | Default | Description |
| --- | --- | --- | --- |
| `completed` | `boolean | undefined` | `undefined` |  |

### Component `pixel-stepper` (`PixelStepperComponent`)

Enterprise stepper / wizard. Project `pixel-step` children; the stepper renders the header rail (numbered, state-aware indicators with connectors), the active step's content, and — for wizard / mobile presets — a Back / Next / Finish footer. Eight visual presets, four sizes, three navigation modes, sync + async per-step validation, and full keyboard + ARIA support. Signal / `input()` / `output()` driven; no two-way binding beyond `selectedIndex`.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `showSkeleton` | `boolean` | `false` | When true, replaces the stepper with skeleton step placeholders. |
| `skeletonSteps` | `number` | `0` | Number of skeleton steps. Defaults to the projected step count, otherwise 4. |
| `type` | `PixelStepperType` | `'horizontal'` |  |
| `orientationInput` | `PixelStepperOrientation | undefined` | `undefined` |  |
| `size` | `PixelStepperSize` | `'md'` |  |
| `labelPosition` | `PixelStepperLabelPosition` | `'end'` |  |
| `navigationMode` | `PixelStepperNavigationMode` | `'linear'` |  |
| `clickableHeaders` | `boolean` | `true` |  |
| `showNavigation` | `boolean | undefined` | `undefined` |  |
| `showProgress` | `boolean | undefined` | `undefined` |  |
| `showStepCounter` | `boolean | undefined` | `undefined` |  |
| `animated` | `boolean` | `true` |  |
| `animationDuration` | `number` | `250` |  |
| `ariaLabel` | `string` | `'Progress'` |  |
| `previousLabel` | `string` | `'Back'` |  |
| `nextLabel` | `string` | `'Next'` |  |
| `finishLabel` | `string` | `'Finish'` |  |
| `skipLabel` | `string` | `'Skip'` |  |
| `beforeNext` | `PixelStepGuard | undefined` | `undefined` |  |
| `beforePrevious` | `PixelStepGuard | undefined` | `undefined` |  |
| `beforeFinish` | `PixelStepGuard | undefined` | `undefined` |  |
| `canActivateStep` | `PixelStepGuard | undefined` | `undefined` |  |
| `canLeaveStep` | `PixelStepGuard | undefined` | `undefined` |  |

**Two-way (model)**

| Model | Type | Default | Description |
| --- | --- | --- | --- |
| `selectedIndex` | `number` | `0` |  |

**Outputs**

| Output | Payload | Description |
| --- | --- | --- |
| `selectionChange` | `PixelStepChangeEvent` | Emitted whenever the selected step changes (with direction + ids). |
| `finished` | `void` | Emitted when the flow is finished from the last step. |
| `cancelled` | `void` | Emitted when the flow is cancelled. |
| `draftSaved` | `PixelStepperDraft` | Emitted with a serialisable snapshot when `saveDraft()` is called. |
| `stepSkipped` | `number` | Emitted when an optional step is skipped. |
| `navigationBlocked` | `PixelStepGuardContext` | Emitted when navigation is blocked by a failing guard / validator. |

### Directive `[pixelStepIcon]` (`PixelStepIconDirective`)

Marks an `<ng-template>` as custom content for a step's indicator — render an avatar, image, inline SVG, or any component in place of the number / Material Symbols glyph. Status glyphs (✓ completed, ! error, spinner, lock) still take precedence so validation feedback is preserved.

### Exported types

| Type | Definition |
| --- | --- |
| `PixelStepActionsAlign` | `'start' | 'center' | 'end' | 'between'` |
| `PixelStepperType` | `| 'horizontal' | 'vertical' | 'wizard' | 'progress' | 'navigation' | 'timeline' | 'compact' | 'mobile'` |
| `PixelStepperOrientation` | `'horizontal' | 'vertical'` |
| `PixelStepperLabelPosition` | `'end' | 'bottom'` |
| `PixelStepperSize` | `'xs' | 'sm' | 'md' | 'lg'` |
| `PixelStepperNavigationMode` | `'linear' | 'non-linear' | 'free'` |
| `PixelStepState` | `| 'pending' | 'current' | 'completed' | 'error' | 'warning' | 'disabled' | 'locked' | 'optional' | 'loading'` |
| `PixelStepperDirection` | `'next' | 'previous' | 'jump' | 'reset'` |
| `PixelStepGuard` | `( context: PixelStepGuardContext, ) => boolean | Promise<boolean> | Observable<boolean>` |

### Exported interfaces

**`PixelStepperDraft`** — Snapshot emitted on `draftSaved`, suitable for persistence / resume.

```ts
interface PixelStepperDraft {
  readonly selectedIndex: number;
  readonly completedStepIds: readonly string[];
}
```

**`PixelStepChangeEvent`** — Payload emitted whenever the selected step changes.

```ts
interface PixelStepChangeEvent {
  readonly previouslySelectedIndex: number;
  readonly selectedIndex: number;
  readonly direction: PixelStepperDirection;
  readonly stepId?: string;
}
```

**`PixelStepGuardContext`** — Context handed to navigation guards / hooks.

```ts
interface PixelStepGuardContext {
  readonly fromIndex: number;
  readonly toIndex: number;
  readonly fromStepId?: string;
}
```

**`PixelStepData`** — Strongly typed descriptor for data-driven steppers (`navigation`, `progress`, `timeline`) where headers are generated from data rather than projected `pixel-step` children.

```ts
interface PixelStepData {
  readonly id?: string;
  readonly label: string;
  readonly description?: string;
  readonly icon?: string;
  readonly state?: PixelStepState;
  readonly optional?: boolean;
  readonly disabled?: boolean;
  readonly hidden?: boolean;
  readonly badge?: string | number;
  readonly data?: unknown;
}
```

<!-- API-CONTRACT:END -->
