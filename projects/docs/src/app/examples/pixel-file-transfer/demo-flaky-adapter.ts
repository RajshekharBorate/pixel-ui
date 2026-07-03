import { Injectable } from '@angular/core';
import { Observable, timer, map, takeWhile } from 'rxjs';
import type {
  PixelUploadAdapter,
  PixelUploadProgress,
  PixelUploadFile,
  PixelUploadOptions,
} from 'pixel-ui';

/**
 * Demo-only adapter that FAILS the first two attempts of each file, then succeeds —
 * so the auto-retry + exponential-backoff path is observable without a real backend.
 */
@Injectable()
export class DemoFlakyAdapter implements PixelUploadAdapter {
  private attempts = new Map<string, number>();

  upload(file: PixelUploadFile, _options: PixelUploadOptions): Observable<PixelUploadProgress> {
    const n = (this.attempts.get(file.id) ?? 0) + 1;
    this.attempts.set(file.id, n);
    const shouldFail = n <= 2;

    return timer(0, 90).pipe(
      map((tick): PixelUploadProgress => {
        const pct = Math.min(100, tick * 12);
        // Fail partway through on the first two attempts.
        if (shouldFail && pct >= 60) {
          throw new Error('Simulated network error');
        }
        if (pct >= 100) {
          return { progress: 100, done: true, response: { fileId: file.id } };
        }
        return { progress: pct, done: false };
      }),
      takeWhile((e) => !e.done, true),
    );
  }
}
