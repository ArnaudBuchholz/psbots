import { ValueType } from '@psbots/engine';
import type { Value } from '@psbots/engine';
import { OperatorType, BaseException } from '@psbots/engine/sdk';
import type { IFunctionOperator } from '@psbots/engine/sdk';

export class ExitError extends BaseException {
  constructor() {
    super('exit');
  }
}

export const exit: Value<ValueType.operator> = {
  type: ValueType.operator,
  isExecutable: true,
  isReadOnly: true,
  operator: <IFunctionOperator>{
    name: 'exit',
    type: OperatorType.implementation,
    implementation: () => ({ success: false, error: new ExitError() })
  }
};
