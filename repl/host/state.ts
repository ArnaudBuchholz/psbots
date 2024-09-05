import { ValueType } from '@psbots/engine';
import type { Value } from '@psbots/engine';
import { OperatorType } from '@psbots/engine/sdk';
import type { IFunctionOperator, IInternalState } from '@psbots/engine/sdk';
import { state as displayState } from '../format.js';
import type { IReplIO } from 'IReplIO.js';

export function createStateOperator(replIO: IReplIO): Value<ValueType.operator> {
  return {
    type: ValueType.operator,
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
