import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AUTH_DEMO_STYLES } from './authorization-demo.styles';

/**
 * Route helpers are app-owned; this example documents the wiring pattern (no live router).
 */
@Component({
  selector: 'docs-authorization-routes-example',
  template: `
    <p class="hint">
      A Viewer should never open the admin page — not just hide the menu link. Your app still
      owns Angular routes. Pixel answers “may they open this?” the same way it does for a button.
      If they are already on the page and you switch their role, leave that URL; the router will
      not re-run the guard by itself.
    </p>
    <p class="expect">
      This tile is a copy-paste snippet, not a live router. Try the App shell playground to
      click Admin as Viewer vs Admin.
    </p>
    <pre class="panel" style="white-space: pre-wrap; font-size: 0.75rem; overflow: auto">{{
      snippet
    }}</pre>
  `,
  styles: [AUTH_DEMO_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorizationRoutesExample {
  readonly snippet = `import {
  pixelAuthorizationCanMatch,
  pixelAuthorizationCanActivate,
  providePixelAuthorizationRouteWatcher,
} from 'pixel-ui/authorization';

export const routes = [
  {
    path: 'admin',
    canMatch: [
      pixelAuthorizationCanMatch({
        loginUrl: '/login',
        forbiddenUrl: '/home',
      }),
    ],
    data: { access: 'admin:panel' },
    loadChildren: () => import('./admin.routes'),
  },
];

// After setSubject (role / tenant / logout) while already on a gated page:
providePixelAuthorizationRouteWatcher({
  forbiddenUrl: '/home',
  loginUrl: '/login',
});`;
}
