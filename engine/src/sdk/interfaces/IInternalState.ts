import type { Exception, IReadOnlyCallStack, IState } from '@api/index.js';
import type { ICallStack } from '@sdk/interfaces/ICallStack.js';
import type { IDictionaryStack } from '@sdk/interfaces/IDictionaryStack.js';
import type { IStack } from '@sdk/interfaces/IStack.js';

export interface IInternalState extends IState {
  readonly operands: IStack;
  readonly dictionaries: IDictionaryStack;
  readonly calls: ICallStack;
  raiseException: (exception: Exception, stack?: IReadOnlyCallStack) => void;
  clearException: () => void;
  allowCall: () => void;
  preventCall: () => void;
}
