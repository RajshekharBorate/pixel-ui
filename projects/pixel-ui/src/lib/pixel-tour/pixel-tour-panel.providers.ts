import { type Provider } from '@angular/core';
import { PixelTourPanelRefBridge } from './pixel-tour-panel-ref-bridge';
import { PixelTourRef } from './pixel-tour-ref';
import { PixelTourPanelController, PIXEL_TOUR_PANEL_CONTROLLER } from './pixel-tour-panel-controller';
import { PIXEL_TOUR_VIEW_CONFIG } from './pixel-tour.types';

/** @internal Panel controller for service-mounted default and custom card hosts. */
export function provideTourPanelController(): Provider {
  return {
    provide: PIXEL_TOUR_PANEL_CONTROLLER,
    useClass: PixelTourPanelController,
  };
}

/** @internal DI for consumer-mounted {@link PixelTourPanelComponent} in headless mode. */
export function provideHeadlessTourPanel(): Provider[] {
  return [
    PixelTourPanelRefBridge,
    {
      provide: PixelTourRef,
      useFactory: (bridge: PixelTourPanelRefBridge) => bridge.ref(),
      deps: [PixelTourPanelRefBridge],
    },
    {
      provide: PIXEL_TOUR_VIEW_CONFIG,
      useFactory: (bridge: PixelTourPanelRefBridge) => bridge.view(),
      deps: [PixelTourPanelRefBridge],
    },
    provideTourPanelController(),
  ];
}
