import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DocServiceApiRow } from '../../registry/types';

@Component({
  selector: 'docs-service-api-table',
  standalone: true,
  templateUrl: './doc-service-api-table.html',
  styleUrl: './doc-service-api-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocServiceApiTableComponent {
  readonly rows = input.required<readonly DocServiceApiRow[]>();
  readonly serviceName = input('Service');
}
