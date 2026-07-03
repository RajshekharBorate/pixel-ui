import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelAppShellComponent,
  PixelButtonComponent,
  PixelContainerComponent,
  PixelFooterComponent,
  PixelHeaderComponent,
  PixelSidenavComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-app-shell-dashboard-example',
  standalone: true,
  imports: [
    PixelAppShellComponent,
    PixelHeaderComponent,
    PixelSidenavComponent,
    PixelFooterComponent,
    PixelContainerComponent,
    PixelButtonComponent,
  ],
  templateUrl: './app-shell-dashboard.example.html',
  styleUrl: './app-shell-dashboard.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellDashboardExample {
  protected readonly sidenavOpen = signal(true);
  protected readonly navLinks = ['Overview', 'Reports', 'Customers', 'Settings'];
  protected readonly activeLink = signal('Overview');
}
