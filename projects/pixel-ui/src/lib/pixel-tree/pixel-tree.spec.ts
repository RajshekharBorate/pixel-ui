import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelTreeComponent from './pixel-tree';
import type {
  PixelTreeNode,
  PixelTreeNodeId,
  PixelTreeSelectionChangeEvent,
  PixelTreeSelectionMode,
} from './pixel-tree.types';

const FILES: readonly PixelTreeNode[] = [
  {
    id: 'src',
    label: 'src',
    icon: 'folder',
    children: [
      { id: 'app', label: 'app', children: [{ id: 'main', label: 'main.ts' }] },
      { id: 'index', label: 'index.html' },
    ],
  },
  { id: 'readme', label: 'README.md' },
  { id: 'locked', label: 'locked.bin', disabled: true },
];

@Component({
  imports: [PixelTreeComponent],
  template: `
    <section class="theme-shell" [attr.data-theme]="theme()">
      <pixel-tree
        ariaLabel="Files"
        [nodes]="nodes()"
        [selectionMode]="mode()"
        [(expandedIds)]="expanded"
        [(selectedIds)]="selected"
        [loadChildren]="loader()"
        (selectionChange)="events.push($event)"
      />
    </section>
  `,
})
class HostComponent {
  readonly nodes = signal<readonly PixelTreeNode[]>(FILES);
  readonly mode = signal<PixelTreeSelectionMode>('none');
  readonly expanded = signal<readonly PixelTreeNodeId[]>([]);
  readonly selected = signal<readonly PixelTreeNodeId[]>([]);
  readonly loader = signal<((node: PixelTreeNode) => Promise<readonly PixelTreeNode[]>) | null>(
    null,
  );
  readonly theme = signal<'light' | 'dark'>('light');
  readonly events: PixelTreeSelectionChangeEvent[] = [];
  readonly tree = viewChild.required(PixelTreeComponent);
}

describe('PixelTreeComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function rows(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('[role="treeitem"]'));
  }

  function rowByLabel(label: string): HTMLElement {
    const row = rows().find((el) => el.textContent?.includes(label));
    if (!row) {
      throw new Error(`row not found: ${label}`);
    }
    return row;
  }

  it('renders only root rows until branches expand, with full ARIA geometry', () => {
    expect(rows().length).toBe(3);
    const src = rowByLabel('src');
    expect(src.getAttribute('aria-level')).toBe('1');
    expect(src.getAttribute('aria-posinset')).toBe('1');
    expect(src.getAttribute('aria-setsize')).toBe('3');
    expect(src.getAttribute('aria-expanded')).toBe('false');
    expect(rowByLabel('README.md').getAttribute('aria-expanded')).toBeNull();
  });

  it('expands and collapses via the arrow, updating the two-way expandedIds', () => {
    (rowByLabel('src').querySelector('.pixel-tree__arrow') as HTMLElement).click();
    fixture.detectChanges();
    expect(host.expanded()).toEqual(['src']);
    expect(rows().length).toBe(5);
    expect(rowByLabel('app').getAttribute('aria-level')).toBe('2');

    (rowByLabel('src').querySelector('.pixel-tree__arrow') as HTMLElement).click();
    fixture.detectChanges();
    expect(host.expanded()).toEqual([]);
    expect(rows().length).toBe(3);
  });

  it('implements the WAI-ARIA keyboard contract with roving tabindex', () => {
    const first = rowByLabel('src');
    expect(first.getAttribute('tabindex')).toBe('0');
    expect(rowByLabel('README.md').getAttribute('tabindex')).toBe('-1');

    first.focus();
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(first.getAttribute('aria-expanded')).toBe('true');

    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement?.textContent).toContain('app');

    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
    );
    fixture.detectChanges();
    expect(document.activeElement?.textContent).toContain('src');

    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true }),
    );
    fixture.detectChanges();
    expect(document.activeElement?.textContent).toContain('locked.bin');
  });

  it('handles single selection via Enter with aria-selected', () => {
    host.mode.set('single');
    fixture.detectChanges();

    const readme = rowByLabel('README.md');
    readme.focus();
    readme.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(host.selected()).toEqual(['readme']);
    expect(rowByLabel('README.md').getAttribute('aria-selected')).toBe('true');
    expect(host.events.at(-1)?.selected).toBe(true);
    expect(host.events.at(-1)?.source).toBe('keyboard');
  });

  it('cascades checkbox selection down and derives indeterminate parents', () => {
    host.mode.set('checkbox');
    host.expanded.set(['src', 'app']);
    fixture.detectChanges();

    // Selecting the branch selects its whole closure.
    rowByLabel('src').click();
    fixture.detectChanges();
    expect(new Set(host.selected())).toEqual(new Set(['src', 'app', 'main', 'index']));
    expect(rowByLabel('src').getAttribute('aria-checked')).toBe('true');

    // Deselecting one leaf leaves the parents mixed.
    rowByLabel('index.html').click();
    fixture.detectChanges();
    expect(rowByLabel('src').getAttribute('aria-checked')).toBe('mixed');
    expect(rowByLabel('app').getAttribute('aria-checked')).toBe('true');
  });

  it('ignores interaction on disabled nodes', () => {
    host.mode.set('single');
    fixture.detectChanges();
    rowByLabel('locked.bin').click();
    fixture.detectChanges();
    expect(host.selected()).toEqual([]);
  });

  it('lazily loads children with aria-busy and caches the result', async () => {
    let calls = 0;
    host.nodes.set([{ id: 'remote', label: 'remote', hasChildren: true }]);
    host.loader.set(() => {
      calls++;
      return Promise.resolve([{ id: 'child', label: 'loaded-child' }]);
    });
    fixture.detectChanges();

    (rowByLabel('remote').querySelector('.pixel-tree__arrow') as HTMLElement).click();
    fixture.detectChanges();
    expect(rowByLabel('remote').getAttribute('aria-busy')).toBe('true');

    // The loader is a bare promise chain (not tracked by whenStable in zoneless mode) —
    // yield a macrotask so then/finally run before asserting.
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    expect(rowByLabel('remote').getAttribute('aria-busy')).toBeNull();
    expect(rowByLabel('loaded-child')).toBeTruthy();

    // Collapse + re-expand must not refetch.
    (rowByLabel('remote').querySelector('.pixel-tree__arrow') as HTMLElement).click();
    fixture.detectChanges();
    (rowByLabel('remote').querySelector('.pixel-tree__arrow') as HTMLElement).click();
    fixture.detectChanges();
    expect(calls).toBe(1);
    expect(rowByLabel('loaded-child')).toBeTruthy();
  });

  it('renders the built-in empty state when there are no nodes', () => {
    host.nodes.set([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('pixel-empty-state')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[role="tree"]')).toBeNull();
  });
});
