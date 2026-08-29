import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PixelFileUploadComponent from './pixel-file-upload';
import {
  PIXEL_UI_ANALYTICS,
  type PixelUiAnalyticsPort,
} from '../shared/analytics/pixel-ui-analytics';

@Component({
  imports: [PixelFileUploadComponent],
  template: `
    <pixel-file-upload
      analyticsId="attachments"
      [analyticsProperties]="{ feature: 'claims', fileCount: 999 }"
      [multiple]="true"
      [maxSize]="100000"
    />
  `,
})
class FileUploadAnalyticsHost {}

describe('pixel-file-upload analytics', () => {
  let port: PixelUiAnalyticsPort;

  beforeEach(() => {
    port = { track: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: PIXEL_UI_ANALYTICS, useValue: port }],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('emits privacy-safe select, reject, and remove events', () => {
    const fixture = TestBed.createComponent(FileUploadAnalyticsHost);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const accepted = new File(['report'], 'private-report.pdf', { type: 'application/pdf' });
    const rejected = new File([new Uint8Array(100_001)], 'secret-video.mp4', {
      type: 'video/mp4',
    });
    Object.defineProperty(input, 'files', { configurable: true, value: [accepted, rejected] });

    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(port.track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ui.file.select',
        properties: expect.objectContaining({
          uploadId: 'attachments',
          feature: 'claims',
          fileCount: 1,
          mimeCategories: { pdf: 1 },
          sizeBuckets: { lt_100kb: 1 },
        }),
      }),
    );
    expect(port.track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ui.file.reject',
        properties: expect.objectContaining({ fileCount: 1 }),
      }),
    );

    const payloads = JSON.stringify(vi.mocked(port.track).mock.calls);
    expect(payloads).not.toContain('private-report.pdf');
    expect(payloads).not.toContain('secret-video.mp4');

    (fixture.nativeElement.querySelector('.pixel-file-upload__remove') as HTMLButtonElement).click();
    expect(port.track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ui.file.remove',
        properties: expect.objectContaining({ fileCount: 0, reason: 'single' }),
      }),
    );
  });
});
