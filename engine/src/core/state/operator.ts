import type { Value, ValueType } from '@api/index.js';
import { TypeCheckException } from '@sdk/exceptions';
import { StackUnderflowException } from '@sdk/exceptions/StackUnderflowException.js';
import type { IInternalState } from '@sdk/interfaces/IInternalState.js';
import { OperatorType } from '@sdk/interfaces/IOperator.js';
import type { IOperator } from '@sdk/interfaces/IOperator.js';

export function operatorHandler(state: IInternalState, value: Value<ValueType.operator>): void {
  const { operands, calls } = state;
  const operator = value.operator as IOperator;
  if (operator.type === OperatorType.constant) {
    operands.push(operator.constant);
    calls.pop();
  } else {
    const parameters: Value[] = [];
    if (operator.typeCheck !== undefined && calls.step === undefined) {
      if (operands.length < operator.typeCheck.length) {
        throw new StackUnderflowException();
      }
      operator.typeCheck.forEach((valueType, index) => {
        const value = operands.ref[index]!; // length has been verified before
        if (valueType === null || valueType === value.type) {
          parameters.push(value);
        } else {
          throw new TypeCheckException();
        }
      });
      parameters.forEach((value) => value.tracker?.addValueRef(value));
    }
    try {
      operator.implementation(state, parameters);
    } finally {
      parameters.forEach((value) => value.tracker?.releaseValue(value));
    }
  }
}
