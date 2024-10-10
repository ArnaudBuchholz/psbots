import { ValueType } from '@psbots/engine';
import type { Value } from '@psbots/engine';
import {
  OPERATOR_STATE_CALL_BEFORE_POP,
  OPERATOR_STATE_FIRST_CALL,
  OPERATOR_STATE_POP,
  OperatorType
} from '@psbots/engine/sdk';
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
      const { calls } = state;
      if (calls.topOperatorState === OPERATOR_STATE_FIRST_CALL) {
        calls.topOperatorState = OPERATOR_STATE_CALL_BEFORE_POP;
        throw new DebugError();
      } else {
        calls.topOperatorState = OPERATOR_STATE_POP;
        state.exception = undefined;
      }
    }
  }
};
