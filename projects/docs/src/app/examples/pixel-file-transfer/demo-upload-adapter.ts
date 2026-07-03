import { Injectable } from '@angular/core';
import { Observable, timer } from 'rxjs';
import { map, takeWhile } from 'rxjs';
import type {
  PixelUploadAdapter,
  PixelUploadProgress,
  PixelUploadFile,
  PixelUploadOptions,
} from 'pixel-ui';

/**
 * Demo-only upload adapter — simulates network progress so the docs examples run
 * without a backend. Emits 0→100 over ~2s, then a completion event. In a real app
 * you'd use the built-in PixelRestAdapter (or your own S3/Azure adapter) instead.
 */
@Injectable()
export class DemoUploadAdapter implements PixelUploadAdapter {
  upload(file: PixelUploadFile, _options: PixelUploadOptions): Observable<PixelUploadProgress> {
    // Larger files "take longer" — scale steps by size for a realistic feel.
    const steps = 20;
    const intervalMs = Math.min(120, 40 + file.size / 50_000);
    return timer(0, intervalMs).pipe(
      map((tick): PixelUploadProgress => {
        const pct = Math.min(100, Math.round((tick / steps) * 100));
        if (pct >= 100) {
          return { progress: 100, done: true, response: { fileId: file.id, url: `https://cdn.demo/${file.name}` } };
        }
        return { progress: pct, done: false };
      }),
      takeWhile((e) => !e.done, true),
    );
  }
}
