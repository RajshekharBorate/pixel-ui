import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import PixelSelectComponent, { PixelSelectOption } from './pixel-select';

class IntersectionObserverMock {
  constructor(private readonly callback: IntersectionObserverCallback) {}
  observe(): void {
    this.callback(
      [
        {
          isIntersecting: true,
        } as IntersectionObserverEntry,
      ],
      this as unknown as IntersectionObserver,
    );
  }
  disconnect(): void {}
  unobserve(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  root: Element | Document | null = null;
  rootMargin = '';
  thresholds: readonly number[] = [];
}

@Component({
  standalone: true,
  imports: [PixelSelectComponent],
  template: `
    <section class="theme-shell" [attr.data-theme]="theme()">
      <button type="button" class="tab-sentinel tab-sentinel--before">Before</button>
      <pixel-select
        label="Country"
        [mode]="mode()"
        [options]="options"
        [value]="value()"
        [searchable]="searchable()"
        [serverSearch]="serverSearch()"
        [searchDebounceMs]="0"
        [infiniteScroll]="infiniteScroll()"
        [hasMore]="hasMore()"
        [showSelectAll]="showSelectAll()"
        [disabled]="disabled()"
        [readonly]="readonly()"
        [showTags]="showTags()"
        [showSelectedCount]="showSelectedCount()"
        [required]="required()"
        [state]="state()"
        [highlightSearchMatches]="highlightSearchMatches()"
        (valueChange)="valueEvents.push($event)"
        (selectionChange)="selectionEvents.push($event)"
        (searchChange)="searchEvents.push($event)"
        (focusChange)="focusEvents.push($event)"
        (blurChange)="blurEvents.push($event)"
        (loadMore)="loadMoreEvents.push($event)"
        (openChange)="openEvents.push($event)"
      />
      <button type="button" class="tab-sentinel tab-sentinel--after">After</button>
    </section>
  `,
})
class HostComponent {
  readonly mode = signal<'single' | 'multiple'>('single');
  readonly value = signal<unknown | unknown[] | null>(null);
  readonly searchable = signal(true);
  readonly serverSearch = signal(false);
  readonly infiniteScroll = signal(false);
  readonly hasMore = signal(false);
  readonly showSelectAll = signal(true);
  readonly disabled = signal(false);
  readonly readonly = signal(false);
  readonly showTags = signal(true);
  readonly showSelectedCount = signal(true);
  readonly required = signal(true);
  readonly highlightSearchMatches = signal(true);
  readonly state = signal<'default' | 'error' | 'loading'>('default');
  readonly theme = signal<'light' | 'dark'>('light');
  readonly options: readonly PixelSelectOption[] = [
    { value: 1, label: 'India', subtitle: 'Asia' },
    { value: 2, label: 'Japan', subtitle: 'Asia' },
    { value: 3, label: 'Germany', subtitle: 'Europe' },
  ];

  readonly valueEvents: Array<unknown | unknown[] | null> = [];
  readonly selectionEvents: unknown[] = [];
  readonly searchEvents: string[] = [];
  readonly focusEvents: boolean[] = [];
  readonly blurEvents: boolean[] = [];
  readonly loadMoreEvents: Array<{ query: string; selectedCount: number }> = [];
  readonly openEvents: boolean[] = [];
}

@Component({
  standalone: true,
  imports: [PixelSelectComponent, ReactiveFormsModule],
  template: `
    <pixel-select label="Country" [mode]="mode()" [formControl]="control" [options]="options" [searchable]="false" />
  `,
})
class ReactiveFormsHostComponent {
  readonly mode = signal<'single' | 'multiple'>('single');
  readonly control = new FormControl<unknown | null>(null, Validators.required);
  readonly options: readonly PixelSelectOption[] = [
    { value: 1, label: 'India' },
    { value: 2, label: 'Japan' },
  ];
}

describe('PixelSelectComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeAll(() => {
    (globalThis as unknown as { IntersectionObserver: typeof IntersectionObserver }).IntersectionObserver =
      IntersectionObserverMock as unknown as typeof IntersectionObserver;
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function getComponent(): PixelSelectComponent {
    return fixture.debugElement.query(By.directive(PixelSelectComponent))
      .componentInstance as PixelSelectComponent;
  }

  function trigger(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.pixel-select__trigger') as HTMLButtonElement;
  }

  function openPanel(): void {
    trigger().click();
    fixture.detectChanges();
  }

  it('updates trigger text when host value changes', () => {
    host.value.set(2);
    fixture.detectChanges();

    expect(trigger().textContent).toContain('Japan');
  });

  it('emits valueChange when single option is selected', () => {
    openPanel();
    const option = document.querySelector('.pixel-select__option') as HTMLElement;
    option.click();
    fixture.detectChanges();

    expect(host.valueEvents.at(-1)).toBe(1);
  });

  it('supports multi-select and selected count', () => {
    host.mode.set('multiple');
    host.value.set([]);
    host.showTags.set(false);
    fixture.detectChanges();
    openPanel();

    const options = document.querySelectorAll('.pixel-select__option');
    (options[0] as HTMLElement).click();
    (options[1] as HTMLElement).click();
    fixture.detectChanges();

    expect(Array.isArray(host.valueEvents.at(-1))).toBe(true);
    expect(trigger().textContent).toContain('2 selected');
  });

  it('keeps focused chrome on the field while the panel is open even if focus moves to a checkbox', () => {
    host.mode.set('multiple');
    host.value.set([]);
    fixture.detectChanges();
    openPanel();
    const shell = fixture.nativeElement.querySelector('.pixel-select') as HTMLElement;
    expect(shell.classList.contains('pixel-select--focused')).toBe(true);

    const checkbox = document.querySelector(
      '.pixel-select__option-checkbox input[type="checkbox"]',
    ) as HTMLInputElement;
    checkbox.focus();
    fixture.detectChanges();

    const cmp = getComponent() as unknown as { isFocused: () => boolean };
    expect(cmp.isFocused()).toBe(false);
    expect(shell.classList.contains('pixel-select--focused')).toBe(true);
  });

  it('uses option checkboxes in multi mode and hides the trailing check glyph', () => {
    host.mode.set('multiple');
    host.value.set([]);
    fixture.detectChanges();
    openPanel();
    expect(document.querySelectorAll('.pixel-select__check')).toHaveLength(0);
    // Count option-row checkboxes only (exclude the select-all row, which reuses the same class).
    expect(
      document.querySelectorAll(
        '.pixel-select__option:not(.pixel-select__select-all-row) .pixel-select__option-checkbox',
      ).length,
    ).toBe(3);
  });

  it('shows trailing check icon for the selected row in single mode', () => {
    host.mode.set('single');
    host.value.set(null);
    fixture.detectChanges();
    openPanel();
    (document.querySelector('.pixel-select__option') as HTMLElement).click();
    fixture.detectChanges();
    openPanel();
    expect(document.querySelectorAll('.pixel-select__check').length).toBe(1);
  });

  it('renders multi-select tags in the trigger', () => {
    host.mode.set('multiple');
    host.value.set([]);
    host.showTags.set(true);
    fixture.detectChanges();
    openPanel();

    const options = document.querySelectorAll('.pixel-select__option');
    (options[0] as HTMLElement).click();
    (options[1] as HTMLElement).click();
    (options[2] as HTMLElement).click();
    fixture.detectChanges();

    const visibleRow = fixture.nativeElement.querySelector(
      '.pixel-select__trigger .pixel-select__tags:not(.pixel-select__tags--measure)',
    ) as HTMLElement | null;
    expect(visibleRow).toBeTruthy();
    const pills = visibleRow!.querySelectorAll('.pixel-select__tag-chip');
    expect(pills.length).toBeGreaterThanOrEqual(1);
  });

  it('filters options in client-side search', () => {
    openPanel();
    const searchInput = document.querySelector(
      '.pixel-select__panel-search .pixel-input__native',
    ) as HTMLInputElement;
    searchInput.value = 'ger';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    const options = document.querySelectorAll('.pixel-select__option');
    expect(options).toHaveLength(1);
    expect((options[0] as HTMLElement).textContent).toContain('Germany');
  });

  it('emits searchChange for server search', () => {
    host.serverSearch.set(true);
    fixture.detectChanges();
    openPanel();
    const searchInput = document.querySelector(
      '.pixel-select__panel-search .pixel-input__native',
    ) as HTMLInputElement;
    searchInput.value = 'in';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(host.searchEvents.at(-1)).toBe('in');
  });

  it('emits loadMore from infinite scroll sentinel', () => {
    host.infiniteScroll.set(true);
    host.hasMore.set(true);
    fixture.detectChanges();
    openPanel();
    fixture.detectChanges();

    expect(host.loadMoreEvents.length).toBeGreaterThan(0);
  });

  it('selects and unselects all in multiple mode', () => {
    host.mode.set('multiple');
    fixture.detectChanges();
    openPanel();
    const row = document.querySelector(
      '.pixel-select__select-all-row input[type="checkbox"]',
    ) as HTMLInputElement;
    row.click();
    fixture.detectChanges();
    expect((host.valueEvents.at(-1) as unknown[]).length).toBe(3);

    row.click();
    fixture.detectChanges();
    expect(host.valueEvents.at(-1)).toEqual([]);
  });

  it('closes the panel when the transparent backdrop is clicked', () => {
    openPanel();
    expect(document.querySelector('.pixel-select__panel')).toBeTruthy();

    // Outside pointers physically land on the backdrop, which swallows the dismissing click.
    const backdrop = document.querySelector('.pixel-overlay-backdrop') as HTMLElement;
    expect(backdrop).toBeTruthy();
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(document.querySelector('.pixel-select__panel')).toBeNull();
    expect(document.querySelector('.pixel-overlay-backdrop')).toBeNull();
  });

  it('does not close the panel on pointer interaction inside the panel', () => {
    openPanel();
    const panel = document.querySelector('.pixel-select__panel') as HTMLElement;
    expect(panel).toBeTruthy();

    panel.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    panel.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(document.querySelector('.pixel-select__panel')).toBeTruthy();
  });

  it('closes the panel on Tab and moves focus to the next tab stop', async () => {
    openPanel();
    expect(document.querySelector('.pixel-select__panel')).toBeTruthy();
    trigger().focus();
    trigger().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();

    const after = fixture.nativeElement.querySelector('.tab-sentinel--after') as HTMLButtonElement;
    expect(document.querySelector('.pixel-select__panel')).toBeNull();
    expect(document.activeElement).toBe(after);
  });

  it('closes the panel on Shift+Tab and moves focus to the previous tab stop', async () => {
    openPanel();
    trigger().focus();
    trigger().dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    fixture.detectChanges();
    await fixture.whenStable();

    const before = fixture.nativeElement.querySelector('.tab-sentinel--before') as HTMLButtonElement;
    expect(document.querySelector('.pixel-select__panel')).toBeNull();
    expect(document.activeElement).toBe(before);
  });

  it('prevents interaction when disabled', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    openPanel();
    expect(document.querySelector('.pixel-select__panel')).toBeNull();
  });

  it('prevents value change when readonly', () => {
    host.readonly.set(true);
    fixture.detectChanges();
    openPanel();
    const option = document.querySelector('.pixel-select__option') as HTMLElement;
    option.click();
    fixture.detectChanges();
    expect(host.valueEvents).toHaveLength(0);
  });

  it('opens list keyboard focus on the selected visible option (single)', () => {
    host.value.set(2);
    fixture.detectChanges();
    openPanel();
    const cmp = getComponent() as unknown as { focusedIndex: () => number };
    expect(cmp.focusedIndex()).toBe(1);
  });

  it('opens list keyboard focus on the first visible selected option in list order (multi)', () => {
    host.mode.set('multiple');
    host.value.set([3, 1]);
    fixture.detectChanges();
    openPanel();
    const cmp = getComponent() as unknown as { focusedIndex: () => number };
    expect(cmp.focusedIndex()).toBe(0);
  });

  it('opens list keyboard focus at first option when selection is not in the visible list', () => {
    host.value.set(99);
    fixture.detectChanges();
    openPanel();
    const cmp = getComponent() as unknown as { focusedIndex: () => number };
    expect(cmp.focusedIndex()).toBe(0);
  });

  it('does not wrap keyboard highlight from last option to first on ArrowDown', () => {
    openPanel();
    const cmp = getComponent() as unknown as { focusedIndex: () => number };
    const triggerEl = trigger();
    expect(cmp.focusedIndex()).toBe(0);

    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(cmp.focusedIndex()).toBe(2);

    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(cmp.focusedIndex()).toBe(2);

    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    fixture.detectChanges();
    expect(cmp.focusedIndex()).toBe(1);

    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    fixture.detectChanges();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    fixture.detectChanges();
    expect(cmp.focusedIndex()).toBe(0);
  });

  it('supports keyboard navigation and Enter/Space selection from combobox trigger (Material-style)', () => {
    trigger().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    trigger().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(host.valueEvents.at(-1)).toBe(1);

    trigger().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    trigger().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    trigger().dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(host.valueEvents.at(-1)).toBe(2);
  });

  it('supports removing latest tag with backspace in multi mode', () => {
    host.mode.set('multiple');
    host.value.set([1, 2]);
    fixture.detectChanges();

    trigger().dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    fixture.detectChanges();

    expect(host.valueEvents.at(-1)).toEqual([1]);
  });

  it('emits focus and blur outputs', () => {
    trigger().dispatchEvent(new FocusEvent('focus'));
    trigger().dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();

    expect(host.focusEvents).toEqual([true]);
    expect(host.blurEvents).toEqual([true]);
  });

  it('updates computed selected count in component instance', () => {
    host.mode.set('multiple');
    host.value.set([1, 2, 3]);
    fixture.detectChanges();
    const component = getComponent() as unknown as { selectedCount: () => number };
    expect(component.selectedCount()).toBe(3);
  });

  it('provides combobox and listbox aria attributes', () => {
    openPanel();
    const triggerEl = trigger();
    const panel = document.querySelector('.pixel-select__panel') as HTMLElement;
    const firstOption = document.querySelector('.pixel-select__option') as HTMLElement;

    expect(triggerEl.getAttribute('role')).toBe('combobox');
    expect(triggerEl.getAttribute('aria-expanded')).toBe('true');
    expect(panel.getAttribute('role')).toBe('listbox');
    expect(firstOption.getAttribute('role')).toBe('option');
  });

  it('exposes css variables in light mode', () => {
    const hostElement = fixture.nativeElement.querySelector('pixel-select') as HTMLElement;
    const styles = getComputedStyle(hostElement);
    expect(styles.getPropertyValue('--pixel-sys-primary').trim()).toBe('#2962ff');
    expect(styles.getPropertyValue('--pixel-select-bg').trim()).toBe('var(--pixel-sys-surface, #fdfbff)');
  });

  it('switches css variables for dark theme', () => {
    host.theme.set('dark');
    fixture.detectChanges();
    const hostElement = fixture.nativeElement.querySelector('pixel-select') as HTMLElement;
    const styles = getComputedStyle(hostElement);
    expect(styles.getPropertyValue('--pixel-sys-primary').trim()).toBe('#ffabf3');
  });

  it('shows error state attributes when configured', () => {
    host.state.set('error');
    fixture.detectChanges();
    expect(trigger().getAttribute('aria-invalid')).toBe('true');
  });
});

describe('PixelSelectComponent reactive forms touched', () => {
  let fixture: ComponentFixture<ReactiveFormsHostComponent>;
  let host: ReactiveFormsHostComponent;

  beforeAll(() => {
    (globalThis as unknown as { IntersectionObserver: typeof IntersectionObserver }).IntersectionObserver =
      IntersectionObserverMock as unknown as typeof IntersectionObserver;
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ReactiveFormsHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(ReactiveFormsHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function trigger(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.pixel-select__trigger') as HTMLButtonElement;
  }

  it('marks control touched when the panel closes, not when the trigger blurs while the panel is open', () => {
    expect(host.control.touched).toBe(false);

    trigger().click();
    fixture.detectChanges();
    expect(host.control.touched).toBe(false);

    trigger().dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(host.control.touched).toBe(false);

    (document.querySelector('.pixel-select__option') as HTMLElement).click();
    fixture.detectChanges();
    expect(host.control.touched).toBe(true);
    expect(host.control.value).toBe(1);
  });

  it('does not mark touched on multi option clicks while the panel stays open; marks touched when the panel closes', () => {
    host.control.setValue([]);
    host.mode.set('multiple');
    fixture.detectChanges();

    trigger().click();
    fixture.detectChanges();
    expect(host.control.touched).toBe(false);

    const options = document.querySelectorAll('.pixel-select__option');
    (options[0] as HTMLElement).click();
    fixture.detectChanges();
    expect(host.control.touched).toBe(false);

    const backdrop = document.querySelector('.pixel-overlay-backdrop') as HTMLElement;
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(host.control.touched).toBe(true);
  });
});
