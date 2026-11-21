import type { IStack } from './IStack.js';
import type { ICallStack } from './ICallStack.js';

/** Public version of the engine state */
export interface IState {
  readonly idle: boolean;
  readonly operands: IStack;
  readonly dictionaries: IStack;
  readonly calls: ICallStack;
  readonly callEnabled: boolean;
  /** Set when an exception is raised */
  // readonly exception: Exception | undefined;
  // readonly exceptionStack: IReadOnlyCallStack | undefined;
  /** Reset any exception, fails with invalidAccess if engine is not idle */
}
