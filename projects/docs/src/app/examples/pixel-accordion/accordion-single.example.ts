import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelAccordionComponent,
  PixelExpansionPanelComponent,
  type PixelBadgeState,
} from 'pixel-ui';

interface FaqItem {
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly badge: string | number;
  readonly badgeState: PixelBadgeState;
  readonly body: string;
}

@Component({
  selector: 'docs-accordion-single-example',
  standalone: true,
  imports: [PixelAccordionComponent, PixelExpansionPanelComponent],
  template: `
    <pixel-accordion>
      @for (faq of faqs; track faq.title) {
        <pixel-expansion-panel
          [title]="faq.title"
          [description]="faq.description"
          [icon]="faq.icon"
          [badge]="faq.badge"
          [badgeState]="faq.badgeState"
        >
          <p class="body">{{ faq.body }}</p>
        </pixel-expansion-panel>
      }
    </pixel-accordion>
  `,
  styles: `
    .body {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.55;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccordionSingleExample {
  protected readonly faqs: readonly FaqItem[] = [
    {
      title: 'Billing & invoices',
      description: 'Payment methods and receipts',
      icon: 'receipt_long',
      badge: 2,
      badgeState: 'error',
      body: 'Invoices are issued on the first of each month. Update your payment method from Settings → Billing.',
    },
    {
      title: 'Security',
      description: 'SSO, MFA, and audit logs',
      icon: 'security',
      badge: '',
      badgeState: 'active',
      body: 'Enterprise plans support SAML SSO and enforced multi-factor authentication.',
    },
    {
      title: 'Data & exports',
      description: 'Where your data lives',
      icon: 'cloud_download',
      badge: 'New',
      badgeState: 'active',
      body: 'Export any table to CSV or JSON. Data is encrypted at rest with AES-256.',
    },
  ];
}
