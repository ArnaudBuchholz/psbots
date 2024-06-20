export interface IMemoryTracker {
  /** Current memory usage */
  readonly used: number;
  /** Maximum memory usage so far */
  readonly peak: number;
  /** Maximum amount of memory or Infinity */
  readonly total: number;
}
