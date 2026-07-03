# pixel-query-builder

Enterprise-grade, nested visual query builder for Angular 21. Compose filter trees with AND/OR
**rulesets**, field-aware operators, dynamic value editors, async option loading, reactive-form
integration, collapsible groups, and empty-ruleset validation.

## Layout (default: `ruleset`)

The default **ruleset** variant matches classic query-builder UX:

- **Ruleset toolbar** — collapse toggle, AND/OR `pixel-toggle` segmented control, `+ Rule`, `+ Ruleset`, delete (×)
- **Query preview** — collapsible header with live basic/advanced summary
- **Branch line** — vertical connector for nested hierarchy
- **Rule rows** — field · operator · value · reorder · delete
- **Empty ruleset error** — pink alert when a ruleset has no children

Legacy variants: `tree`, `card`, `compact` (summary/footer tweaks only).

## Components

| Selector              | Export                         | Role                                      |
| --------------------- | ------------------------------ | ----------------------------------------- |
| `pixel-query-builder` | `PixelQueryBuilderComponent`   | Root orchestrator and query preview        |
| `pixel-query-group`   | `PixelQueryGroupComponent`     | Recursive AND/OR group (internal)         |
| `pixel-query-rule`    | `PixelQueryRuleComponent`      | Single condition row (internal)           |
| `pixel-query-value`   | `PixelQueryValueComponent`     | Field-type value router (internal)        |

## Quick start

```html
<pixel-query-builder
  [config]="queryConfig"
  [(query)]="queryState"
  (queryUpdated)="onQueryUpdated($event)"
/>
```

```ts
const queryConfig: PixelQueryBuilderConfig = {
  maxDepth: 3,
  fields: {
    age: { name: 'Age', type: 'number', icon: 'numbers' },
    gender: {
      name: 'Gender',
      type: 'category',
      icon: 'person',
      options: [
        { name: 'Male', value: 'm' },
        { name: 'Female', value: 'f' },
      ],
    },
  },
};
```

## Output shape

```json
{
  "condition": "and",
  "rules": [
    { "field": "age", "operator": "lte", "value": 30 },
    { "field": "gender", "operator": "equals", "value": "m" }
  ]
}
```

Nested groups embed another `{ "condition", "rules" }` object in `rules`. Internal node `id`s
are kept in component state only; `exportQuery()` payloads omit them.

Use `(queryUpdated)` or `exportQuery()` / `queryToSummary()` when you need run/export behavior in
your app shell — the demo page shows import, export, JSON preview, and run actions wired outside
the component.

## Key inputs

| Input             | Type                         | Default  | Description                              |
| ----------------- | ---------------------------- | -------- | ---------------------------------------- |
| `config`          | `PixelQueryBuilderConfig`    | required | Field metadata + limits                  |
| `query`           | `PixelQueryGroup`            | empty    | Two-way query tree                       |
| `size`            | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'`   | Control density (1:1 with child inputs)  |
| `variant`         | `'ruleset' \| 'tree' \| 'card' \| 'compact'` | `'ruleset'` | Visual preset                        |
| `showSummary`     | `boolean`                    | `true`   | Live human-readable preview bar          |
| `readOnly`        | `boolean`                    | `false`  | Preview mode                             |
| `required`        | `boolean`                    | `false`  | When true, an empty root query is invalid and shows **A ruleset cannot be empty.** |

When `required` is `false` (default), an empty root query is valid. Nested rulesets must always contain at least one rule or child ruleset and show **A ruleset cannot be empty.** when empty. Incomplete rules (missing field, operator, or value) are still validated in both modes.

## Async field options

```ts
assignee: {
  name: 'Assignee',
  type: 'category',
  searchable: true,
  serverSearch: true,
  loadOptions: (query, ctx) => api.searchUsers(query),
},
region: {
  name: 'Region',
  type: 'multiselect',
  resolveOptions: () => api.getRegions(),
},
```

## Reactive forms

`pixel-query-builder` implements `ControlValueAccessor` + `Validator`.

```html
<form [formGroup]="form">
  <pixel-query-builder formControlName="filters" [config]="queryConfig" [required]="true" />
</form>
```

Per-field `validators` / `asyncValidators` in config are applied to value controls inside rule rows.

## Reused Pixel components

`pixel-select`, `pixel-input`, `pixel-datepicker`, `pixel-date-range-picker`, `pixel-toast-inline`, `pixel-tooltip`, `pixel-button`, `pixel-menu`

## Utilities

- `exportQuery()` / `importQuery()` — strip or regenerate ids
- `validateQuery()` / `queryToSummary()` — validation + readable preview
- `getOperatorsForFieldType()` — shared operator registry
