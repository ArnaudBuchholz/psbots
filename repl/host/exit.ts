import { ValueType } from '@psbots/engine';
import type { Value } from '@psbots/engine';
import { OperatorType } from '@psbots/engine/sdk';
import type { IFunctionOperator } from '@psbots/engine/sdk';
import type { ReplHostDictionary } from './index.js';

export function createExitOperator(rh: ReplHostDictionary): Value<ValueType.operator> {
  return {
    type: ValueType.operator,
    isExecutable: true,
    isReadOnly: true,
    operator: <IFunctionOperator>{
      name: 'exit',
      type: OperatorType.implementation,
      implementation: () => rh.exit()
    }
  };
}
