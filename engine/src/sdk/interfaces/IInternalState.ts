import type { IState, Result } from '@api/index.js';
import type { ICallStack } from '@sdk/interfaces/ICallStack.js';
import type { IDictionaryStack } from '@sdk/interfaces/IDictionaryStack.js';
import type { IStack } from '@sdk/interfaces/IStack.js';

export interface IInternalState extends IState {
  readonly operands: IStack;
  readonly dictionaries: IDictionaryStack;
  readonly calls: ICallStack;
  /** Throws if not a BaseException */
  raiseException: (error: unknown) => void;
  /** TODO: will simplify many operators */
  // raiseIfResultFailed: (result: Result<any>) => void;
  clearException: () => void;
  allowCall: () => void;
  preventCall: () => void;
}
