import { InjectionToken, Signal } from '@angular/core';

export type PixelRadioSize = 'xs' | 'sm' | 'md' | 'lg';
export type PixelRadioVisualState = 'default' | 'disabled' | 'readonly' | 'error';
export type PixelRadioLayout = 'horizontal' | 'vertical' | 'grid';
export type PixelRadioLabelPosition = 'right' | 'left' | 'top' | 'bottom';
export type PixelRadioClassValue =
  | string
  | string[]
  | Record<string, boolean>
  | null
  | undefined;
export type PixelRadioInteractionSource = 'mouse' | 'keyboard';

export interface PixelRadioOption<T = unknown> {
  readonly value: T;
  readonly label?: string;
  readonly description?: string;
  readonly hint?: string;
  readonly disabled?: boolean;
  readonly readonly?: boolean;
  readonly icon?: string;
  readonly imageUrl?: string;
  readonly imageAlt?: string;
  readonly badge?: string;
  readonly metadata?: Record<string, unknown>;
  readonly card?: boolean;
}

export interface PixelRadioOptionGroup<T = unknown> {
  readonly label: string;
  readonly options: readonly PixelRadioOption<T>[];
}

export interface PixelRadioSelectionChangeEvent<T = unknown> {
  readonly value: T;
  readonly previousValue: T | null;
  readonly source: PixelRadioInteractionSource;
  readonly originalEvent?: Event;
}

export interface PixelRadioRegistration {
  readonly id: string;
  readonly value: () => unknown;
  readonly disabled: () => boolean;
  readonly readonly: () => boolean;
  readonly element: () => HTMLElement | null;
  focus(): void;
}

export interface PixelRadioGroupController {
  readonly selectedValue: Signal<unknown>;
  readonly name: Signal<string>;
  readonly disabled: Signal<boolean>;
  readonly readonly: Signal<boolean>;
  readonly required: Signal<boolean>;
  readonly size: Signal<PixelRadioSize>;
  readonly labelPosition: Signal<PixelRadioLabelPosition>;
  readonly bordered: Signal<boolean>;
  readonly filled: Signal<boolean>;
  readonly compact: Signal<boolean>;
  readonly card: Signal<boolean>;
  readonly state: Signal<PixelRadioVisualState>;
  readonly showErrorState: Signal<boolean>;
  valueEquals(a: unknown, b: unknown): boolean;
  isSelected(value: unknown): boolean;
  select(value: unknown, source: PixelRadioInteractionSource, event?: Event): void;
  register(radio: PixelRadioRegistration): void;
  unregister(id: string): void;
  focusNext(currentId: string, direction: 1 | -1): void;
  getTabIndex(value: unknown, disabled: boolean): number;
  markTouched(): void;
}

export const PIXEL_RADIO_GROUP = new InjectionToken<PixelRadioGroupController>(
  'PIXEL_RADIO_GROUP',
);
