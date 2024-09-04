import { Value, ValueType } from '@psbots/engine';
import { IFunctionOperator, OperatorType } from '@psbots/engine/sdk';

export class ExitError extends Error {}

export const exit: Value<ValueType.operator> = {
  type: ValueType.operator,
  isExecutable: true,
  isReadOnly: true,
  operator: <IFunctionOperator> {
    name: 'exit',
    type: OperatorType.implementation,
    implementation: () => { throw new ExitError() }
  }
};
