import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import PixelTabsComponent from './pixel-tabs';
import PixelTabComponent from './pixel-tab';

@Component({
  imports: [PixelTabsComponent, PixelTabComponent],
  template: `
    <pixel-tabs>
      <pixel-tab label="Open" />
      <pixel-tab label="Secret" access="admin:panel" />
    </pixel-tabs>
  `,
})
class MissingAuthHost {}

describe('PixelTabComponent authorization', () => {
  it('fail-closes interaction when access is set and evaluator is unbound', () => {
    TestBed.configureTestingModule({ imports: [MissingAuthHost] });
    const fixture = TestBed.createComponent(MissingAuthHost);
    fixture.detectChanges();
    const tabs = fixture.debugElement
      .queryAll(By.directive(PixelTabComponent))
      .map((el) => el.componentInstance as PixelTabComponent);
    expect(tabs[0].interactionDisabled()).toBe(false);
    expect(tabs[1].interactionDisabled()).toBe(true);
  });
});
