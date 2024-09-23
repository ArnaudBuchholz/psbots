export interface IMemoryByType {
  readonly system: number;
  readonly user: number;
  readonly string: number;
}

export type MemoryType = keyof IMemoryByType;

export const SYSTEM_MEMORY_TYPE: MemoryType = 'system';
export const USER_MEMORY_TYPE: MemoryType = 'user';

interface IMemoryTrackerUsage {
  /** Current memory usage */
  readonly used: number;
  /** Maximum memory usage so far */
  readonly peak: number;
  /** Maximum amount of memory or Infinity */
  readonly total: number;
  /** Memory by type */
  readonly byType: IMemoryByType;
}

type ContainerMemorySnapshot = {
  container: {
    class: string;
  };
  total: number;
}

export interface IMemorySnapshot extends IMemoryTrackerUsage {
  string: {
    /** Number of active references for this string */
    references: number;
    string: string;
    /** Size (in bytes) of the string buffer */
    size: number;
    total: number;
  }[];
  /** Available only if memory debugging is set */
  system: ContainerMemorySnapshot[];
  /** Available only if memory debugging is set */
  user: ContainerMemorySnapshot[];
}

export interface IMemoryTracker extends IMemoryTrackerUsage {
  /** Generate a snapshot of memory state (available only if memory debugging is set) */
  snapshot: () => IMemorySnapshot;
}
