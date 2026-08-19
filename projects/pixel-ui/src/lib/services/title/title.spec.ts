import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router, TitleStrategy } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PIXEL_TITLE_DEFAULTS,
  resolvePixelTitleConfig,
  type PixelTitleParts,
} from './title.config';
import {
  ellipsizeTitle,
  formatPixelTitle,
  normalizeTitleCount,
  sanitizeTitleText,
} from './title.format';
import { providePixelTitle } from './title.provide';
import { PixelTitleService } from './title.service';
import { PixelTitleStrategy } from './title.strategy';

@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TitleRouteHost {
  readonly titles = inject(PixelTitleService);
}

function config(patch: Parameters<typeof resolvePixelTitleConfig>[0]) {
  return resolvePixelTitleConfig({ suffix: 'Acme', defaultTitle: 'Home', ...patch });
}

describe('title format helpers', () => {
  it('sanitizes control characters, tags, and collapsed whitespace', () => {
    expect(sanitizeTitleText('  Inbox\n\t(new)  ')).toBe('Inbox (new)');
    expect(sanitizeTitleText('A\u0000B<b>x</b>C')).toBe('ABxC');
  });

  it('omits non-positive counts', () => {
    expect(normalizeTitleCount(0)).toBeNull();
    expect(normalizeTitleCount(-1)).toBeNull();
    expect(normalizeTitleCount(3.9)).toBe(3);
  });

  it('composes page, optional section, count badge, and suffix', () => {
    expect(formatPixelTitle({ page: 'Inbox' }, config({}))).toBe('Inbox · Acme');
    expect(formatPixelTitle({ page: 'Inbox', section: 'Security' }, config({}))).toBe(
      'Inbox · Security · Acme',
    );
    expect(formatPixelTitle({ page: 'Inbox', count: 3 }, config({}))).toBe('(3) Inbox · Acme');
  });

  it('falls back to defaultTitle when page is empty', () => {
    expect(formatPixelTitle({ page: '' }, config({}))).toBe('Home · Acme');
  });

  it('applies prefix when configured', () => {
    expect(formatPixelTitle({ page: 'Policies' }, config({ prefix: 'Acme', suffix: '' }))).toBe(
      'Acme · Policies',
    );
  });

  it('shortens page first and keeps the brand suffix', () => {
    const cfg = config({ maxLength: 20 });
    const result = formatPixelTitle({ page: 'Inbox messages forever' }, cfg);
    expect(result.endsWith(' · Acme')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result).toContain('…');
  });

  it('ellipsizes when even the brand overflows', () => {
    expect(ellipsizeTitle('Abcd', 3)).toBe('Ab…');
    const result = formatPixelTitle({ page: 'X' }, config({ suffix: 'VeryLongBrandName', maxLength: 8 }));
    expect(result.length).toBeLessThanOrEqual(8);
  });

  it('uses a custom formatter then still clips to maxLength', () => {
    const result = formatPixelTitle(
      { page: 'Inbox' },
      config({
        maxLength: 10,
        format: (parts: PixelTitleParts) => `APP/${parts.page}/END`,
      }),
    );
    expect(result.length).toBeLessThanOrEqual(10);
    expect(result.startsWith('APP/')).toBe(true);
  });
});

describe('PixelTitleService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [providePixelTitle({ suffix: 'Acme', defaultTitle: 'Home' })],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('writes Angular Title with suffix', () => {
    const titles = TestBed.inject(PixelTitleService);
    const browserTitle = TestBed.inject(Title);
    titles.set('Policies');
    expect(browserTitle.getTitle()).toBe('Policies · Acme');
    expect(titles.value()).toBe('Policies · Acme');
  });

  it('replaces parts on each set (does not keep a stale count)', () => {
    const titles = TestBed.inject(PixelTitleService);
    titles.set({ page: 'Inbox', count: 3 });
    titles.set('Policies');
    expect(TestBed.inject(Title).getTitle()).toBe('Policies · Acme');
  });

  it('debounces count-only updates and last write wins', () => {
    vi.useFakeTimers();
    const titles = TestBed.inject(PixelTitleService);
    const browserTitle = TestBed.inject(Title);
    titles.set({ page: 'Inbox', count: 3 });
    expect(browserTitle.getTitle()).toBe('(3) Inbox · Acme');

    titles.set({ page: 'Inbox', count: 4 });
    titles.set({ page: 'Inbox', count: 5 });
    expect(browserTitle.getTitle()).toBe('(3) Inbox · Acme');

    vi.advanceTimersByTime(1000);
    expect(browserTitle.getTitle()).toBe('(5) Inbox · Acme');
  });

  it('cancels a pending count debounce when the page changes', () => {
    vi.useFakeTimers();
    const titles = TestBed.inject(PixelTitleService);
    titles.set({ page: 'Inbox', count: 3 });
    titles.set({ page: 'Inbox', count: 9 });
    titles.set('Policies');
    vi.advanceTimersByTime(1000);
    expect(TestBed.inject(Title).getTitle()).toBe('Policies · Acme');
  });

  it('reset restores defaultTitle', () => {
    const titles = TestBed.inject(PixelTitleService);
    titles.set('Policies');
    titles.reset();
    expect(TestBed.inject(Title).getTitle()).toBe('Home · Acme');
  });

  it('setError uses overridable labels', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        providePixelTitle({
          suffix: 'Acme',
          labels: { notFound: 'Missing', forbidden: 'No access' },
        }),
      ],
    });
    const titles = TestBed.inject(PixelTitleService);
    titles.setError('not-found');
    expect(TestBed.inject(Title).getTitle()).toBe('Missing · Acme');
    titles.setError('forbidden');
    expect(TestBed.inject(Title).getTitle()).toBe('No access · Acme');
    titles.setError('error');
    expect(TestBed.inject(Title).getTitle()).toBe('Something went wrong · Acme');
  });

  it('fromTrail uses the last crumb label', () => {
    const titles = TestBed.inject(PixelTitleService);
    titles.fromTrail([{ label: 'Home' }, { label: 'Policies' }]);
    expect(TestBed.inject(Title).getTitle()).toBe('Policies · Acme');
  });

  it('ignores stale async writes when navigationId does not match', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        providePixelTitle({ suffix: 'Acme' }),
        {
          provide: Router,
          useValue: { lastSuccessfulNavigation: () => ({ id: 7 }) },
        },
      ],
    });
    const titles = TestBed.inject(PixelTitleService);
    titles.set('Current');
    titles.set('Stale', { navigationId: 3 });
    expect(TestBed.inject(Title).getTitle()).toBe('Current · Acme');
    titles.set('Fresh', { navigationId: 7 });
    expect(TestBed.inject(Title).getTitle()).toBe('Fresh · Acme');
  });

  it('warns in dev when the page is empty and defaultTitle is missing', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [providePixelTitle({ suffix: 'Acme' })],
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    TestBed.inject(PixelTitleService).set('');
    expect(warn).toHaveBeenCalled();
  });
});

describe('providePixelTitle + PixelTitleStrategy', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('does not replace TitleStrategy unless syncRouterTitle is on', () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), providePixelTitle({ suffix: 'Acme' })],
    });
    expect(TestBed.inject(TitleStrategy)).not.toBeInstanceOf(PixelTitleStrategy);
  });

  it('applies the formatter to the leaf route title after navigation', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'inbox', component: TitleRouteHost, title: 'Inbox' }]),
        providePixelTitle({ suffix: 'Acme', defaultTitle: 'Home', syncRouterTitle: true }),
      ],
    });
    expect(TestBed.inject(TitleStrategy)).toBeInstanceOf(PixelTitleStrategy);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/inbox');
    expect(TestBed.inject(Title).getTitle()).toBe('Inbox · Acme');
  });

  it('resets to defaultTitle when the leaf route has no title', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'inbox', component: TitleRouteHost, title: 'Inbox' },
          { path: 'blank', component: TitleRouteHost },
        ]),
        providePixelTitle({ suffix: 'Acme', defaultTitle: 'Home', syncRouterTitle: true }),
      ],
    });
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/inbox');
    await router.navigateByUrl('/blank');
    expect(TestBed.inject(Title).getTitle()).toBe('Home · Acme');
  });
});

describe('PIXEL_TITLE_DEFAULTS', () => {
  it('uses a middle-dot separator and 60-character cap', () => {
    expect(PIXEL_TITLE_DEFAULTS.separator).toBe(' · ');
    expect(PIXEL_TITLE_DEFAULTS.maxLength).toBe(60);
    expect(PIXEL_TITLE_DEFAULTS.syncRouterTitle).toBe(false);
  });
});
