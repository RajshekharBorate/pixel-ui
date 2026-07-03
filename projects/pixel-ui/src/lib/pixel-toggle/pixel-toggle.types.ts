export type PixelToggleMode = 'switch' | 'segmented';

export type PixelToggleSize = 'xs' | 'sm' | 'md' | 'lg';

export type PixelToggleLabelPosition = 'left' | 'right';

/** Switch track treatment — `labeled` renders ON/OFF copy inside the track. */
export type PixelToggleSwitchAppearance = 'default' | 'labeled';

/** Segmented track treatment — `contained` fills the track; `surface` uses a bordered surface. */
export type PixelToggleSegmentedAppearance = 'contained' | 'surface';

/** Segmented corner shape — `rounded` matches `pixel-button`; `pill` uses a full capsule. */
export type PixelToggleSegmentedShape = 'rounded' | 'pill';

export type PixelToggleClassValue =
  | string
  | string[]
  | Record<string, boolean>
  | null
  | undefined;

export type PixelToggleInteractionSource = 'mouse' | 'keyboard';

export interface PixelToggleOption<T extends string | number = string> {
  readonly value: T;
  readonly label: string;
  readonly disabled?: boolean;
  readonly icon?: string;
  readonly ariaLabel?: string;
}

export interface PixelToggleCheckedChangeEvent {
  readonly checked: boolean;
  readonly source: PixelToggleInteractionSource;
  readonly originalEvent: MouseEvent | KeyboardEvent;
}

export interface PixelToggleValueChangeEvent<T extends string | number = string | number> {
  readonly value: T;
  readonly source: PixelToggleInteractionSource;
  readonly originalEvent: MouseEvent | KeyboardEvent;
}
