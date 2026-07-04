import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelBreadcrumbComponent,
  PixelBreadcrumbItemComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-breadcrumb-declarative-example',
  imports: [PixelBreadcrumbComponent, PixelBreadcrumbItemComponent],
  template: `
    <pixel-breadcrumb separatorIcon="chevron_right" showHomeIcon>
      <pixel-breadcrumb-item label="Dashboard" link="/" icon="home" />
      <pixel-breadcrumb-item label="Users" link="/users" />
      <pixel-breadcrumb-item label="User details" active />
    </pixel-breadcrumb>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbDeclarativeExample {}
