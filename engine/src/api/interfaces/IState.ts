import type { IReadOnlyArray } from '@api/interfaces/IReadOnlyArray.js';
import type { IMemoryTracker } from '@api/interfaces/IMemoryTracker.js';

export interface IState {
  readonly memory: IMemoryTracker;
  readonly idle: boolean;
  readonly operands: IReadOnlyArray;
  readonly dictionaries: IReadOnlyArray;
}
