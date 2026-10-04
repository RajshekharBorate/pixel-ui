# pixel-loader — design

This page explains **pixel-loader** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

A busy indicator. It can wait a moment before showing, and it can stay up for a minimum time so it does not flash. A loading service counts overlapping jobs. Full screen locks scroll. An HTTP interceptor and route loading can turn it on. A request can opt out with a skip header.

| This piece does | It does not |
| --- | --- |
| Shows progress for a job, a request, or a route | Replace an empty state |
| Reference-counts overlapping work | Hide in the middle of a job that is still running |

## 2. Who talks to whom

The loader shows that work is in progress. The service counts jobs by id and hides the global loader only when the count is zero. Show delay and a minimum time still apply. A fullscreen container locks body scroll while that overlay is showing. That lock is not the service count.

```mermaid
flowchart TB
  subgraph page [Your page]
    Job[One job id]
    More[Another job id]
  end
  subgraph loader [Loader]
    Mark[The indicator]
    Delay[Show delay and minimum time]
  end
  subgraph full [Fullscreen container]
    Lock[Scroll lock while the overlay is showing]
  end
  Job --> Mark
  More --> Mark
  Delay --> Mark
  full --> Lock
  page -->|HTTP or route helpers| Mark
```

**How to read the picture**

- **One job.** Show it, then hide it when that job ends.
- **Two jobs.** The indicator stays until both ids are released. Hiding one does not clear the other.
- **track** wraps a promise so the count rises and falls with it.
- **HTTP and route helpers** can show the loader for you. Skip a call with the skip header when that request should stay quiet.
- **Fullscreen scroll lock** belongs to the fullscreen container, and only while its overlay is visible. The service count is a different mechanism.
- **The status is polite.** It is not an alert.

## 3. Flows

### One job

1. The page tracks a promise. The loader waits for the show delay, then appears, and stays at least the minimum time.
2. The promise finishes. The count drops to zero and the loader hides. It is a status, not an alert.

### Two jobs

1. A second job starts before the first ends. The count is 2. The loader stays.
2. Each finish decrements. The loader hides only at zero.

### Request or route

1. The interceptor or route loading turns the loader on for a request or a navigation.
2. A request with the skip header does not join the count.

### Full screen

1. The page uses the loading container at full screen scope. While that overlay is showing, page scroll is locked.
2. The overlay stays up for the minimum time so it does not flash. When it hides, scroll unlocks. The service count is separate: the global loader hides only when that count is zero.

## 4. Step by step

Section 3 is the short list. Each picture here is one of those flows, with the branch that changes what the developer must do. Read the note under the picture before copying the pattern.

### One job

```mermaid
sequenceDiagram
  participant Page
  participant Loader
  Page->>Loader: show this job
  Note over Loader: wait out the show delay
  Page->>Loader: the job ends
  Note over Loader: stay at least the minimum time, then hide
```

Do not hide on the same tick you show, if the delay has not elapsed. The loader will not flash for a fast job.

### Two jobs

```mermaid
sequenceDiagram
  participant Page
  participant Service as Loading service
  participant Loader
  Page->>Service: job A and job B
  Note over Loader: visible
  Page->>Service: job A ends
  Note over Loader: still visible
  Page->>Service: job B ends
  Note over Loader: hide, because the count is zero
```

Release the same id you showed. A mismatched id leaves the loader up.

### Request or route

```mermaid
sequenceDiagram
  participant App
  participant Service as Loading service
  App->>Service: an HTTP call or a route change
  Note over Service: the helper shows the loader
  opt the call sets the skip header
    Note over Service: that call stays quiet
  end
```

Use the skip header for background polling. Do not wrap those calls in track as well, or you will show the loader twice.

### Full screen

```mermaid
sequenceDiagram
  participant Page
  participant Overlay as Fullscreen container
  participant Service as Loading service
  Page->>Overlay: scope fullscreen, overlay showing
  Note over Overlay: body scroll locks
  Note over Service: the service count is separate
  Page->>Overlay: overlay hides
  Note over Overlay: scroll unlocks
```

Do not describe the service count as the scroll lock. The lock follows the fullscreen overlay. The count only decides when the global indicator is allowed to hide.

## 5. States

- Hidden during the show delay.
- Visible, including a minimum time so it does not flicker.
- Full screen with scroll locked.
- Idle when the count is zero.

## 6. Easy to get wrong

- Do not hide the loader when one of two jobs ends.
- Use the skip header for requests that must not flash the loader.
- This is not the empty state. Show the loader first, then data or the empty state.

## 7. Files

- `_pixel-loader-shared.scss`
- `pixel-loader.html`
- `pixel-loader.scss`
- `pixel-loader.service.ts`
- `pixel-loader.ts`
- `pixel-loader.types.ts`
- `pixel-loading-container.html`
- `pixel-loading-container.scss`
- `pixel-loading-container.ts`
- `pixel-loading-router.service.ts`
- `pixel-loading-router.ts`
- `pixel-loading.interceptor.ts`
- `pixel-loading.service.ts`
- `pixel-skeleton.html`
- `pixel-skeleton.scss`
- `pixel-skeleton.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
