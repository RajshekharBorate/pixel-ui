# pixel-toast — design

This page explains **pixel-toast** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

A short message that stacks on the screen. Mount the container once. The service queues toasts. Loading and promise toasts stay until the page closes them. Error and warning are assertive. The title and message are never sent to analytics.

| This piece does | It does not |
| --- | --- |
| Shows a temporary message | Save the message in the notification inbox |
| Queues several toasts | Auto-dismiss a loading toast |

## 2. Who talks to whom

Mount one toast container. The service queues toasts into it. Error and warning interrupt. The others are polite. Loading and a promise toast stay until the page closes them. Analytics never includes the title or the message.

```mermaid
flowchart TB
  subgraph page [Your page]
    Service[Toast service]
  end
  subgraph host [One container]
    Queue[Queue]
    Toast[One toast]
  end
  Service --> Queue
  Queue --> Toast
  Toast -->|error or warning: interrupt| page
  Toast -->|others: polite| page
  Toast -->|Escape while focused| Queue
```

**How to read the picture**

- **One container.** A second mount will not receive the queue.
- **Auto-dismiss** is for ordinary toasts. Loading and promise toasts wait.
- **Escape** closes the toast that has focus.
- **Inline** is a different placement. It is not the corner queue.

## 3. Flows

### Show a toast

1. The page calls the service. The container, mounted once, shows the toast.
2. Info and success use a polite status. They dismiss on their own unless the page says otherwise.

### Error or warning

1. Error and warning use an alert and are assertive, so screen readers interrupt.
2. Escape dismisses a toast that has focus. The title and message are not analytics.

### Loading

1. A loading toast or a promise toast stays until the work ends. It does not time out.
2. The page resolves or dismisses it. An inline toast is a different placement in the page, not the corner stack.

## 4. Step by step

Section 3 is the short list. Each picture here is one of those flows, with the branch that changes what the developer must do. Read the note under the picture before copying the pattern.

### Show a toast

```mermaid
sequenceDiagram
  participant Page
  participant Service as Toast service
  participant Host as Container
  Page->>Service: show
  Service->>Host: enqueue
  Note over Host: polite status
  alt auto-dismiss
    Host->>Host: leave on its own
  else the user presses Escape while it is focused
    Host->>Host: close now
  end
```

Put the container once, high in the app. Do not mount it inside the button that calls show.

### Error or warning

```mermaid
sequenceDiagram
  participant Service as Toast service
  participant Toast
  Service->>Toast: error or warning
  Note over Toast: alert, interrupts
  Note over Toast: title and message stay out of analytics
```

These are the loud toasts. Do not also push the same sentence into a live region.

### Loading

```mermaid
sequenceDiagram
  participant Page
  participant Toast
  Page->>Toast: loading or a promise
  Note over Toast: stays until the page closes it
  Page->>Toast: close when the work ends
```

Do not set a short timeout on a loading toast. The page must close it when the work finishes or fails.

## 5. States

- Queued, visible, and dismissed.
- Info or success: polite.
- Error or warning: assertive alert.
- Loading or promise: stays until the page ends it.

## 6. Easy to get wrong

- Mount pixel-toast-container once. A second container fights the queue.
- Do not expect a loading toast to vanish on a timer.
- Do not put toast text in analytics.

## 7. Files

- `pixel-toast-container.html`
- `pixel-toast-container.scss`
- `pixel-toast-container.ts`
- `pixel-toast-inline.html`
- `pixel-toast-inline.scss`
- `pixel-toast-inline.ts`
- `pixel-toast.defaults.ts`
- `pixel-toast.html`
- `pixel-toast.scss`
- `pixel-toast.service.ts`
- `pixel-toast.ts`
- `pixel-toast.types.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
