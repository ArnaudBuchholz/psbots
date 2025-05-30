import type { Value } from '@psbots/engine';
import { OperatorType } from '@psbots/engine/sdk';
import type { IFunctionOperator, IInternalState } from '@psbots/engine/sdk';
import { state as displayState } from '../format.js';
import type { ReplHostDictionary } from './index.js';

export function createStateOperator({ replIO }: ReplHostDictionary): Value<'operator'> {
  return {
    type: 'operator',
    isExecutable: true,
    isReadOnly: true,
    operator: <IFunctionOperator>{
      name: 'exit',
      type: OperatorType.implementation,
      implementation: (internalState: IInternalState) => {
        displayState(replIO, internalState);
      }
    }
  };
}
