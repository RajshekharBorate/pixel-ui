import { Injectable, signal } from '@angular/core';
import type {
  PixelNavActivationAdapter,
  PixelNavGridRevealApi,
  PixelNavWizardAdapter,
} from 'pixel-ui';

/**
 * Bridges shell-level navigate registrations to page-scoped adapters that appear
 * only after a child route activates (claims grid, billing tabs, etc.).
 */
@Injectable()
export class AppShellPlaygroundNavBridge {
  private readonly gridApi = signal<PixelNavGridRevealApi | null>(null);
  private readonly tabsAdapter = signal<PixelNavActivationAdapter | null>(null);
  private readonly accordionAdapter = signal<PixelNavActivationAdapter | null>(null);
  private readonly wizardAdapter = signal<PixelNavWizardAdapter | null>(null);

  /** When false, settings deep-links soft-fail with `forbidden`. */
  readonly settingsAllowed = signal(true);

  setGrid(api: PixelNavGridRevealApi | null): void {
    this.gridApi.set(api);
  }

  setTabsAdapter(adapter: PixelNavActivationAdapter | null): void {
    this.tabsAdapter.set(adapter);
  }

  setAccordionAdapter(adapter: PixelNavActivationAdapter | null): void {
    this.accordionAdapter.set(adapter);
  }

  setWizardAdapter(adapter: PixelNavWizardAdapter | null): void {
    this.wizardAdapter.set(adapter);
  }

  async revealClaimRow(
    rowId: string | number,
    options?: Parameters<PixelNavGridRevealApi['revealRow']>[1],
  ): Promise<boolean> {
    const api = await this.waitFor(() => this.gridApi());
    if (!api) {
      return false;
    }
    return api.revealRow(rowId, options);
  }

  async activateTabs(
    target: Parameters<PixelNavActivationAdapter['activate']>[0],
  ): Promise<void | boolean | Element | null> {
    const adapter = await this.waitFor(() => this.tabsAdapter());
    if (!adapter) {
      return false;
    }
    return adapter.activate(target);
  }

  async activateAccordion(
    target: Parameters<PixelNavActivationAdapter['activate']>[0],
  ): Promise<void | boolean | Element | null> {
    const adapter = await this.waitFor(() => this.accordionAdapter());
    if (!adapter) {
      return false;
    }
    return adapter.activate(target);
  }

  async openWizard(ctx: Parameters<PixelNavWizardAdapter['open']>[0]): Promise<void> {
    const adapter = await this.waitFor(() => this.wizardAdapter());
    if (!adapter) {
      throw new Error('Claim amendment wizard is not registered');
    }
    await adapter.open(ctx);
  }

  async waitForWizard(timeoutMs = 8_000): Promise<boolean> {
    return (await this.waitFor(() => this.wizardAdapter(), timeoutMs)) != null;
  }

  async setWizardStep(step: string | number): Promise<void> {
    const adapter = await this.waitFor(() => this.wizardAdapter());
    if (!adapter) {
      throw new Error('Claim amendment wizard is not registered');
    }
    await adapter.setStep(step);
  }

  getWizardStep(): string | number | null {
    return this.wizardAdapter()?.getStep?.() ?? null;
  }

  closeWizard(): void {
    this.wizardAdapter()?.close?.();
  }

  private async waitFor<T>(resolve: () => T | null, timeoutMs = 8_000): Promise<T | null> {
    const immediate = resolve();
    if (immediate) {
      return immediate;
    }
    const started = Date.now();
    return new Promise((settle) => {
      const tick = (): void => {
        const found = resolve();
        if (found) {
          settle(found);
          return;
        }
        if (Date.now() - started >= timeoutMs) {
          settle(null);
          return;
        }
        window.setTimeout(tick, 40);
      };
      tick();
    });
  }
}
