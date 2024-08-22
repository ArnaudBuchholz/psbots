import type { Value, ValueType } from '@api/index.js';
import { TypeCheckException } from '@sdk/exceptions';
import { StackUnderflowException } from '@sdk/exceptions/StackUnderflowException.js';
import type { IInternalState } from '@sdk/interfaces/IInternalState.js';
import { OperatorType } from '@sdk/interfaces/IOperator.js';
import type { IOperator } from '@sdk/interfaces/IOperator.js';

export function operatorHandler(state: IInternalState, value: Value<ValueType.operator>): void {
  const operator = value.operator as IOperator;
  if (operator.type === OperatorType.constant) {
    state.operands.push(operator.constant);
    state.calls.pop();
  } else {
    const parameters: Value[] = [];
    if (operator.typeCheck !== undefined) {
      if (state.operands.length < operator.typeCheck.length) {
        throw new StackUnderflowException();
      }
      operator.typeCheck.forEach((valueType, index) => {
        const value = state.operands.ref[index]!; // length has been verified before
        if (valueType === null) {
          parameters.push(value);
        } else if (valueType !== value.type) {
          throw new TypeCheckException();
        }
      });
    }
    operator.implementation(state, parameters);
  }
}
