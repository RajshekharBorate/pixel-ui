import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import PixelStepperComponent from './pixel-stepper';
import PixelStepComponent from './pixel-step';
import {
  PIXEL_UI_ANALYTICS,
  type PixelUiAnalyticsPort,
} from '../shared/analytics/pixel-ui-analytics';

@Component({
  imports: [PixelStepperComponent, PixelStepComponent],
  template: `
    <pixel-stepper #stepper analyticsId="onboarding" navigationMode="free">
      <pixel-step label="One" stepId="one">A</pixel-step>
      <pixel-step label="Two" stepId="two">B</pixel-step>
    </pixel-stepper>
  `,
})
class StepperAnalyticsHost {
  readonly stepper = viewChild.required<PixelStepperComponent>('stepper');
}

describe('pixel-stepper analytics', () => {
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

  it('emits ui.stepper.next on next', async () => {
    const fixture = TestBed.createComponent(StepperAnalyticsHost);
    fixture.detectChanges();
    const moved = await fixture.componentInstance.stepper().next();
    expect(moved).toBe(true);
    expect(port.track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ui.stepper.next',
        component: { name: 'pixel-stepper' },
        properties: expect.objectContaining({
          stepperId: 'onboarding',
          from: 0,
          to: 1,
          stepId: 'two',
        }),
      }),
    );
  });
});
