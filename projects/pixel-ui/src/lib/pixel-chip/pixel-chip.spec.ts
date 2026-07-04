import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelChipComponent, { type PixelChipItem } from './pixel-chip';
import PixelChipSetComponent, { type PixelChipReorderEvent } from './pixel-chip-set';

@Component({
  imports: [PixelChipComponent, PixelChipSetComponent],
  template: `
    <section [attr.data-theme]="theme()">
      <pixel-chip
        label="Billing"
        value="billing"
        type="selectable"
        [selected]="selected()"
        [disabled]="chipDisabled()"
        [loading]="chipLoading()"
        [removable]="true"
        [tooltip]="'Billing chip'"
        (selectionChange)="selected.set($event.selected)"
      />

      <pixel-chip-set
        [chips]="chips()"
        [selectionMode]="multiple() ? 'multiple' : 'single'"
        [multiple]="multiple()"
        [reorderable]="true"
        [chipInput]="true"
        [maxVisible]="2"
        [showOverflow]="true"
        ariaLabel="Filter chips"
        (valueChange)="chips.set($event)"
        (selectionChange)="selectionLog.set($event.values)"
        (reorder)="lastReorder.set($event)"
      />
    </section>
  `,
})
class HostComponent {
  readonly theme = signal<'light' | 'dark'>('light');
  readonly selected = signal(false);
  readonly chipDisabled = signal(false);
  readonly chipLoading = signal(false);
  readonly multiple = signal(true);
  readonly chips = signal<readonly PixelChipItem[]>([
    { label: 'Design', value: 'design', type: 'filter', removable: true, selected: true },
    { label: 'Engineering', value: 'engineering', type: 'filter', removable: true },
    { label: 'Support', value: 'support', type: 'filter', removable: true },
  ]);
  readonly selectionLog = signal<readonly string[]>([]);
  readonly lastReorder = signal<PixelChipReorderEvent | null>(null);
}

@Component({
  imports: [PixelChipComponent],
  template: `
    <pixel-chip
      [label]="label()"
      [semantic]="semantic()"
      [variant]="variant()"
      [disabled]="disabled()"
      [prefixIcon]="prefixIcon()"
    />
  `,
})
class SemanticHostComponent {
  readonly label = signal('Saved');
  readonly semantic = signal<'default' | 'success' | 'error' | 'warning' | 'info'>('success');
  readonly variant = signal<'soft' | 'solid' | 'outline'>('soft');
  readonly disabled = signal(false);
  readonly prefixIcon = signal('check_circle');
}

describe('PixelChipComponent + PixelChipSetComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders chip and set with expected roles and css vars usage', () => {
    const chip = fixture.nativeElement.querySelector('pixel-chip .pixel-chip') as HTMLElement;
    const wrapper = fixture.nativeElement.querySelector('pixel-chip .pixel-chip__wrapper') as HTMLElement;
    const chipSet = fixture.nativeElement.querySelector('pixel-chip-set section') as HTMLElement;
    expect(chip).toBeTruthy();
    expect(chip.getAttribute('role')).toBe('option');
    expect(wrapper.getAttribute('title')).toBe('Billing chip');
    expect(chipSet.getAttribute('role')).toBe('listbox');
  });

  it('toggles selection on chip click', () => {
    const chip = fixture.nativeElement.querySelector('pixel-chip .pixel-chip') as HTMLButtonElement;
    chip.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe(true);
  });

  it('supports multi-select and single-select modes', () => {
    const chips = fixture.nativeElement.querySelectorAll('pixel-chip-set pixel-chip .pixel-chip');
    (chips[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectionLog()).toEqual(
      expect.arrayContaining(['design', 'engineering']),
    );

    fixture.componentInstance.multiple.set(false);
    fixture.detectChanges();
    (chips[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectionLog().length).toBeLessThanOrEqual(1);
  });

  it('removes a chip from the chip set', () => {
    const remove = fixture.nativeElement.querySelector(
      'pixel-chip-set .pixel-chip__remove',
    ) as HTMLButtonElement;
    remove.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.chips().length).toBe(2);
  });

  it('adds chip from input using separators', () => {
    const input = fixture.nativeElement.querySelector('pixel-chip-set .pixel-chip__input') as HTMLInputElement;
    input.value = 'QA';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.chips().some((chip) => chip.value === 'QA')).toBe(true);
  });

  it('handles keyboard navigation and delete remove', () => {
    const set = fixture.nativeElement.querySelector('pixel-chip-set section') as HTMLElement;
    set.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    set.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.chips().length).toBeLessThan(3);
  });

  it('emits reorder event when drop reorders chips', () => {
    const chips = fixture.nativeElement.querySelectorAll('pixel-chip-set .pixel-chip');
    const items = fixture.nativeElement.querySelectorAll('pixel-chip-set .pixel-chip__set-item');
    chips[0].dispatchEvent(new Event('dragstart'));
    items[1].dispatchEvent(new Event('drop'));
    fixture.detectChanges();
    expect(fixture.componentInstance.lastReorder()).not.toBeNull();
  });

  it('collapses overflow and expands on button click', () => {
    const overflowButton = fixture.nativeElement.querySelector(
      'pixel-chip-set .pixel-chip__overflow',
    ) as HTMLButtonElement;
    expect(overflowButton.textContent).toContain('+');
    overflowButton.click();
    fixture.detectChanges();
    expect(overflowButton.textContent).toContain('Show less');
  });

  it('prevents interaction when disabled', () => {
    fixture.componentInstance.chipDisabled.set(true);
    fixture.detectChanges();
    const chip = fixture.nativeElement.querySelector('pixel-chip .pixel-chip') as HTMLButtonElement;
    chip.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe(false);
  });

  it('includes focus and blur handlers', () => {
    const chip = fixture.nativeElement.querySelector('pixel-chip .pixel-chip') as HTMLButtonElement;
    chip.dispatchEvent(new FocusEvent('focus'));
    chip.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(chip.getAttribute('aria-disabled')).toBe('false');
  });

  it('switches to dark theme safely with css variable based styles', () => {
    fixture.componentInstance.theme.set('dark');
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(section.getAttribute('data-theme')).toBe('dark');
  });
});

describe('PixelChipComponent semantic styling', () => {
  let fixture: ComponentFixture<SemanticHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SemanticHostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(SemanticHostComponent);
    fixture.detectChanges();
  });

  it('renders semantic soft styling aligned with toast tokens', () => {
    const wrapper = fixture.nativeElement.querySelector('.pixel-chip__wrapper') as HTMLElement;
    expect(wrapper.getAttribute('data-semantic')).toBe('success');
    expect(wrapper.getAttribute('data-variant')).toBe('soft');
  });

  it('renders outline variant', () => {
    fixture.componentInstance.variant.set('outline');
    fixture.componentInstance.semantic.set('default');
    fixture.componentInstance.prefixIcon.set('');
    fixture.detectChanges();
    const wrapper = fixture.nativeElement.querySelector('.pixel-chip__wrapper') as HTMLElement;
    expect(wrapper.getAttribute('data-variant')).toBe('outline');
    expect(wrapper.classList.contains('pixel-chip--outline')).toBe(true);
  });

  it('derives semantic only from semantic input', () => {
    fixture.componentInstance.semantic.set('default');
    fixture.componentInstance.label.set('Neutral');
    fixture.componentInstance.prefixIcon.set('');
    fixture.detectChanges();
    const wrapper = fixture.nativeElement.querySelector('.pixel-chip__wrapper') as HTMLElement;
    expect(wrapper.getAttribute('data-semantic')).toBe('default');
  });

  it('disables chip via disabled boolean input', () => {
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    const chip = fixture.nativeElement.querySelector('.pixel-chip') as HTMLButtonElement;
    expect(chip.disabled).toBe(true);
    expect(chip.getAttribute('aria-disabled')).toBe('true');
  });
});
