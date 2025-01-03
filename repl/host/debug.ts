import { ValueType } from '@psbots/engine';
import type { Value } from '@psbots/engine';
import { OperatorType, BaseException } from '@psbots/engine/sdk';
import type { IFunctionOperator } from '@psbots/engine/sdk';

export class DebugError extends BaseException {
  constructor() {
    super('debug');
  }
}

export const debug: Value<ValueType.operator> = {
  type: ValueType.operator,
  isExecutable: true,
  isReadOnly: true,
  operator: <IFunctionOperator>{
    name: 'debug',
    type: OperatorType.implementation,
    implementation: () => ({ success: false, error: new DebugError() })
  }
};
