import { ValueType } from '@psbots/engine';
import type { Value } from '@psbots/engine';
import { OperatorType } from '@psbots/engine/sdk';
import type { IFunctionOperator } from '@psbots/engine/sdk';
import { enumAndDisplay } from '../format.js';
import type { ReplHostDictionary } from './index.js';

export function createPstackOperator({ replIO }: ReplHostDictionary): Value<ValueType.operator> {
  return {
    type: ValueType.operator,
    isExecutable: true,
    isReadOnly: true,
    operator: <IFunctionOperator>{
      name: 'pstack',
      type: OperatorType.implementation,
      implementation: ({ operands }) => {
        enumAndDisplay(replIO, operands, { includeDebugSource: false, includeIndex: false });
      }
    }
  };
}
