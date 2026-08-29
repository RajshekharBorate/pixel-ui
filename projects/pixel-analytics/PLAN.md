# pixel-analytics — implementation plan

Vendor-neutral analytics foundation for Pixel UI and enterprise apps. **HTTP-first**
enterprise backend is the default integration path; vendor adapters ship in optional packages.

## Phase status

| Phase | Scope | Status |
|-------|--------|--------|
| 0 | Architecture + governance docs | ✅ Done |
| 1 | Library scaffold, types, noop/console providers | ✅ Done |
| 2 | Canonical model + event registry | ✅ Done |
| 3 | `PixelAnalyticsService` + `providePixelAnalytics` | ✅ Done |
| 4 | Context + identity | ✅ Done |
| 5 | Privacy + consent + sanitizer | ✅ Done |
| 6 | Queue + batch + retry + unload flush | ✅ Done |
| 7 | HTTP provider + transport | ✅ Done |
| 8 | Error + HTTP + performance plugins | ✅ Done |
| 9 | Pixel UI component integration | ✅ Done |
| 10 | Full tests + docs site examples | ✅ Done |
| 11 | Production hardening + optional vendor adapters | ✅ Hardening done; vendor adapters deferred |

## Exit criteria (MVP — phases 0–7)

- `ng build pixel-analytics` passes
- Unit tests cover sanitizer, consent, queue, service, HTTP provider
- `providePixelAnalytics({ http: { endpoint } })` POSTs canonical JSON batches
- Analytics failures never throw into host application code
- No vendor SDK dependencies in core package

## Exit criteria (Phase 8)

- `withRouteTracking` emits page/route events on `NavigationEnd`
- `withHttpTracking` + `pixelAnalyticsHttpInterceptor` capture metadata only (no body/headers by default)
- Analytics ingest URL is excluded from HTTP tracking
- `withErrorTracking` records `application.error` via `ErrorHandler`
- `withPerformanceTracking` emits page load + LCP/CLS without external deps
- Instrumentation failures never break Router / HTTP / ErrorHandler

## Exit criteria (Phase 9)

- `pixelAnalyticsTrack` directive tracks activation via `PixelAnalyticsService`
- `PIXEL_UI_ANALYTICS` port in `pixel-ui` (no hard dep on `pixel-analytics`)
- `createPixelUiAnalyticsPort` bridges the packages in app config
- `pixel-button` (`analyticsAction`), `pixel-dialog` (open/close), `pixel-data-grid` (sort/filter/export) emit when the port is provided
- Analytics failures never break component interaction

## Exit criteria (Phase 10)

- Docs site registers **Services → Analytics** (`pixel-analytics` meta, `packageImportPath: 'pixel-analytics'`)
- Examples cover: core API, consent, privacy/PII, page/route, HTTP shapes, errors, performance, track directive, button bridge, dialog, data-grid
- `npm run build:docs` succeeds with those examples

## Phase 11 — architecture review backlog (2026-08-29)

Recorded from an enterprise / analytics / privacy / Angular 21 review.

Suggested fix order: Blockers → High → Medium → Low.

### Exit criteria (Phase 11)

- Consent revoke, storage-after-consent, and URL/referrer sanitization match the privacy contract ✅
- Failed batches are re-queued (at-least-once); HTTP is one provider in a single fan-out ✅
- `ErrorHandler` chains; LCP/CLS emit once; identity/consent/context are not `providedIn: 'root'` ✅
- Testing helper exists (or guidelines drop the claim); registry validation and `identify` contracts are honest ✅
- Optional vendor adapters remain out of core ✅ (still deferred)

---

### Blockers (privacy / data loss) — ✅ fixed

1. ✅ Consent revoke drops / flushes main queue per `onRevoke`; consent persisted to storage
2. ✅ Failed batches re-queued; retry skips non-retryable 4xx; jitter; urgent uses `fetch`+keepalive
3. ✅ Identity in-memory until grant; persist on grant; clear on deny/reset
4. ✅ `anonymous-only` implemented (collect without `userId`)
5. ✅ `pendingQueueLimit` enforced on enqueue; excess dropped on grant
6. ✅ Referrer + URL-like properties sanitized; no raw `urlAfterRedirects`

### High (reliability / Angular / contract drift) — ✅ fixed

7. ✅ Fan-out via provider router only (HTTP is a provider)
8. ✅ `identify()` emits `identity.user.identify` (traits sanitized via track)
9. ✅ ErrorHandler delegates to previous/`ErrorHandler`; `forwardToDefault` (+ deprecated `rethrow`)
10. ✅ LCP/CLS one-shot + DestroyRef cleanup; INP removed from registry copy
11. ✅ Identity / consent / context provided only via `createPixelAnalyticsProviders`
12. ✅ `createAnalyticsTestingController()` exported; docs `trackRouteChange` fixed
13. ✅ HMAC when `hashSecret` set; drop hash field if no `crypto.subtle`
14. ✅ Route / performance listeners use `DestroyRef` / `takeUntilDestroyed`

### Medium — ✅ addressed

15. ✅ Stable per-user sampling + `meta.sampled`
16. ✅ Pipeline: enabled → consent → sample → sanitize → validate → queue
17. ✅ Default `trackRouteChange` → `false`
18. ✅ `isSampledOut` (+ alias)
19. ✅ Track directive: native activatable = click-only; ignore disabled
20. ✅ Button/dialog/grid + Wave 1 form controls (select/autocomplete/checkbox/radio/toggle); README matrix updated
21. ✅ Contains-match block list
22. ✅ `trackError` strips URL query from messages
23. ✅ `Date` → ISO; reject non-plain objects
24. ✅ Prefer `fetch({ keepalive })` then `text/plain` beacon
25. ✅ Queue overflow increments `eventsDropped`
26. ✅ App-scoped `PIXEL_ANALYTICS_REGISTRY` + property-type checks when `validateRegistry`
27. ✅ SDK version aligned to package `0.0.1`

### Low / hygiene — ✅ addressed

28. ✅ Flush indentation / structure cleaned in prior pass
29. ✅ Bounded sequential `trackQueue` (no unbounded promise chain)
30. ✅ Session idle timeout (`session.idleTimeoutMs`, default 30m)
31. ✅ `group()` / `groupId` + `identity.group.identify`
32. ✅ Auto `correlation.traceId` / `spanId` when unset
33. ✅ `captureBodyPresence` (+ deprecated `captureBody` alias)
34. ✅ `http.propertyKeyCase: 'snake_case'` wire mapping

### Remaining — future (Phase 12+)

Core Phases 0–11 and Pixel UI analytics Waves 1–6 are **done**. Keep this file until vendor
adapters ship or lasting notes move fully into `README.md` + `ANALYTICS-GUIDELINES.md`.

#### Vendor adapter packages (deferred — out of core by design)

Do **not** add GA4 / Segment / Adobe (or similar) SDKs to `pixel-analytics`. Prefer:

1. **Default:** HTTP batch → customer backend → warehouse / CDP / vendor server-side
2. **App-local:** implement `PixelAnalyticsProvider` + register via `PIXEL_ANALYTICS_EXTRA_PROVIDERS`
3. **Future packages (when product picks a vendor):** e.g. `@pixel-ui/analytics-ga4`,
   `@pixel-ui/analytics-segment`, `@pixel-ui/analytics-adobe` as **optional** peers that:
   - depend on the vendor SDK as a peer dependency
   - map `domain.object.action` → vendor schema
   - honor Pixel consent + privacy (no titles, filenames, document content by default)
   - fan out alongside or instead of HTTP via the provider router

**Before building adapters:** lock one vendor, draft an event/property mapping table for the
registry catalog, and align consent modes. Do not build all three at once.

### Already in good shape (do not regress)

- Separate `pixel-analytics` package; Pixel UI only has a duck-typed port
- Canonical `domain.object.action` names and a starter registry
- Consent default `required: true` / `unknown` → drop
- HTTP interceptor skips the ingest URL; defaults are errors-only, no bodies/headers
- Grid filters omit raw values
- `trackPixelUiAnalytics` swallows provider throws
- Docs examples under Services → Analytics cover the main journeys
- No vendor SDKs in core

## Decisions (lasting)

- Package: `projects/pixel-analytics` (`pixel-analytics` npm name)
- Event naming: `domain.object.action` (snake_case segments)
- Default transport: HTTP batch to customer backend
- Consent default: `unknown` → drop events when `consent.required: true`
- Identity: `anonymousId` (persistent) + `sessionId` (session) + optional `userId` via `identify()`
- Phase 11 review (2026-08-29): privacy / at-least-once / DI registry / Pixel UI coverage
  hardening landed; optional vendor adapters remain separate packages

Delete this file when phases 0–11 are complete and decisions live in `README.md`.
