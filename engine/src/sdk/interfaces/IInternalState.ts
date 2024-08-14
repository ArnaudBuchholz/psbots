import type { IMemoryTracker, IState } from '@api/index.js';
import type { ICallStack } from '@sdk/interfaces/ICallStack.js';
import type { IDictionaryStack } from '@sdk/interfaces/IDictionaryStack.js';
import type { IStack } from '@sdk/interfaces/IStack.js';

export interface IInternalState extends IState {
  readonly memoryTracker: IMemoryTracker;
  readonly operands: IStack;
  readonly dictionaries: IDictionaryStack;
  readonly calls: ICallStack;
  allowCall: () => void;
  preventCall: () => void;
}
