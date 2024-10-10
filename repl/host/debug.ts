import { ValueType } from '@psbots/engine';
import type { Value } from '@psbots/engine';
import { OperatorType } from '@psbots/engine/sdk';
import type { IFunctionOperator } from '@psbots/engine/sdk';

export class DebugError extends Error {}

export const debug: Value<ValueType.operator> = {
  type: ValueType.operator,
  isExecutable: true,
  isReadOnly: true,
  operator: <IFunctionOperator>{
    name: 'debug',
    type: OperatorType.implementation,
    implementation: (state) => {
      throw new DebugError();
    }
  }
};
