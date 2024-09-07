import type { IState } from '@api/index.js';
import type { ICallStack } from '@sdk/interfaces/ICallStack.js';
import type { IDictionaryStack } from '@sdk/interfaces/IDictionaryStack.js';
import type { IStack } from '@sdk/interfaces/IStack.js';
import type { BaseException } from '@sdk/exceptions/BaseException.js';

export interface IInternalState extends IState {
  readonly operands: IStack;
  readonly dictionaries: IDictionaryStack;
  readonly calls: ICallStack;
  exception: BaseException | undefined;
  allowCall: () => void;
  preventCall: () => void;
}
