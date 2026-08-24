import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelButtonComponent,
  PixelInputComponent,
  PixelSelectComponent,
  PixelSelectOption,
  PixelStepComponent,
  PixelStepContentComponent,
  PixelStepperComponent,
  PixelToggleComponent,
} from 'pixel-ui';

/**
 * Phase 2 golden PAGE: settings wizard with stepper + form controls.
 * Route: `/playground/settings-wizard`
 */
@Component({
  selector: 'docs-settings-wizard-playground',
  imports: [
    PixelButtonComponent,
    PixelInputComponent,
    PixelSelectComponent,
    PixelStepComponent,
    PixelStepContentComponent,
    PixelStepperComponent,
    PixelToggleComponent,
  ],
  templateUrl: './settings-wizard-playground.html',
  styleUrl: './settings-wizard-playground.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsWizardPlaygroundComponent {
  protected readonly orgName = signal('Pixel Labs');
  protected readonly timezone = signal<unknown | null>('utc');
  protected readonly emailAlerts = signal(true);
  protected readonly digestWeekly = signal(false);
  protected readonly finished = signal(false);
  protected readonly loading = signal(true);

  protected readonly timezones: readonly PixelSelectOption[] = [
    { value: 'utc', label: 'UTC' },
    { value: 'ist', label: 'Asia/Kolkata' },
    { value: 'est', label: 'America/New_York' },
    { value: 'cet', label: 'Europe/Berlin' },
  ];

  constructor() {
    window.setTimeout(() => this.loading.set(false), 500);
  }

  protected onOrgName(value: string): void {
    this.orgName.set(value);
  }

  protected onFinished(): void {
    this.finished.set(true);
  }

  protected resetWizard(): void {
    this.orgName.set('Pixel Labs');
    this.timezone.set('utc');
    this.emailAlerts.set(true);
    this.digestWeekly.set(false);
    this.finished.set(false);
  }
}
