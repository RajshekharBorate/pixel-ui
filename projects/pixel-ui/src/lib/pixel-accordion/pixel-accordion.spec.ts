import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelAccordionComponent from './pixel-accordion';
import PixelExpansionPanelComponent from './pixel-expansion-panel';

@Component({
  imports: [PixelAccordionComponent, PixelExpansionPanelComponent],
  template: `
    <pixel-accordion [multi]="multi()">
      <pixel-expansion-panel title="One">First body</pixel-expansion-panel>
      <pixel-expansion-panel title="Two">Second body</pixel-expansion-panel>
    </pixel-accordion>
  `,
})
class HostComponent {
  readonly multi = signal(false);
}

describe('PixelAccordionComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function triggers(): HTMLButtonElement[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('button.pixel-expansion__trigger'),
    );
  }

  it('renders a panel trigger per projected expansion panel', () => {
    expect(triggers()).toHaveLength(2);
    expect(triggers()[0].textContent).toContain('One');
    expect(triggers()[0].getAttribute('aria-expanded')).toBe('false');
  });

  it('expands a panel and collapses the other when multi is false', () => {
    triggers()[0].click();
    fixture.detectChanges();
    expect(triggers()[0].getAttribute('aria-expanded')).toBe('true');

    triggers()[1].click();
    fixture.detectChanges();
    expect(triggers()[1].getAttribute('aria-expanded')).toBe('true');
    expect(triggers()[0].getAttribute('aria-expanded')).toBe('false');
  });

  it('allows multiple panels open when multi is true', async () => {
    host.multi.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    triggers()[0].click();
    fixture.detectChanges();
    triggers()[1].click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(triggers()[0].getAttribute('aria-expanded')).toBe('true');
    expect(triggers()[1].getAttribute('aria-expanded')).toBe('true');
  });
});
