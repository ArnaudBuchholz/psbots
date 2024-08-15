import type { IReadOnlyArray } from '@api/interfaces/IReadOnlyArray.js';
import type { IMemoryTracker } from '@api/interfaces/IMemoryTracker.js';
import type { Value } from '@api/values/Value.js';

/** Public version of the engine state */
export interface IState {
  readonly idle: boolean;
  readonly memoryTracker: IMemoryTracker;
  readonly operands: IReadOnlyArray;
  readonly dictionaries: IReadOnlyArray;
  process: (values: Value[] | Generator<Value>) => Generator;
}
