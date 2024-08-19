import type { Value, ValueType } from '@api/index.js';
import type { IInternalState } from '@sdk/interfaces/IInternalState.js';
import { OperatorType } from '@sdk/interfaces/IOperator.js';
import type { IOperator } from '@sdk/interfaces/IOperator.js';

export function operatorHandler(state: IInternalState, value: Value<ValueType.operator>): void {
  const operator = value.operator as IOperator;
  if (operator.type === OperatorType.constant) {
    state.operands.push(operator.constant);
    state.calls.pop();
  } else {
    /**
     * TODO
     * - STEP 1 : validate and extract parameters
     * - STEP 2 : executes implementation
     * - If an exception occurs...
     */
    operator.implementation(state, []);
  }
}
