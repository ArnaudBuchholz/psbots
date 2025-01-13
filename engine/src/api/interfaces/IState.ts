import type { IReadOnlyArray } from '@api/interfaces/IReadOnlyArray.js';
import type { IMemoryTracker } from '@api/interfaces/IMemoryTracker.js';
import type { IReadOnlyCallStack } from '@api/interfaces/IReadOnlyCallStack.js';
import type { Value } from '@api/values/Value.js';
import type { Exception } from '@api/Exception.js';
import type { Result } from '@api/Result.js';

/** Public version of the engine state */
export interface IState {
  readonly idle: boolean;
  readonly memoryTracker: IMemoryTracker;
  readonly operands: IReadOnlyArray;
  readonly dictionaries: IReadOnlyArray;
  readonly callStack: IReadOnlyCallStack;
  readonly callEnabled: boolean;
  /** Set when an exception is raised */
  readonly exception: Exception | undefined;
  readonly exceptionStack: IReadOnlyCallStack | undefined;
  /** Reset any exception, fails with invalidAccess if engine is not idle */
  exec: (value: Value) => Result<Generator, 'invalidAccess'>;
  /** Release associated memory, using the state *after* may fail */
  destroy: () => void;
}
