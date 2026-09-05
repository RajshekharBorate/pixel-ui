# Authorization guidelines (Pixel UI)

How apps should consume `pixel-ui/authorization`. Companion to
`projects/pixel-ui/src/lib/services/authorization/README.md` and `PLAN-RBAC-ABAC.md`.

## Principles

1. **UI is not security** — every sensitive mutation/export/approval must be enforced on the server.
2. **Default deny** — empty roles, unknown permissions, missing attribute paths, remote timeout → deny.
3. **`unknown` ≠ deny** — while identity loads, show skeleton / `aria-busy`, do not flash-hide chrome. `@if (auth.can()())` stays true until `ready`. Gated **data** (grid columns, row actions) stays hidden until ready.
4. **No policy leakage** — never put permission keys, policy ids, or deny reasons in user-visible copy.
5. **Local PDP is tamperable** — document for security reviews; use remote PDP (`authorizeAsync`) for high-risk actions. Configuring `remotePdp` does not change `[pixelAccess]` / `can()`.

## Discovery checklist

1. Define a **versioned permission catalog** (single source for routes, sidenav, buttons, grid).
2. Map **personas → roles** in app docs (not in the PDP).
3. Prefer **RBAC keys** for chrome; add **ABAC policies** only when attributes matter.
4. Wire `setSubject` / `setPermissionCatalog` / `setPolicies` after auth hydration.
5. Choose PEP: `@if (auth.can()())` (hide), `[pixelAccess]` (hide/disable/readonly), route `canMatch`.
6. Call **`providePixelAuthorization()`** in `app.config` so native grid/dialog/tab/step PEPs bind `PIXEL_AUTHORIZATION_EVALUATOR` (unbound → fail-closed when `access` / `requires` / `exportAccess` is set).

## Route & nav

```ts
{
  path: 'admin',
  canMatch: [pixelAuthorizationCanMatch({ forbiddenUrl: '/forbidden', loginUrl: '/login' })],
  data: { access: 'admin:view' },
  loadChildren: () => import('./admin.routes'),
}

// Guards do not re-run when the subject changes. Opt in so a role switch
// while already on /admin leaves the page:
providePixelAuthorizationRouteWatcher(() => ({
  forbiddenUrl: '/home',
  loginUrl: '/login',
  onEvicted: () => toast.info('You no longer have access to that page.'),
}))
```

- Prefer **`canMatch`** for lazy admin chunks.
- Keep sidenav keys identical to route `data.access`; use `filterAllowed` to hide empty groups.
- Dev drift: visible nav item whose `canMatch` denies — fix catalog or labels.
- **Sidenav hide ≠ leave the URL.** After `setSubject` (role, tenant, logout), re-evaluate the active route. Do not keep rendering a page the person can no longer open.

## Grid export ladder

```text
view → export → bulk-export → download-sensitive-data
```

Toolbar visibility, column `access` / `exportable: false`, row actions, and `exportData()` must
agree. Server export is still authoritative.

## Remote PDP

| Operation | On timeout / 5xx |
|-----------|------------------|
| Mutation / export / approve | Deny |
| Sensitive reads | Deny |
| Decorative chrome | Skeleton / unavailable |
| Navigation | Deny (default) |

Never map remote failure to allow.

## Audit

Optional `PIXEL_AUTHORIZATION_AUDIT`: emit permission, resource **type/id**, reason, `requestId` —
not policy condition trees or PII attributes. Forward `requestId` to API headers when useful.

## Anti-patterns

- Inventing permission strings not in the catalog
- `@defer (when auth.can())` as a security gate
- Structural `*pixelAccess`
- Showing “missing permission: claims:export” to end users
- Per-row remote PDP for 10k grids
- Client-only `resource.attributes.role = 'admin'` for sensitive allows
