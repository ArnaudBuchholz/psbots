import { ValueType } from '@psbots/engine';
import type { Value } from '@psbots/engine';
import { OperatorType } from '@psbots/engine/sdk';
import type { IFunctionOperator } from '@psbots/engine/sdk';

export class ExitError extends Error {}

export const exit: Value<ValueType.operator> = {
  type: ValueType.operator,
  isExecutable: true,
  isReadOnly: true,
  operator: <IFunctionOperator>{
    name: 'exit',
    type: OperatorType.implementation,
    implementation: () => {
      throw new ExitError();
    }
  }
};
