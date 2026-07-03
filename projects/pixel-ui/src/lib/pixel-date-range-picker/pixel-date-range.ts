/** Immutable start/end pair used by range selection strategies. */
export class PixelDateRange<D> {
  constructor(
    readonly start: D | null,
    readonly end: D | null,
  ) {}
}
