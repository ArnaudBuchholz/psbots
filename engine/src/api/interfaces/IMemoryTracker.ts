export interface IMemoryByType {
  readonly system: number;
  readonly user: number;
  readonly string: number;
}

export type MemoryType = keyof IMemoryByType;

export const SYSTEM_MEMORY_TYPE: MemoryType = 'system';
export const USER_MEMORY_TYPE: MemoryType = 'user';

export interface IMemoryTracker {
  /** Current memory usage */
  readonly used: number;
  /** Maximum memory usage so far */
  readonly peak: number;
  /** Maximum amount of memory or Infinity */
  readonly total: number;
  /** Memory by type */
  readonly byType: IMemoryByType;
}
