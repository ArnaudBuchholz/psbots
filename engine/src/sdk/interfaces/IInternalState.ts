import type { IMemoryTracker, IState } from '@api/index.js';
import type { ICallStack } from '@sdk/interfaces/ICallStack.js';
import type { IDictionaryStack } from '@sdk/interfaces/IDictionaryStack.js';
import type { IOperandStack } from '@sdk/interfaces/IOperandStack.js';

export interface IInternalState extends IState {
  readonly memoryTracker: IMemoryTracker
  readonly operands: IOperandStack
  readonly dictionaries: IDictionaryStack
  readonly calls: ICallStack
  allowCall: () => void
  preventCall: () => void
}
