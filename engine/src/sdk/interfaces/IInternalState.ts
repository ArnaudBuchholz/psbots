import type { Exception, IReadOnlyCallStack, IState } from '@api/index.js';
import type { ICallStack } from '@sdk/interfaces/ICallStack.js';
import type { IDictionaryStack } from '@sdk/interfaces/IDictionaryStack.js';
import type { IOperandStack } from '@sdk/interfaces/IOperandStack.js';

export interface IInternalState extends IState {
  readonly operands: IOperandStack;
  readonly dictionaries: IDictionaryStack;
  readonly calls: ICallStack;
  raiseException: (exception: Exception, stack?: IReadOnlyCallStack) => void;
  clearException: () => void;
  allowCall: () => void;
  preventCall: () => void;
}
