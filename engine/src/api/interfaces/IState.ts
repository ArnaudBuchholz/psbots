import type { IReadOnlyArray } from '@api/interfaces/IReadOnlyArray.js';
import type { IMemoryTracker } from '@api/interfaces/IMemoryTracker.js';
import type { IException } from '@api/interfaces/IException.js';
import type { Value } from '@api/values/Value.js';

export type ValueStream = string | Value[] | Iterator<Value>;

/** Public version of the engine state */
export interface IState {
  readonly idle: boolean;
  readonly memoryTracker: IMemoryTracker;
  readonly operands: IReadOnlyArray;
  readonly dictionaries: IReadOnlyArray;
  readonly callEnabled: boolean;
  /** Set when an exception stops the current processing */
  readonly exception: IException | undefined;
  /** Reset any exception */
  process: (values: ValueStream) => Generator;
  /** Release associated memory, using the state *after* may fail */
  destroy: () => void;
}
