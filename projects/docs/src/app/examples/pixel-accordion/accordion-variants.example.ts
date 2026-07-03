import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelAccordionComponent,
  PixelButtonComponent,
  PixelExpansionPanelComponent,
  type PixelAccordionVariant,
} from 'pixel-ui';

@Component({
  selector: 'docs-accordion-variants-example',
  standalone: true,
  imports: [PixelAccordionComponent, PixelExpansionPanelComponent, PixelButtonComponent],
  template: `
    <div class="controls" role="group" aria-label="Variant">
      @for (variant of variants; track variant) {
        <pixel-button
          size="sm"
          [appearance]="activeVariant() === variant ? 'solid' : 'outline'"
          (click)="activeVariant.set(variant)"
        >
          {{ variant }}
        </pixel-button>
      }
    </div>

    <pixel-accordion [multi]="true" [variant]="activeVariant()">
      <pixel-expansion-panel title="Billing" description="Payment methods" icon="receipt_long">
        <p class="body">Invoices are issued on the first of each month.</p>
      </pixel-expansion-panel>
      <pixel-expansion-panel title="Security" description="SSO and MFA" icon="security" [expanded]="true">
        <p class="body">Enterprise plans support SAML SSO and enforced MFA.</p>
      </pixel-expansion-panel>
      <pixel-expansion-panel title="Exports" description="Download your data" icon="cloud_download">
        <p class="body">Export any table to CSV or JSON.</p>
      </pixel-expansion-panel>
    </pixel-accordion>
  `,
  styles: `
    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-block-end: 1rem;
    }

    .body {
      margin: 0;
      font-size: 0.875rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccordionVariantsExample {
  protected readonly variants: readonly PixelAccordionVariant[] = ['default', 'flush', 'elevated'];
  protected readonly activeVariant = signal<PixelAccordionVariant>('default');
}
