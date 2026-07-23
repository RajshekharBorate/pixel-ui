import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  model,
  signal,
  viewChild,
} from '@angular/core';
import {
  PixelButtonComponent,
  PixelNavAnchorDirective,
  PixelNavigateService,
  PixelStepComponent,
  PixelStepContentComponent,
  PixelStepperComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-navigate-wizard-example',
  imports: [
    PixelButtonComponent,
    PixelStepperComponent,
    PixelStepComponent,
    PixelStepContentComponent,
    PixelNavAnchorDirective,
  ],
  template: `
    <p class="hint">
      Wizards are <strong>opt-in</strong>: without <code>registerWizard</code>,
      <code>wizard:</code> targets soft-fail. With registration, open + setStep restore a shared
      step link (form drafts stay app-owned).
    </p>
    <div class="actions">
      <pixel-button appearance="outline" leadingIcon="link_off" (click)="tryUnregistered()">
        Try without registration
      </pixel-button>
      <pixel-button appearance="solid" leadingIcon="play_arrow" (click)="openDocuments()">
        Open Documents step
      </pixel-button>
      <pixel-button appearance="outline" leadingIcon="close" (click)="closeWizard()">
        Close wizard
      </pixel-button>
    </div>

    @if (wizardOpen()) {
      <div class="wizard" pixelNavAnchor="claim-filing" id="claim-filing" role="dialog" aria-label="Claim filing">
        <h3>Claim filing</h3>
        <pixel-stepper type="wizard" navigationMode="free" [(selectedIndex)]="stepIndex">
          <pixel-step label="Details">
            <pixel-step-content>Enter claim basics.</pixel-step-content>
          </pixel-step>
          <pixel-step label="Documents">
            <pixel-step-content>Upload supporting documents.</pixel-step-content>
          </pixel-step>
          <pixel-step label="Review">
            <pixel-step-content>Confirm and submit.</pixel-step-content>
          </pixel-step>
        </pixel-stepper>
      </div>
    }

    @if (status()) {
      <p class="info">{{ status() }}</p>
    }
  `,
  styles: `
    .hint,
    .info {
      margin: 0 0 0.75rem;
      color: var(--pixel-sys-on-surface-variant, #444);
      font-size: 0.875rem;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-block-end: 1rem;
    }
    .wizard {
      padding: 1rem;
      border: 1px solid var(--pixel-sys-outline-variant, #ccc);
      border-radius: 0.5rem;
      background: var(--pixel-sys-surface, #fff);
    }
    .wizard h3 {
      margin: 0 0 0.75rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigateWizardExample {
  private readonly navigate = inject(PixelNavigateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly stepper = viewChild(PixelStepperComponent);

  readonly wizardOpen = signal(false);
  readonly stepIndex = model(0);
  readonly status = signal('');
  private registered = false;
  private unregister: (() => void) | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.unregister?.());
  }

  ensureRegistered(): void {
    if (this.registered) {
      return;
    }
    this.unregister = this.navigate.registerWizard({
      id: 'claim-filing',
      syncUrl: true,
      open: async () => {
        this.wizardOpen.set(true);
      },
      setStep: async (step) => {
        const index =
          typeof step === 'number'
            ? step
            : step === 'documents'
              ? 1
              : step === 'review'
                ? 2
                : 0;
        this.stepIndex.set(index);
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
        await this.stepper()?.jumpTo(index);
      },
      getStep: () => this.stepIndex(),
      close: () => this.wizardOpen.set(false),
    });
    this.registered = true;
  }

  async tryUnregistered(): Promise<void> {
    this.unregister?.();
    this.unregister = null;
    this.registered = false;
    this.wizardOpen.set(false);
    const result = await this.navigate.go({
      target: { type: 'wizard', id: 'claim-filing', step: 'documents' },
      onFailure: 'silent',
    });
    this.status.set(
      result.ok
        ? 'Unexpected success'
        : `Soft fail (${result.reason}): ${result.message}`,
    );
  }

  async openDocuments(): Promise<void> {
    this.ensureRegistered();
    const result = await this.navigate.go({
      target: { type: 'wizard', id: 'claim-filing', step: 'documents' },
      onFailure: 'silent',
      announce: 'Opened claim filing on Documents',
    });
    this.status.set(
      result.ok ? 'Wizard opened on Documents step.' : `${result.reason}: ${result.message}`,
    );
  }

  closeWizard(): void {
    this.wizardOpen.set(false);
    this.status.set('Wizard closed (ephemeral until registered open again).');
  }
}
