# Pixel Toast

Enterprise toast / toaster notifications for Angular 21 — signals-based state, semantic theme tokens, queue management, and WCAG-friendly live regions.

## Setup

Add the container once in your app shell (e.g. `app.html`):

```html
<pixel-toast-container />
```

`PixelToastService` is `providedIn: 'root'`.

```typescript
import { PixelToastService } from 'pixel-ui';

export class MyPage {
  private readonly toast = inject(PixelToastService);

  save(): void {
    this.toast.success('Saved', 'Your draft was stored.');
  }
}
```

## Service API

| Method | Description |
|--------|-------------|
| `show(config)` | Show toast with full config; returns id |
| `success(title, message?, config?)` | Success semantic toast |
| `error(title, message?, config?)` | Error toast (`role: alert`) |
| `warning(title, message?, config?)` | Warning toast |
| `info(title, message?, config?)` | Info toast |
| `loading(title, message?, config?)` | Loading (no auto-dismiss) |
| `offline` / `online` / `system` / `custom` | Typed helpers |
| `promise(task, messages, config?)` | Loading → success/error lifecycle |
| `configure(partial)` | Global defaults (position, maxVisible, …) |
| `update(id, patch)` | Patch an active toast |
| `remove(id)` / `clear(position?)` | Dismiss |

## Toast types

`success` · `error` · `warning` · `info` · `default` · `loading` · `offline` · `online` · `system` · `promise` · `custom`

Soft variant uses `--pixel-sys-{type}-container` and `--pixel-sys-on-{type}-container` (aligned with the semantic-colors demo).

**Outlined** (`variant: 'outlined'`) — light tinted background, 1px semantic border, colored icon, on-surface text. No elevation shadow. Ideal for inline banners.

## Variants

`soft` · `solid` · `outlined`

## Placement

| Mode | Container | API |
|------|-----------|-----|
| Overlay (default) | `<pixel-toast-container />` | `toast.show()`, `toast.success()`, … |
| Inline | `<pixel-toast-inline anchor="default" />` | `toast.inline({ … })` or `placement: 'inline'` |

Inline toasts render in document flow (full width of the anchor). Optional `inlineAnchor` matches the `anchor` input when you need multiple regions.

```html
<pixel-toast-inline anchor="form-errors" />
```

```typescript
toast.inline({
  type: 'warning',
  variant: 'outlined',
  inlineAnchor: 'form-errors',
  message: 'Session expires in 5 minutes.',
});
```

## Positioning

`top-left` · `top-center` · `top-right` · `bottom-left` · `bottom-center` · `bottom-right`

Configure globally:

```typescript
toast.configure({ position: 'bottom-right', maxVisible: 4, newestOnTop: true });
```

## Promise example

```typescript
await toast.promise(api.save(payload), {
  loading: 'Saving…',
  success: 'Saved!',
  error: (err) => `Failed: ${err}`,
});
```

## Long title or message

Title, message, and expanded details scroll inside the toast when they exceed **`min(12rem, 40vh)`** (override with `contentMaxHeight` on the toast config or `--pixel-toast-content-max-height` in CSS). Action buttons, timestamp, and the close control stay outside the scroll area. Text wraps and breaks long words/URLs.

```typescript
toast.show({
  title: 'Very long heading…',
  message: 'Long body copy…',
  contentMaxHeight: '16rem',
});
```

## Accessibility

- `role="alert"` for error/warning; `role="status"` otherwise
- `aria-live` assertive vs polite
- `aria-describedby` links title and message
- Close and action controls are native buttons
- Escape dismisses when the toast is focused
- `prefers-reduced-motion` disables enter animations

## Theme customization

Override CSS variables on `.pixel-toast`:

- `--pixel-toast-bg` · `--pixel-toast-fg` · `--pixel-toast-icon` · `--pixel-toast-border` · `--pixel-toast-progress`

Dark mode follows `[data-theme="dark"]` and `prefers-color-scheme: dark` via global Pixel theme tokens.

## Animation

Per-toast `animation`: `fade` · `slide` · `scale` · `stack` · `collapse` (enter via CSS).

## Migration

If migrating from ngx-toastr:

1. Replace `ToastrService` with `PixelToastService`.
2. Map `toast.success()` → `toast.success()`, etc.
3. Add `<pixel-toast-container />` instead of embedding a module component.
4. Map `enableHtml` to plain text or extend with `custom` type + templates in a future release.

## Standalone `pixel-toast`

Use without the service for inline demos:

```html
<pixel-toast type="success" title="Done" message="All set." variant="soft" />
```
