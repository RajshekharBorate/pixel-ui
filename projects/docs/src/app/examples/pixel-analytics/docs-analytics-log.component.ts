import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { PixelButtonComponent, PixelToastService } from 'pixel-ui';
import type { PixelAnalyticsEvent } from 'pixel-analytics';
import {
  DocsAnalyticsCaptureStore,
  formatDocsAnalyticsEventJson,
  formatDocsAnalyticsSampleJson,
} from './docs-analytics-harness';

@Component({
  selector: 'docs-analytics-log',
  imports: [PixelButtonComponent],
  templateUrl: './docs-analytics-log.component.html',
  styleUrl: './docs-analytics-log.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DocsAnalyticsLogComponent {
  readonly expected = input.required<readonly Record<string, unknown>[]>();
  readonly emptyMessage = input('Interact to capture events.');

  protected readonly capture = inject(DocsAnalyticsCaptureStore);
  private readonly toast = inject(PixelToastService);

  protected readonly showReference = signal(false);

  protected formatSample(sample: Record<string, unknown>): string {
    return formatDocsAnalyticsSampleJson(sample);
  }

  protected formatEvent(event: PixelAnalyticsEvent): string {
    return formatDocsAnalyticsEventJson(event);
  }

  protected toggleReference(): void {
    this.showReference.update((open) => !open);
  }

  protected async copyText(label: string, text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.toast.success('Copied', label, { timeOut: 2200 });
    } catch {
      this.toast.error('Copy failed', 'Could not access the clipboard.');
    }
  }

  protected copyEvent(event: PixelAnalyticsEvent): void {
    void this.copyText(`${event.name} copied`, this.formatEvent(event));
  }

  protected copyAllEvents(): void {
    const blocks = this.capture.events().map((event) => this.formatEvent(event));
    if (!blocks.length) {
      return;
    }
    void this.copyText('All captured events copied', blocks.join('\n\n---\n\n'));
  }

  protected copyReference(): void {
    const blocks = this.expected().map((sample) => this.formatSample(sample));
    void this.copyText('Reference JSON copied', blocks.join('\n\n---\n\n'));
  }
}
