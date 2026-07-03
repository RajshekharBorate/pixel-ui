import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelSelectComponent, PixelSelectOption } from 'pixel-ui';

@Component({
  selector: 'docs-select-overflow-tooltips-example',
  standalone: true,
  imports: [PixelSelectComponent],
  template: `
    <div class="narrow">
      <pixel-select
        [searchable]="true"
        label="Workspace"
        panelWidth="match-trigger"
        [options]="options"
        [value]="value()"
        (valueChange)="value.set($event)"
      />
    </div>
  `,
  styles: `
    .narrow {
      max-width: 14rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectOverflowTooltipsExample {
  protected readonly value = signal<unknown | null>(1);

  protected readonly options: readonly PixelSelectOption[] = [
    {
      value: 1,
      label: 'Quarterly revenue reconciliation and forecasting workspace (EMEA)',
      subtitle: 'Owned by the Financial Planning & Analysis cross-functional guild',
      icon: 'insights',
    },
    {
      value: 2,
      label: 'Customer onboarding automation pipeline — North America region',
      subtitle: 'Lifecycle marketing, growth, and data-engineering collaboration',
      icon: 'rocket_launch',
    },
    {
      value: 3,
      label: 'Infrastructure reliability and incident-response coordination board',
      subtitle: 'Platform SRE, on-call rotations, and postmortem tracking',
      icon: 'shield',
    },
    { value: 4, label: 'Short label', subtitle: 'Fits without truncation', icon: 'check_circle' },
  ];
}
