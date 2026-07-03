import { PixelRadioClassValue } from './pixel-radio.tokens';

export function normalizeClassValue(classValue: PixelRadioClassValue): string {
  if (!classValue) {
    return '';
  }

  if (typeof classValue === 'string') {
    return classValue.trim();
  }

  if (Array.isArray(classValue)) {
    return classValue
      .flatMap((value) => normalizeClassValue(value))
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  return Object.entries(classValue)
    .filter(([, isEnabled]) => isEnabled)
    .map(([className]) => className)
    .join(' ')
    .trim();
}

export function valuesEqual(
  compareWith: (a: unknown, b: unknown) => boolean,
  a: unknown,
  b: unknown,
): boolean {
  return compareWith(a, b);
}

export function optionTrackKey(option: { value: unknown }, index: number): string {
  const value = option.value;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return `option-${index}`;
}
